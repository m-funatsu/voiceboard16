'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getProjects, getAllFeedbackForProject } from '@/lib/storage';
import {
  generateAdvisory,
  type FeedbackItem,
  type AdvisoryReport,
  type NPSResponse,
} from '@/lib/logic';
import { NPS_BENCHMARKS } from '@/data/master-data';
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

function ChurnBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    high: { bg: 'bg-red-100', text: 'text-red-800', label: '高リスク' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '中リスク' },
    low: { bg: 'bg-green-100', text: 'text-green-800', label: '低リスク' },
  };
  const c = config[level];
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

function TrendBadge({ trend }: { trend: 'improving' | 'declining' | 'stable' }) {
  const config: Record<string, { bg: string; text: string; label: string; arrow: string }> = {
    improving: { bg: 'bg-green-100', text: 'text-green-800', label: '上昇傾向', arrow: '\u2191' },
    declining: { bg: 'bg-red-100', text: 'text-red-800', label: '下降傾向', arrow: '\u2193' },
    stable: { bg: 'bg-gray-100', text: 'text-gray-700', label: '安定', arrow: '\u2192' },
  };
  const c = config[trend];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${c.bg} ${c.text}`}>
      <span>{c.arrow}</span>
      {c.label}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const config: Record<string, string> = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-gray-100 text-gray-600',
  };
  const labelMap: Record<string, string> = {
    critical: '緊急',
    high: '高',
    medium: '中',
    low: '低',
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${config[severity] ?? config.low}`}>
      {labelMap[severity] ?? severity}
    </span>
  );
}

export default function AdvisoryPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [industry, setIndustry] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const projectList = await getProjects(user.id);
        setProjects(projectList);
        if (projectList.length > 0) {
          setSelectedProjectId(projectList[0].id);
        }
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

  const report: AdvisoryReport | null = useMemo(() => {
    if (feedback.length === 0) return null;
    const items = feedback.map(feedbackToItem);
    // Generate mock NPS responses from feedback vote patterns for demo
    const npsResponses: NPSResponse[] = feedback.map((fb) => ({
      score: Math.min(10, Math.max(0, Math.round(fb.voteCount > 3 ? 8 + Math.random() * 2 : 4 + Math.random() * 4))),
      date: fb.createdAt,
    }));
    return generateAdvisory(items, npsResponses, undefined, industry || undefined);
  }, [feedback, industry]);

  if (loading) return <div className="text-sm text-gray-500">読み込み中...</div>;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">アドバイザリーレポート</h1>
        <p className="text-sm text-gray-500">フィードバックデータから経営判断に必要な洞察を自動生成します</p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
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
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">業界（NPS比較用）</label>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">指定なし</option>
            {NPS_BENCHMARKS.map((b) => (
              <option key={b.industry} value={b.industryJa}>{b.industryJa}</option>
            ))}
          </select>
        </div>
      </div>

      {loadingFeedback && <div className="text-sm text-gray-500">フィードバックを分析中...</div>}

      {!loadingFeedback && !report && (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="mb-2 text-4xl">📋</div>
          <h3 className="mb-1 text-lg font-semibold text-gray-900">分析データがありません</h3>
          <p className="text-sm text-gray-500">プロジェクトにフィードバックが登録されるとレポートが生成されます。</p>
        </div>
      )}

      {report && (
        <div className="space-y-6">
          {/* NPS Summary */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">NPS概況</h2>
            <div className="mb-4 grid grid-cols-3 gap-4">
              <StatCard
                label="現在のNPS"
                value={report.nps.current !== null ? report.nps.current : '-'}
                icon="📈"
              />
              <StatCard
                label="前期NPS"
                value={report.nps.previousPeriod !== null ? report.nps.previousPeriod : '-'}
                icon="📉"
                color="bg-gray-100 text-gray-700"
              />
              <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-4">
                <div className="mb-1 text-xs text-gray-500">トレンド</div>
                <TrendBadge trend={report.nps.trend} />
              </div>
            </div>
            <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
              {report.nps.benchmarkComparison}
            </div>
          </div>

          {/* Sentiment Trend */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">感情トレンド</h2>
            <div className="mb-3 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{report.sentimentTrend.currentPositiveRate}%</div>
                <div className="text-xs text-gray-500">現在のポジティブ率</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{report.sentimentTrend.previousPositiveRate}%</div>
                <div className="text-xs text-gray-500">前期ポジティブ率</div>
              </div>
            </div>
            <div className="rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
              {report.sentimentTrend.changeDescription}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Requests */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">上位要望</h2>
              {report.topRequests.length > 0 ? (
                <div className="space-y-2">
                  {report.topRequests.map((r) => (
                    <div key={r.rank} className="flex items-center justify-between rounded bg-blue-50 px-3 py-2 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0 text-blue-400 font-medium">{r.rank}.</span>
                        <span className="truncate text-gray-700">{r.title}</span>
                      </div>
                      <span className="shrink-0 ml-2 text-xs text-blue-600">{r.votes}票</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">要望データなし</p>
              )}
            </div>

            {/* Top Complaints */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">上位不満</h2>
              {report.topComplaints.length > 0 ? (
                <div className="space-y-2">
                  {report.topComplaints.map((c) => (
                    <div key={c.rank} className="flex items-center justify-between rounded bg-red-50 px-3 py-2 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0 text-red-400 font-medium">{c.rank}.</span>
                        <span className="truncate text-gray-700">{c.title}</span>
                      </div>
                      <span className="shrink-0 ml-2 text-xs text-red-600">{c.votes}票</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">不満データなし</p>
              )}
            </div>
          </div>

          {/* Unresolved Warnings */}
          {report.unresolvedWarnings.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">未対応フィードバック警告</h2>
              <div className="space-y-2">
                {report.unresolvedWarnings.map((w) => (
                  <div key={w.id} className="flex items-center justify-between rounded bg-yellow-50 px-4 py-3 text-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <SeverityBadge severity={w.severity} />
                      <span className="truncate text-gray-700">{w.title}</span>
                    </div>
                    <span className="shrink-0 ml-2 text-xs text-yellow-700">{w.daysSinceCreated}日経過</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Roadmap Suggestions */}
          {report.roadmapSuggestions.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">ロードマップ提案</h2>
              <div className="space-y-3">
                {report.roadmapSuggestions.map((s) => (
                  <div key={s.priority} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                        {s.priority}
                      </span>
                      <span className="font-medium text-gray-900">{s.action}</span>
                    </div>
                    <p className="mb-1 text-sm text-gray-600">{s.rationale}</p>
                    <span className="text-xs text-indigo-600 font-medium">{s.estimatedImpact}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Churn Risk */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">チャーンリスク評価</h2>
              <ChurnBadge level={report.churnRisk.level} />
            </div>
            <div className="mb-3 rounded-lg bg-gray-50 p-4 text-center">
              <div className="text-3xl font-bold text-gray-900">{report.churnRisk.negativeRate}%</div>
              <div className="text-xs text-gray-500">ネガティブフィードバック率</div>
            </div>
            {report.churnRisk.indicators.length > 0 && (
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-700">リスク指標:</div>
                {report.churnRisk.indicators.map((indicator, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-0.5 shrink-0 text-red-400">\u26A0</span>
                    <span>{indicator}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Report Metadata */}
          <div className="text-right text-xs text-gray-400">
            レポート生成日時: {new Date(report.generatedAt).toLocaleString('ja-JP')}
          </div>
        </div>
      )}
    </div>
  );
}
