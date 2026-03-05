'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getProjects, getAllFeedbackForProject } from '@/lib/storage';
import {
  prioritizeFeedback,
  identifyTopIssues,
  classifyFeedback,
  type FeedbackItem,
  type PrioritizedFeedback,
  type TopIssue,
} from '@/lib/logic';
import {
  PRIORITY_QUADRANTS,
  FEEDBACK_CATEGORIES,
  type PriorityQuadrant,
  type ExtendedCategory,
} from '@/data/master-data';
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

function QuadrantBadge({ quadrant }: { quadrant: PriorityQuadrant }) {
  const config = PRIORITY_QUADRANTS[quadrant];
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${config.color}`}>
      {config.labelJa}
    </span>
  );
}

function CategoryIcon({ category }: { category: ExtendedCategory }) {
  const cat = FEEDBACK_CATEGORIES[category];
  if (!cat) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cat.color}`}>
      {cat.icon} {cat.labelJa}
    </span>
  );
}

export default function PriorityPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [activeQuadrant, setActiveQuadrant] = useState<PriorityQuadrant | 'all'>('all');

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

  const prioritized: PrioritizedFeedback[] = useMemo(
    () => prioritizeFeedback(items),
    [items],
  );

  const topIssues: TopIssue[] = useMemo(
    () => identifyTopIssues(items),
    [items],
  );

  // Classify each feedback item for category display
  const classificationMap = useMemo(() => {
    const map = new Map<string, ExtendedCategory>();
    for (const item of items) {
      const result = classifyFeedback(`${item.title} ${item.description}`);
      map.set(item.id, result.category);
    }
    return map;
  }, [items]);

  const quadrantCounts: Record<PriorityQuadrant, number> = useMemo(() => {
    const counts: Record<PriorityQuadrant, number> = { critical: 0, strategic: 0, quick_win: 0, backlog: 0 };
    for (const p of prioritized) {
      counts[p.quadrant]++;
    }
    return counts;
  }, [prioritized]);

  const filteredPrioritized = activeQuadrant === 'all'
    ? prioritized
    : prioritized.filter((p) => p.quadrant === activeQuadrant);

  if (loading) return <div className="text-sm text-gray-500">読み込み中...</div>;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">優先度マトリクス</h1>
        <p className="text-sm text-gray-500">インパクトと頻度に基づくフィードバックの優先順位付け</p>
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

      {!loadingFeedback && prioritized.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="mb-2 text-4xl">📋</div>
          <h3 className="mb-1 text-lg font-semibold text-gray-900">フィードバックがありません</h3>
          <p className="text-sm text-gray-500">プロジェクトにフィードバックが登録されると優先度分析が表示されます。</p>
        </div>
      )}

      {prioritized.length > 0 && (
        <div className="space-y-6">
          {/* Quadrant Summary */}
          <div className="grid grid-cols-4 gap-4">
            {(Object.keys(PRIORITY_QUADRANTS) as PriorityQuadrant[]).map((q) => {
              const config = PRIORITY_QUADRANTS[q];
              return (
                <button
                  key={q}
                  onClick={() => setActiveQuadrant(activeQuadrant === q ? 'all' : q)}
                  className={`rounded-xl border p-4 text-center transition-all ${
                    activeQuadrant === q ? 'ring-2 ring-indigo-500 border-indigo-300' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl font-bold text-gray-900">{quadrantCounts[q]}</div>
                  <div className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${config.color}`}>
                    {config.labelJa}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Quadrant Description */}
          {activeQuadrant !== 'all' && (
            <div className={`rounded-lg border px-4 py-3 text-sm ${PRIORITY_QUADRANTS[activeQuadrant].color}`}>
              <div className="font-medium">{PRIORITY_QUADRANTS[activeQuadrant].description}</div>
              <div className="mt-1 text-xs opacity-80">{PRIORITY_QUADRANTS[activeQuadrant].actionAdvice}</div>
            </div>
          )}

          {/* Top Issues */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">上位課題（クラスタ分析）</h2>
            {topIssues.length > 0 ? (
              <div className="space-y-3">
                {topIssues.map((issue, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-gray-900">{issue.title}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{issue.occurrences}件の類似報告</span>
                          <span>|</span>
                          <span>{issue.totalVotes}票</span>
                          <span>|</span>
                          <span>感情: {issue.averageSentiment.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <CategoryIcon category={issue.category} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">データが不足しています</p>
            )}
          </div>

          {/* Prioritized List */}
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                優先度ランキング
                {activeQuadrant !== 'all' && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    （{PRIORITY_QUADRANTS[activeQuadrant].labelJa}のみ表示）
                  </span>
                )}
              </h2>
              {activeQuadrant !== 'all' && (
                <button
                  onClick={() => setActiveQuadrant('all')}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  フィルター解除
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-600">タイトル</th>
                    <th className="px-4 py-3 font-medium text-gray-600">象限</th>
                    <th className="px-4 py-3 font-medium text-gray-600">カテゴリ</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">インパクト</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">頻度</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">優先度</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPrioritized.slice(0, 50).map((p) => {
                    const cat = classificationMap.get(p.item.id) ?? 'feature';
                    return (
                      <tr key={p.item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="max-w-xs truncate font-medium text-gray-900">{p.item.title}</div>
                        </td>
                        <td className="px-4 py-3">
                          <QuadrantBadge quadrant={p.quadrant} />
                        </td>
                        <td className="px-4 py-3">
                          <CategoryIcon category={cat} />
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-700">{p.impactScore.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{p.frequencyScore}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-indigo-600">{p.priorityScore.toFixed(1)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredPrioritized.length > 50 && (
              <div className="border-t border-gray-200 px-5 py-3 text-xs text-gray-400">
                上位50件を表示中（全{filteredPrioritized.length}件）
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
