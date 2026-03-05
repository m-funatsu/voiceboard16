'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getAllFeedbackForProject } from '@/lib/storage';
import {
  analyzeSentiment,
  trackSentimentTrend,
  type FeedbackItem,
  type SentimentResult,
  type SentimentTrendPoint,
} from '@/lib/logic';
import { SENTIMENT_KEYWORDS, SENTIMENT_THRESHOLDS } from '@/data/master-data';
import StatCard from '@/components/dashboard/StatCard';
import type { Feedback } from '@/types';

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

interface AnalyzedFeedback {
  feedback: Feedback;
  sentiment: SentimentResult;
}

function SentimentBadge({ label }: { label: string }) {
  const config: Record<string, string> = {
    positive: 'bg-green-100 text-green-800',
    negative: 'bg-red-100 text-red-800',
    neutral: 'bg-gray-100 text-gray-700',
  };
  const labelJa: Record<string, string> = {
    positive: 'ポジティブ',
    negative: 'ネガティブ',
    neutral: 'ニュートラル',
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${config[label] ?? config.neutral}`}>
      {labelJa[label] ?? label}
    </span>
  );
}

function SentimentBar({ score }: { score: number }) {
  const percentage = ((score + 1) / 2) * 100;
  const color = score >= SENTIMENT_THRESHOLDS.positiveMin
    ? 'bg-green-500'
    : score <= SENTIMENT_THRESHOLDS.negativeMax
      ? 'bg-red-500'
      : 'bg-gray-400';
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 rounded-full bg-gray-100">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.max(percentage, 4)}%` }} />
      </div>
      <span className="text-xs text-gray-500">{score.toFixed(2)}</span>
    </div>
  );
}

