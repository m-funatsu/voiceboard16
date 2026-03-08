'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';

interface Feedback {
  id: string;
  projectId: string;
  title: string;
  description: string;
  category: string;
  status: string;
  submitterEmail: string | null;
  voteCount: number;
  isApproved: boolean;
  isArchived: boolean;
  priorityScore: number;
  createdAt: string;
  updatedAt: string;
}

type Sentiment = 'positive' | 'negative' | 'neutral';

interface AnalyzedFeedback {
  feedback: Feedback;
  sentiment: Sentiment;
  score: number;
  matchedKeywords: string[];
}

const POSITIVE_KEYWORDS = [
  '嬉しい', '便利', '良い', '最高', '助かる', '素晴らしい', '気に入', '使いやすい',
  'ありがとう', '感謝', '改善', '快適', '楽', '早い', '速い', '完璧', '優秀',
  'good', 'great', 'love', 'awesome', 'nice', 'excellent', 'perfect', 'helpful',
  'amazing', 'fantastic', 'useful', 'easy', 'thank', 'best', 'wonderful',
];

const NEGATIVE_KEYWORDS = [
  '困る', '不便', '遅い', 'バグ', '問題', 'エラー', '使いにくい', '分かりにくい',
  '壊れ', '動かない', '表示されない', 'クラッシュ', '落ちる', '重い', 'フリーズ',
  '改悪', '不具合', '修正', 'fix', 'bug', 'error', 'broken', 'crash', 'slow',
  'issue', 'problem', 'fail', 'wrong', 'bad', 'terrible', 'horrible', 'worst',
  '困った', '難しい', '不満', '微妙',
];

function analyzeSentiment(text: string): { sentiment: Sentiment; score: number; matched: string[] } {
  const lower = text.toLowerCase();
  const matched: string[] = [];
  let posScore = 0;
  let negScore = 0;

  for (const kw of POSITIVE_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      posScore += 1;
      matched.push(kw);
    }
  }
  for (const kw of NEGATIVE_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      negScore += 1;
      matched.push(kw);
    }
  }

  if (posScore > negScore) {
    const score = Math.min(((posScore - negScore) / Math.max(posScore + negScore, 1)) * 100, 100);
    return { sentiment: 'positive', score: Math.round(score), matched };
  } else if (negScore > posScore) {
    const score = Math.min(((negScore - posScore) / Math.max(posScore + negScore, 1)) * 100, 100);
    return { sentiment: 'negative', score: Math.round(score), matched };
  }
  return { sentiment: 'neutral', score: 0, matched };
}

