'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getProjects, getAllFeedbackForProject } from '@/lib/storage';
import {
  detectUrgent,
  calculateResponseRate,
  type FeedbackItem,
  type UrgencyResult,
  type ResponseRateResult,
} from '@/lib/logic';
import { URGENCY_RULES, ADVISORY_CONFIG } from '@/data/master-data';
import StatCard from '@/components/dashboard/StatCard';
import type { Project, Feedback } from '@/types';

function feedbackToItem(fb: Feedback): FeedbackItem {
  return {
    id: fb.id,
    title: fb.title,
    description: fb.description,
    category: fb.category,
    status: fb.status,
    voteCount: fb.voteCount,
    createdAt: fb.createdAt,
    updatedAt: fb.updatedAt,
  };
}

interface UrgentFeedback {
  item: FeedbackItem;
  urgency: UrgencyResult;
}

function SeverityBadge({ severity }: { severity: 'critical' | 'high' | 'medium' | 'low' }) {
  const config: Record<string, { bg: string; label: string }> = {
    critical: { bg: 'bg-red-100 text-red-800 border-red-300', label: '緊急' },
    high: { bg: 'bg-orange-100 text-orange-800 border-orange-300', label: '高' },
    medium: { bg: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: '中' },
    low: { bg: 'bg-gray-100 text-gray-600 border-gray-300', label: '低' },
  };
  const c = config[severity];
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${c.bg}`}>
      {c.label}
    </span>
  );
}

export default function UrgencyPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'high' | 'medium'>('all');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const projectList = await getProjects(user.id);
        setProjects(projectList);
        if (projectList.length > 0) setSelectedProjectId(projectList[0].id);
      } catch (err) {
        console.error('Failed to load projects:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    if (!selectedProjectId) return;
    const load = async () => {
      setLoadingFeedback(true);
      try {
        const data = await getAllFeedbackForProject(selectedProjectId);
        setFeedback(data);
      } catch (err) {
        console.error('Failed to load feedback:', err);
      } finally {
        setLoadingFeedback(false);
      }
    };
    load();
  }, [selectedProjectId]);

  const items = useMemo(() => feedback.map(feedbackToItem), [feedback]);

  const responseRate: ResponseRateResult = useMemo(
    () => calculateResponseRate(items),
    [items],
  );

  const urgentItems: UrgentFeedback[] = useMemo(() => {
    const results: UrgentFeedback[] = [];
    for (const item of items) {
      const urgency = detectUrgent(item);
      if (urgency.isUrgent) {
        results.push({ item, urgency });
      }
    }
    // Sort by severity order
    const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    results.sort((a, b) => order[a.urgency.severity] - order[b.urgency.severity]);
    return results;
  }, [items]);

  const severityCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0 };
    for (const u of urgentItems) {
      if (u.urgency.severity in counts) {
        counts[u.urgency.severity as keyof typeof counts]++;
      }
    }
    return counts;
  }, [urgentItems]);

  const filteredUrgent = filterSeverity === 'all'
    ? urgentItems
    : urgentItems.filter((u) => u.urgency.severity === filterSeverity);

  if (loading) return <div className="text-sm text-gray-500">読み込み中...</div>;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">緊急度検出 / 対応率</h1>
        <p className="text-sm text-gray-500">緊急対応が必要なフィードバックの自動検出とチームの対応状況</p>
      </div>

      {/* Project Selector */}
      <div className="mb-6">
        <label className="mb-1 block text-sm font-medium text-gray-700">プロジェクト</label>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {loadingFeedback && <div className="text-sm text-gray-500">データを分析中...</div>}

      {!loadingFeedback && items.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="mb-2 text-4xl">🔍</div>
          <h3 className="mb-1 text-lg font-semibold text-gray-900">フィードバックがありません</h3>
          <p className="text-sm text-gray-500">プロジェクトにフィードバックが登録されると緊急度分析が表示されます。</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-6">
          {/* Response Rate Summary */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">対応率サマリー</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard label="対応率" value={`${responseRate.responseRate}%`} icon="📈" color="bg-green-100 text-green-700" />
              <StatCard label="対応済み" value={responseRate.respondedCount} icon="✅" />
              <StatCard label="未対応" value={responseRate.unrepondedCount} icon="📬" color="bg-yellow-100 text-yellow-700" />
              <StatCard label="期限超過" value={responseRate.overdueCount} icon="⏰" color="bg-red-100 text-red-700" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="text-sm text-gray-500">平均対応時間</div>
                <div className="text-xl font-bold text-gray-900">
                  {responseRate.averageResponseTimeHours !== null
                    ? `${responseRate.averageResponseTimeHours}時間`
                    : 'データなし'}
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="text-sm text-gray-500">警告閾値</div>
                <div className="text-xl font-bold text-gray-900">{ADVISORY_CONFIG.unrespondedWarningDays}日</div>
                <div className="text-xs text-gray-400">未対応フィードバック警告基準</div>
              </div>
            </div>
            {/* Response Rate Bar */}
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-gray-500">
                <span>対応率</span>
                <span>{responseRate.responseRate}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full transition-all ${
                    responseRate.responseRate >= 80 ? 'bg-green-500'
                    : responseRate.responseRate >= 50 ? 'bg-yellow-500'
                    : 'bg-red-500'
                  }`}
                  style={{ width: `${responseRate.responseRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Urgency Summary */}
          <div className="grid grid-cols-4 gap-4">
            <button
              onClick={() => setFilterSeverity(filterSeverity === 'all' ? 'all' : 'all')}
              className={`rounded-xl border p-4 text-center ${filterSeverity === 'all' ? 'ring-2 ring-indigo-500 border-indigo-300' : 'border-gray-200'}`}
            >
              <div className="text-2xl font-bold text-gray-900">{urgentItems.length}</div>
              <div className="text-xs text-gray-500">緊急合計</div>
            </button>
            {(['critical', 'high', 'medium'] as const).map((sev) => {
              const colors: Record<string, string> = {
                critical: 'text-red-700',
                high: 'text-orange-700',
                medium: 'text-yellow-700',
              };
              const labels: Record<string, string> = {
                critical: '緊急',
                high: '高',
                medium: '中',
              };
              return (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(filterSeverity === sev ? 'all' : sev)}
                  className={`rounded-xl border p-4 text-center ${filterSeverity === sev ? 'ring-2 ring-indigo-500 border-indigo-300' : 'border-gray-200'}`}
                >
                  <div className={`text-2xl font-bold ${colors[sev]}`}>{severityCounts[sev]}</div>
                  <div className="text-xs text-gray-500">{labels[sev]}</div>
                </button>
              );
            })}
          </div>

          {/* Urgency Rules Reference */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">緊急度判定ルール</h2>
            <div className="space-y-2">
              {URGENCY_RULES.map((rule, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900">{rule.description}</div>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {rule.pattern.map((p) => (
                        <span key={p} className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600">{p}</span>
                      ))}
                    </div>
                  </div>
                  <SeverityBadge severity={rule.severity} />
                </div>
              ))}
            </div>
          </div>

          {/* Urgent Feedback List */}
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                緊急対応フィードバック
                {filterSeverity !== 'all' && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    （{filterSeverity === 'critical' ? '緊急' : filterSeverity === 'high' ? '高' : '中'}のみ）
                  </span>
                )}
              </h2>
              {filterSeverity !== 'all' && (
                <button onClick={() => setFilterSeverity('all')} className="text-xs text-indigo-600 hover:text-indigo-800">
                  フィルター解除
                </button>
              )}
            </div>
            {filteredUrgent.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {filteredUrgent.map((u) => (
                  <div key={u.item.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <SeverityBadge severity={u.urgency.severity} />
                          <span className="font-medium text-gray-900 truncate">{u.item.title}</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{u.item.description}</p>
                        <div className="mt-2 space-y-1">
                          {u.urgency.reasons.map((reason, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                              <span className="mt-0.5 shrink-0 text-orange-400">\u26A0</span>
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                        {u.urgency.matchedPatterns.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {u.urgency.matchedPatterns.map((p) => (
                              <span key={p} className="rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-700">{p}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 text-right text-xs text-gray-400">
                        <div>{u.item.voteCount}票</div>
                        <div className="mt-0.5">{new Date(u.item.createdAt).toLocaleDateString('ja-JP')}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-12 text-center">
                <div className="mb-2 text-3xl">✅</div>
                <p className="text-sm text-gray-500">緊急対応が必要なフィードバックはありません</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