export default function SentimentPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAllFeedbackForProject(projectId);
        setFeedback(data);
      } catch (err) {
        console.error('Failed to load feedback:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId]);

  const analyzed: AnalyzedFeedback[] = useMemo(
    () =>
      feedback.map((fb) => ({
        feedback: fb,
        sentiment: analyzeSentiment(`${fb.title} ${fb.description}`),
      })),
    [feedback],
  );

  const trend: SentimentTrendPoint[] = useMemo(
    () => trackSentimentTrend(feedback.map(feedbackToItem), period),
    [feedback, period],
  );

  const positiveCount = analyzed.filter((a) => a.sentiment.label === 'positive').length;
  const negativeCount = analyzed.filter((a) => a.sentiment.label === 'negative').length;
  const neutralCount = analyzed.filter((a) => a.sentiment.label === 'neutral').length;
  const avgScore =
    analyzed.length > 0
      ? analyzed.reduce((s, a) => s + a.sentiment.score, 0) / analyzed.length
      : 0;

  const allPositiveMatches = new Map<string, number>();
  const allNegativeMatches = new Map<string, number>();
  for (const a of analyzed) {
    for (const kw of a.sentiment.positiveMatches) {
      allPositiveMatches.set(kw, (allPositiveMatches.get(kw) ?? 0) + 1);
    }
    for (const kw of a.sentiment.negativeMatches) {
      allNegativeMatches.set(kw, (allNegativeMatches.get(kw) ?? 0) + 1);
    }
  }
  const topPositive = [...allPositiveMatches.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const topNegative = [...allNegativeMatches.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  if (loading) return <div className="text-sm text-gray-500">読み込み中...</div>;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">感情分析</h1>
          <p className="text-sm text-gray-500">フィードバックの感情傾向をリアルタイムで分析</p>
        </div>
        <Link
          href={`/projects/${projectId}`}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          プロジェクトに戻る
        </Link>
      </div>

      {/* Overview Stats */}
      <div className="mb-8 grid grid-cols-4 gap-4">
        <StatCard label="平均感情スコア" value={avgScore.toFixed(2)} icon="📊" />
        <StatCard label="ポジティブ" value={positiveCount} icon="😊" color="bg-green-100 text-green-700" />
        <StatCard label="ネガティブ" value={negativeCount} icon="😞" color="bg-red-100 text-red-700" />
        <StatCard label="ニュートラル" value={neutralCount} icon="😐" color="bg-gray-100 text-gray-700" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sentiment Trend */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 md:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">感情推移</h2>
            <div className="flex gap-1">
              {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium ${
                    period === p
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {{ daily: '日次', weekly: '週次', monthly: '月次' }[p]}
                </button>
              ))}
            </div>
          </div>
          {trend.length > 0 ? (
            <div className="space-y-2">
              {trend.map((point) => {
                const maxTotal = Math.max(...trend.map((t) => t.total), 1);
                return (
                  <div key={point.period} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-xs text-gray-500">{point.period}</span>
                    <div className="flex flex-1 items-center gap-1">
                      <div
                        className="h-4 rounded-l bg-green-400"
                        style={{ width: `${(point.positiveCount / maxTotal) * 100}%` }}
                        title={`ポジティブ: ${point.positiveCount}`}
                      />
                      <div
                        className="h-4 bg-gray-300"
                        style={{ width: `${(point.neutralCount / maxTotal) * 100}%` }}
                        title={`ニュートラル: ${point.neutralCount}`}
                      />
                      <div
                        className="h-4 rounded-r bg-red-400"
                        style={{ width: `${(point.negativeCount / maxTotal) * 100}%` }}
                        title={`ネガティブ: ${point.negativeCount}`}
                      />
                    </div>
                    <span className="w-16 shrink-0 text-right text-xs text-gray-500">
                      {point.averageSentiment.toFixed(2)}
                    </span>
                  </div>
                );
              })}
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-green-400" /> ポジティブ</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-gray-300" /> ニュートラル</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-red-400" /> ネガティブ</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">データが不足しています</p>
          )}
        </div>

        {/* Top Positive Keywords */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">よく出るポジティブワード</h2>
          {topPositive.length > 0 ? (
            <div className="space-y-2">
              {topPositive.map(([kw, count]) => (
                <div key={kw} className="flex items-center justify-between rounded bg-green-50 px-3 py-2 text-sm">
                  <span className="text-gray-700">{kw}</span>
                  <span className="font-medium text-green-700">{count}回</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">まだデータがありません</p>
          )}
        </div>

        {/* Top Negative Keywords */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">よく出るネガティブワード</h2>
          {topNegative.length > 0 ? (
            <div className="space-y-2">
              {topNegative.map(([kw, count]) => (
                <div key={kw} className="flex items-center justify-between rounded bg-red-50 px-3 py-2 text-sm">
                  <span className="text-gray-700">{kw}</span>
                  <span className="font-medium text-red-700">{count}回</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">まだデータがありません</p>
          )}
        </div>

        {/* Dictionary Reference */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 md:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">感情辞書の概要</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-green-50 p-3 text-center">
              <div className="text-2xl font-bold text-green-700">{SENTIMENT_KEYWORDS.positive.length}</div>
              <div className="text-xs text-green-600">ポジティブ語</div>
            </div>
            <div className="rounded-lg bg-red-50 p-3 text-center">
              <div className="text-2xl font-bold text-red-700">{SENTIMENT_KEYWORDS.negative.length}</div>
              <div className="text-xs text-red-600">ネガティブ語</div>
            </div>
            <div className="rounded-lg bg-yellow-50 p-3 text-center">
              <div className="text-2xl font-bold text-yellow-700">{SENTIMENT_KEYWORDS.intensifiers.length}</div>
              <div className="text-xs text-yellow-600">強調語</div>
            </div>
            <div className="rounded-lg bg-purple-50 p-3 text-center">
              <div className="text-2xl font-bold text-purple-700">{SENTIMENT_KEYWORDS.negators.length}</div>
              <div className="text-xs text-purple-600">否定語</div>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Feedback Sentiment */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">個別フィードバック感情分析</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">タイトル</th>
                <th className="px-4 py-3 font-medium text-gray-600">感情</th>
                <th className="px-4 py-3 font-medium text-gray-600">スコア</th>
                <th className="px-4 py-3 font-medium text-gray-600">キーワード</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {analyzed.slice(0, 50).map((a) => (
                <tr key={a.feedback.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="max-w-xs truncate font-medium text-gray-900">{a.feedback.title}</div>
                  </td>
                  <td className="px-4 py-3">
                    <SentimentBadge label={a.sentiment.label} />
                  </td>
                  <td className="px-4 py-3">
                    <SentimentBar score={a.sentiment.score} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {a.sentiment.positiveMatches.slice(0, 3).map((kw) => (
                        <span key={kw} className="rounded bg-green-50 px-1.5 py-0.5 text-xs text-green-700">{kw}</span>
                      ))}
                      {a.sentiment.negativeMatches.slice(0, 3).map((kw) => (
                        <span key={kw} className="rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-700">{kw}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {analyzed.length > 50 && (
          <div className="border-t border-gray-200 px-5 py-3 text-xs text-gray-400">
            上位50件を表示中（全{analyzed.length}件）
          </div>
        )}
      </div>
    </div>
  );
}