const SENTIMENT_CONFIG: Record<Sentiment, { label: string; color: string; bgColor: string; borderColor: string }> = {
  positive: { label: 'ポジティブ', color: '#22c55e', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  negative: { label: 'ネガティブ', color: '#ef4444', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  neutral: { label: 'ニュートラル', color: '#6b7280', bgColor: 'bg-slate-50', borderColor: 'border-slate-200' },
};

export default function SentimentAnalysisPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSentiment, setFilterSentiment] = useState<Sentiment | 'all'>('all');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    async function loadData() {
      setLoading(true);

      // Try localStorage first
      try {
        const localKey = `voiceboard_feedback_${projectId}`;
        const localRaw = localStorage.getItem(localKey);
        if (localRaw) {
          const parsed = JSON.parse(localRaw) as Feedback[];
          setFeedbacks(parsed);
          setLoading(false);
          return;
        }
      } catch {
        // ignore
      }

      // Try Supabase via API
      try {
        const res = await fetch(`/api/feedback?projectId=${projectId}&limit=500`);
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            setFeedbacks(data.items);
            setLoading(false);
            return;
          }
        }
      } catch {
        // ignore
      }

      // Try generic localStorage keys
      try {
        const keys = ['voiceboard_feedback', 'feedback_items'];
        for (const key of keys) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw) as Feedback[];
            const filtered = parsed.filter(f => f.projectId === projectId || !f.projectId);
            if (filtered.length > 0) {
              setFeedbacks(filtered);
              setLoading(false);
              return;
            }
          }
        }
      } catch {
        // ignore
      }

      setLoading(false);
    }

    loadData();
  }, [projectId]);

  const analyzed = useMemo(() => {
    return feedbacks.map(fb => {
      const text = `${fb.title} ${fb.description}`;
      const { sentiment, score, matched } = analyzeSentiment(text);
      return { feedback: fb, sentiment, score, matchedKeywords: matched } as AnalyzedFeedback;
    });
  }, [feedbacks]);

  const filtered = useMemo(() => {
    if (filterSentiment === 'all') return analyzed;
    return analyzed.filter(a => a.sentiment === filterSentiment);
  }, [analyzed, filterSentiment]);

  const stats = useMemo(() => {
    const positive = analyzed.filter(a => a.sentiment === 'positive').length;
    const negative = analyzed.filter(a => a.sentiment === 'negative').length;
    const neutral = analyzed.filter(a => a.sentiment === 'neutral').length;
    const total = analyzed.length;
    return { positive, negative, neutral, total };
  }, [analyzed]);

  // SVG Pie Chart
  const pieData = useMemo(() => {
    if (stats.total === 0) return [];
    const entries: { sentiment: Sentiment; count: number; pct: number; color: string }[] = [
      { sentiment: 'positive', count: stats.positive, pct: stats.positive / stats.total, color: '#22c55e' },
      { sentiment: 'negative', count: stats.negative, pct: stats.negative / stats.total, color: '#ef4444' },
      { sentiment: 'neutral', count: stats.neutral, pct: stats.neutral / stats.total, color: '#94a3b8' },
    ];
    return entries;
  }, [stats]);

  // Time series trend
  const trendData = useMemo(() => {
    if (analyzed.length === 0) return [];
    const monthMap: Record<string, { positive: number; negative: number; neutral: number; total: number }> = {};
    for (const a of analyzed) {
      const d = new Date(a.feedback.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[key]) monthMap[key] = { positive: 0, negative: 0, neutral: 0, total: 0 };
      monthMap[key][a.sentiment] += 1;
      monthMap[key].total += 1;
    }
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        label: new Date(month + '-01').toLocaleDateString('ja-JP', { month: 'short' }),
        ...data,
        positiveRate: data.total > 0 ? (data.positive / data.total) * 100 : 0,
        negativeRate: data.total > 0 ? (data.negative / data.total) * 100 : 0,
      }));
  }, [analyzed]);

  const maxTrendTotal = Math.max(...trendData.map(d => d.total), 1);

  function renderPieChart() {
    if (pieData.length === 0 || stats.total === 0) return null;

    let cumAngle = -90;
    const radius = 80;
    const cx = 100;
    const cy = 100;

    const arcs = pieData.map(slice => {
      const angle = slice.pct * 360;
      const startAngle = cumAngle;
      const endAngle = cumAngle + angle;
      cumAngle = endAngle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = cx + radius * Math.cos(startRad);
      const y1 = cy + radius * Math.sin(startRad);
      const x2 = cx + radius * Math.cos(endRad);
      const y2 = cy + radius * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;

      if (slice.pct >= 1) {
        return { d: '', color: slice.color, sentiment: slice.sentiment, pct: slice.pct, isCircle: true };
      }
      if (slice.pct <= 0) {
        return { d: '', color: slice.color, sentiment: slice.sentiment, pct: slice.pct, isCircle: false };
      }

      const d = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      return { d, color: slice.color, sentiment: slice.sentiment, pct: slice.pct, isCircle: false };
    });

    return (
      <svg viewBox="0 0 200 200" className="w-48 h-48">
        {arcs.map((arc, i) => {
          if (arc.isCircle) {
            return <circle key={i} cx={cx} cy={cy} r={radius} fill={arc.color} />;
          }
          if (arc.pct <= 0) return null;
          return <path key={i} d={arc.d} fill={arc.color} stroke="white" strokeWidth="2" />;
        })}
        <circle cx={cx} cy={cy} r="40" fill="white" />
        <text x={cx} y={cy - 5} textAnchor="middle" className="fill-slate-800" fontSize="20" fontWeight="bold">
          {stats.total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="fill-slate-500" fontSize="10">
          件
        </text>
      </svg>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50 flex items-center justify-center">
        <div className="text-slate-500">読み込み中...</div>
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center max-w-md">
          <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">フィードバックがありません</h2>
          <p className="text-slate-500 text-sm">
            このプロジェクトにフィードバックが投稿されると、センチメント分析が自動的に表示されます。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">フィードバックセンチメント分析</h1>
          <p className="text-slate-600">
            フィードバックのタイトルと本文からキーワードベースでポジティブ/ネガティブ/ニュートラルを判定します
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 text-center">
            <div className="text-xs text-slate-500 font-medium mb-1">総フィードバック数</div>
            <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-200 p-5 text-center">
            <div className="text-xs text-green-600 font-medium mb-1">ポジティブ</div>
            <div className="text-2xl font-bold text-green-700">{stats.positive}</div>
            <div className="text-xs text-green-500">{stats.total > 0 ? ((stats.positive / stats.total) * 100).toFixed(1) : 0}%</div>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-200 p-5 text-center">
            <div className="text-xs text-red-600 font-medium mb-1">ネガティブ</div>
            <div className="text-2xl font-bold text-red-700">{stats.negative}</div>
            <div className="text-xs text-red-500">{stats.total > 0 ? ((stats.negative / stats.total) * 100).toFixed(1) : 0}%</div>
          </div>
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 text-center">
            <div className="text-xs text-slate-500 font-medium mb-1">ニュートラル</div>
            <div className="text-2xl font-bold text-slate-700">{stats.neutral}</div>
            <div className="text-xs text-slate-400">{stats.total > 0 ? ((stats.neutral / stats.total) * 100).toFixed(1) : 0}%</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pie Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">センチメント比率</h2>
            <div className="flex items-center justify-center gap-8">
              {renderPieChart()}
              <div className="space-y-3">
                {pieData.map(slice => (
                  <div key={slice.sentiment} className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-sm" style={{ backgroundColor: slice.color }} />
                    <span className="text-sm text-slate-600">
                      {SENTIMENT_CONFIG[slice.sentiment].label}: {(slice.pct * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Time Series Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">時系列トレンド</h2>
            {trendData.length > 0 ? (
              <div>
                <svg viewBox="0 0 600 200" className="w-full" aria-label="センチメントトレンドグラフ">
                  {/* Grid */}
                  {[0, 1, 2, 3, 4].map(i => {
                    const y = 170 - (i / 4) * 140;
                    return (
                      <g key={i}>
                        <line x1="40" y1={y} x2="580" y2={y} stroke="#e2e8f0" strokeWidth="0.5" />
                        <text x="35" y={y + 3} textAnchor="end" className="fill-slate-400" fontSize="8">
                          {Math.round((maxTrendTotal / 4) * i)}
                        </text>
                      </g>
                    );
                  })}
                  {/* Stacked bars */}
                  {trendData.map((d, i) => {
                    const barCount = trendData.length;
                    const availW = 540;
                    const barWidth = Math.min(40, availW / barCount - 4);
                    const gap = (availW - barWidth * barCount) / Math.max(barCount - 1, 1);
                    const x = 45 + i * (barWidth + gap);
                    const totalH = (d.total / maxTrendTotal) * 140;
                    const posH = (d.positive / maxTrendTotal) * 140;
                    const negH = (d.negative / maxTrendTotal) * 140;
                    const neuH = totalH - posH - negH;

                    return (
                      <g key={d.month}>
                        {/* Negative (bottom) */}
                        <rect x={x} y={170 - negH} width={barWidth} height={negH} fill="#ef4444" rx="1" />
                        {/* Neutral (middle) */}
                        <rect x={x} y={170 - negH - neuH} width={barWidth} height={neuH} fill="#94a3b8" rx="1" />
                        {/* Positive (top) */}
                        <rect x={x} y={170 - totalH} width={barWidth} height={posH} fill="#22c55e" rx="1" />
                        <text x={x + barWidth / 2} y={185} textAnchor="middle" className="fill-slate-500" fontSize="8">
                          {d.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
                <div className="flex justify-center gap-4 mt-2 text-xs">
                  <div className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-sm" /> ポジティブ</div>
                  <div className="flex items-center gap-1"><span className="w-3 h-3 bg-slate-400 rounded-sm" /> ニュートラル</div>
                  <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-sm" /> ネガティブ</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">トレンドデータがありません</div>
            )}
          </div>
        </div>

        {/* Feedback List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-700">フィードバック一覧</h2>
            <div className="flex gap-2">
              {(['all', 'negative', 'positive', 'neutral'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterSentiment(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    filterSentiment === s
                      ? s === 'negative' ? 'bg-red-100 text-red-700'
                      : s === 'positive' ? 'bg-green-100 text-green-700'
                      : s === 'neutral' ? 'bg-slate-200 text-slate-700'
                      : 'bg-sky-100 text-sky-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s === 'all' ? '全て' : SENTIMENT_CONFIG[s].label}
                  {s === 'negative' && ` (${stats.negative})`}
                  {s === 'positive' && ` (${stats.positive})`}
                  {s === 'neutral' && ` (${stats.neutral})`}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filtered.map(item => {
              const config = SENTIMENT_CONFIG[item.sentiment];
              return (
                <div
                  key={item.feedback.id}
                  className={`border rounded-lg p-4 ${config.bgColor} ${config.borderColor} transition-colors`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: config.color }}
                        >
                          {config.label}
                        </span>
                        {item.score > 0 && (
                          <span className="text-xs text-slate-500">強度: {item.score}%</span>
                        )}
                        <span className="text-xs text-slate-400">
                          {new Date(item.feedback.createdAt).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                      <h3 className="font-medium text-slate-800 text-sm">{item.feedback.title}</h3>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{item.feedback.description}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-3 shrink-0">
                      <span className="text-xs text-slate-500">{item.feedback.voteCount}</span>
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                      </svg>
                    </div>
                  </div>
                  {item.matchedKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.matchedKeywords.map((kw, i) => {
                        const isNeg = NEGATIVE_KEYWORDS.some(nk => nk.toLowerCase() === kw.toLowerCase());
                        return (
                          <span
                            key={`${kw}-${i}`}
                            className={`px-1.5 py-0.5 text-xs rounded ${isNeg ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}
                          >
                            {kw}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-slate-400">該当するフィードバックがありません</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
