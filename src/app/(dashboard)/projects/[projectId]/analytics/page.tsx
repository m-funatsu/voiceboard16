'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getAllFeedbackForProject, getProjectStats } from '@/lib/storage';
import StatCard from '@/components/dashboard/StatCard';
import type { Feedback, FeedbackCategory, FeedbackStatus } from '@/types';
import { CATEGORY_CONFIG, STATUS_CONFIG } from '@/types';

export default function AnalyticsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<{ totalFeedback: number; totalVotes: number; statusCounts: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [f, s] = await Promise.all([getAllFeedbackForProject(projectId), getProjectStats(projectId)]);
        setFeedback(f);
        setStats(s);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId]);

  if (loading) return <div className="text-sm text-gray-500">読み込み中...</div>;
  if (!stats) return <div className="text-sm text-red-500">データの読み込みに失敗しました</div>;

  // Category distribution
  const categoryCounts: Record<FeedbackCategory, number> = { bug: 0, feature: 0, improvement: 0 };
  for (const item of feedback) {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
  }

  // Submissions per week (last 8 weeks)
  const weeklyData: { week: string; count: number }[] = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const count = feedback.filter(
      (f) => new Date(f.createdAt) >= weekStart && new Date(f.createdAt) < weekEnd
    ).length;
    weeklyData.push({
      week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
      count,
    });
  }

  // Top voted
  const topVoted = [...feedback].sort((a, b) => b.voteCount - a.voteCount).slice(0, 5);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">アナリティクス</h1>

      {/* Overview stats */}
      <div className="mb-8 grid grid-cols-4 gap-4">
        <StatCard label="総フィードバック" value={stats.totalFeedback} icon="💬" />
        <StatCard label="総投票数" value={stats.totalVotes} icon="👍" color="bg-green-100 text-green-700" />
        <StatCard label="未対応" value={stats.statusCounts.open || 0} icon="📬" color="bg-yellow-100 text-yellow-700" />
        <StatCard label="完了" value={stats.statusCounts.completed || 0} icon="✅" color="bg-emerald-100 text-emerald-700" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Category distribution */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">カテゴリ分布</h2>
          <div className="space-y-3">
            {(Object.entries(categoryCounts) as [FeedbackCategory, number][]).map(([cat, count]) => {
              const pct = stats.totalFeedback > 0 ? (count / stats.totalFeedback) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-700">{CATEGORY_CONFIG[cat].labelJa}</span>
                    <span className="text-gray-500">{count} ({Math.round(pct)}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-indigo-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status distribution */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">ステータス分布</h2>
          <div className="space-y-3">
            {(Object.entries(stats.statusCounts) as [FeedbackStatus, number][]).map(([st, count]) => {
              const pct = stats.totalFeedback > 0 ? (count / stats.totalFeedback) * 100 : 0;
              return (
                <div key={st}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-700">{STATUS_CONFIG[st]?.labelJa || st}</span>
                    <span className="text-gray-500">{count} ({Math.round(pct)}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly submissions */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">週間投稿数</h2>
          <div className="flex items-end gap-2 h-32">
            {weeklyData.map((w, i) => {
              const maxCount = Math.max(...weeklyData.map((d) => d.count), 1);
              const height = (w.count / maxCount) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="text-xs text-gray-500 mb-1">{w.count}</div>
                  <div
                    className="w-full rounded-t bg-indigo-400"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  <div className="text-xs text-gray-400 mt-1">{w.week}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top voted */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">人気のフィードバック</h2>
          <div className="space-y-2">
            {topVoted.map((item, i) => (
              <div key={item.id} className="flex items-center justify-between rounded bg-gray-50 px-3 py-2 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0 text-gray-400">{i + 1}.</span>
                  <span className="truncate text-gray-700">{item.title}</span>
                </div>
                <span className="shrink-0 ml-2 font-medium text-indigo-600">👍 {item.voteCount}</span>
              </div>
            ))}
            {topVoted.length === 0 && (
              <p className="text-sm text-gray-400">まだデータがありません</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
