'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

// ── Types ──────────────────────────────────────────
interface FeedbackItem {
  id: string;
  title: string;
  source: string;
  stage: Stage;
  createdAt: string;
  stageHistory: StageChange[];
  priority: 'high' | 'medium' | 'low';
  category: string;
}

interface StageChange {
  stage: Stage;
  timestamp: string;
}

type Stage = 'received' | 'triaged' | 'planned' | 'in-progress' | 'shipped' | 'measured';

interface StageMetrics {
  stage: Stage;
  count: number;
  avgDays: number;
  conversionRate: number;
  dropOffRate: number;
}

const STORAGE_KEY = 'voiceboard-feedback-funnel';

const STAGES: Stage[] = ['received', 'triaged', 'planned', 'in-progress', 'shipped', 'measured'];

const STAGE_LABELS: Record<Stage, string> = {
  received: '受信',
  triaged: 'トリアージ',
  planned: '計画',
  'in-progress': '進行中',
  shipped: 'リリース',
  measured: '効果測定',
};

const STAGE_COLORS: Record<Stage, string> = {
  received: '#6366f1',
  triaged: '#3b82f6',
  planned: '#06b6d4',
  'in-progress': '#eab308',
  shipped: '#22c55e',
  measured: '#8b5cf6',
};

const PRIORITY_LABELS: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const PRIORITY_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#eab308',
  low: '#22c55e',
};

const CATEGORIES = ['UX改善', 'バグ報告', '機能要望', 'パフォーマンス', 'セキュリティ', 'ドキュメント', 'その他'];

// ── Calculation Logic ──────────────────────────────
function calculateStageMetrics(items: FeedbackItem[]): StageMetrics[] {
  const metrics: StageMetrics[] = [];
  const stageIndex: Record<string, number> = {};
  for (let i = 0; i < STAGES.length; i++) {
    stageIndex[STAGES[i]] = i;
  }

  for (let si = 0; si < STAGES.length; si++) {
    const stage = STAGES[si];

    // Count items that have reached this stage or beyond
    let reachedCount = 0;
    let totalDays = 0;
    let daysCount = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const currentIdx = stageIndex[item.stage];
      if (currentIdx >= si) {
        reachedCount++;
      }

      // Calculate time spent in this stage
      for (let h = 0; h < item.stageHistory.length; h++) {
        if (item.stageHistory[h].stage === stage && h + 1 < item.stageHistory.length) {
          const start = new Date(item.stageHistory[h].timestamp).getTime();
          const end = new Date(item.stageHistory[h + 1].timestamp).getTime();
          const days = (end - start) / (1000 * 60 * 60 * 24);
          totalDays += days;
          daysCount++;
        }
      }
    }

    const prevCount = si === 0 ? items.length : metrics[si - 1].count;
    const conversionRate = prevCount > 0 ? Math.round((reachedCount / prevCount) * 100 * 10) / 10 : 0;
    const dropOffRate = prevCount > 0 ? Math.round(((prevCount - reachedCount) / prevCount) * 100 * 10) / 10 : 0;
    const avgDays = daysCount > 0 ? Math.round((totalDays / daysCount) * 10) / 10 : 0;

    metrics.push({ stage, count: reachedCount, avgDays, conversionRate, dropOffRate });
  }

  return metrics;
}

function calculateFeedbackVelocity(items: FeedbackItem[]): number {
  // Items shipped per month (last 30 days)
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  let shippedCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    for (let h = 0; h < item.stageHistory.length; h++) {
      if (
        item.stageHistory[h].stage === 'shipped' &&
        new Date(item.stageHistory[h].timestamp).getTime() > thirtyDaysAgo
      ) {
        shippedCount++;
        break;
      }
    }
  }

  return shippedCount;
}

function identifyBottleneck(metrics: StageMetrics[]): { stage: Stage; reason: string } | null {
  let worstIdx = -1;
  let worstDrop = 0;
  let worstTime = 0;
  let worstTimeIdx = -1;

  for (let i = 1; i < metrics.length; i++) {
    if (metrics[i].dropOffRate > worstDrop) {
      worstDrop = metrics[i].dropOffRate;
      worstIdx = i;
    }
    if (metrics[i].avgDays > worstTime) {
      worstTime = metrics[i].avgDays;
      worstTimeIdx = i;
    }
  }

  if (worstIdx >= 0 && worstDrop > 30) {
    return {
      stage: metrics[worstIdx].stage,
      reason: STAGE_LABELS[metrics[worstIdx].stage] + 'ステージでの脱落率が' + worstDrop + '%と高い',
    };
  }
  if (worstTimeIdx >= 0 && worstTime > 7) {
    return {
      stage: metrics[worstTimeIdx].stage,
      reason: STAGE_LABELS[metrics[worstTimeIdx].stage] + 'ステージの平均滞留が' + worstTime + '日と長い',
    };
  }
  return null;
}

function getStageSuggestions(metrics: StageMetrics[]): Array<{ stage: Stage; suggestion: string }> {
  const suggestions: Array<{ stage: Stage; suggestion: string }> = [];

  for (let i = 0; i < metrics.length; i++) {
    const m = metrics[i];
    if (m.dropOffRate > 50) {
      suggestions.push({
        stage: m.stage,
        suggestion: STAGE_LABELS[m.stage] + ': 脱落率' + m.dropOffRate + '%。判断基準の明確化とプロセスの簡略化を検討してください。',
      });
    } else if (m.dropOffRate > 30) {
      suggestions.push({
        stage: m.stage,
        suggestion: STAGE_LABELS[m.stage] + ': 脱落率' + m.dropOffRate + '%。優先度判定基準の見直しを推奨します。',
      });
    }
    if (m.avgDays > 14) {
      suggestions.push({
        stage: m.stage,
        suggestion: STAGE_LABELS[m.stage] + ': 平均' + m.avgDays + '日滞留。SLAの設定またはリソース増強を検討してください。',
      });
    } else if (m.avgDays > 7) {
      suggestions.push({
        stage: m.stage,
        suggestion: STAGE_LABELS[m.stage] + ': 平均' + m.avgDays + '日。週次レビューの導入で改善可能です。',
      });
    }
  }

  if (suggestions.length === 0) {
    suggestions.push({
      stage: 'received',
      suggestion: 'ファネル全体のパフォーマンスは良好です。現在のプロセスを維持してください。',
    });
  }

  return suggestions;
}

// ── SVG Funnel ─────────────────────────────────────
function FunnelChart({ metrics }: { metrics: StageMetrics[] }) {
  if (metrics.length === 0 || metrics[0].count === 0) {
    return (
      <div className="text-center text-gray-500 text-sm py-12">
        フィードバックを追加してファネルを表示
      </div>
    );
  }

  const width = 500;
  const height = 320;
  const padT = 10;
  const padB = 10;
  const centerX = width / 2;
  const rowH = (height - padT - padB) / metrics.length;
  const maxWidth = 360;
  const minWidth = 100;
  const maxCount = Math.max(1, metrics[0].count);

  return (
    <svg width="100%" viewBox={'0 0 ' + width + ' ' + height}>
      {metrics.map((m, i) => {
        const ratio = m.count / maxCount;
        const segW = minWidth + (maxWidth - minWidth) * ratio;
        const nextRatio = i + 1 < metrics.length ? metrics[i + 1].count / maxCount : ratio * 0.8;
        const nextW = minWidth + (maxWidth - minWidth) * nextRatio;
        const y = padT + i * rowH;
        const nextY = y + rowH;

        const x1 = centerX - segW / 2;
        const x2 = centerX + segW / 2;
        const x3 = centerX + nextW / 2;
        const x4 = centerX - nextW / 2;

        const path = 'M ' + x1 + ' ' + y + ' L ' + x2 + ' ' + y + ' L ' + x3 + ' ' + nextY + ' L ' + x4 + ' ' + nextY + ' Z';

        return (
          <g key={i}>
            <path d={path} fill={STAGE_COLORS[m.stage]} opacity="0.7" stroke="#030712" strokeWidth="1" />
            <text x={centerX} y={y + rowH / 2 - 4} textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">
              {STAGE_LABELS[m.stage]}
            </text>
            <text x={centerX} y={y + rowH / 2 + 12} textAnchor="middle" fill="#e5e7eb" fontSize="10">
              {m.count}件 ({m.conversionRate}%)
            </text>
            {/* Drop-off label */}
            {i > 0 && m.dropOffRate > 0 && (
              <text x={x2 + 12} y={y + 10} fill="#ef4444" fontSize="9" opacity="0.8">
                -{m.dropOffRate}%
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function StageTimeChart({ metrics }: { metrics: StageMetrics[] }) {
  const filtered = metrics.filter((m) => m.avgDays > 0);
  if (filtered.length === 0) {
    return (
      <div className="text-center text-gray-500 text-sm py-8">
        ステージ間の遷移データがありません
      </div>
    );
  }

  const maxDays = Math.max(1, Math.max.apply(null, filtered.map((m) => m.avgDays)));
  const barH = 26;
  const gap = 8;
  const labelW = 90;
  const chartW = 250;
  const svgH = filtered.length * (barH + gap) + 10;

  return (
    <svg width="100%" viewBox={'0 0 ' + (labelW + chartW + 80) + ' ' + svgH}>
      {filtered.map((m, i) => {
        const y = i * (barH + gap) + 5;
        const w = (m.avgDays / maxDays) * chartW;
        const color = m.avgDays > 14 ? '#ef4444' : m.avgDays > 7 ? '#eab308' : '#22c55e';
        return (
          <g key={i}>
            <text x={labelW - 8} y={y + barH / 2 + 4} textAnchor="end" fill="#9ca3af" fontSize="10">
              {STAGE_LABELS[m.stage]}
            </text>
            <rect x={labelW} y={y} width={chartW} height={barH} rx="4" fill="#1f2937" />
            <rect x={labelW} y={y} width={Math.max(2, w)} height={barH} rx="4" fill={color} opacity="0.7" />
            <text x={labelW + Math.max(2, w) + 6} y={y + barH / 2 + 4} fill="#d1d5db" fontSize="10">
              {m.avgDays}日
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Main Component ─────────────────────────────────
export default function FeedbackFunnelPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    source: '',
    priority: 'medium' as FeedbackItem['priority'],
    category: 'UX改善',
  });
  const [filterStage, setFilterStage] = useState<Stage | 'all'>('all');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  const saveItems = useCallback((updated: FeedbackItem[]) => {
    setItems(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const addItem = () => {
    if (!form.title.trim()) return;
    const now = new Date().toISOString();
    const item: FeedbackItem = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: form.title.trim(),
      source: form.source.trim() || '不明',
      stage: 'received',
      createdAt: now,
      stageHistory: [{ stage: 'received', timestamp: now }],
      priority: form.priority,
      category: form.category,
    };
    saveItems(items.concat([item]));
    setForm({ title: '', source: '', priority: 'medium', category: 'UX改善' });
    setShowForm(false);
  };

  const advanceStage = (itemId: string) => {
    const updated = items.map((item) => {
      if (item.id !== itemId) return item;
      const currentIdx = STAGES.indexOf(item.stage);
      if (currentIdx >= STAGES.length - 1) return item;
      const nextStage = STAGES[currentIdx + 1];
      const now = new Date().toISOString();
      return {
        ...item,
        stage: nextStage,
        stageHistory: item.stageHistory.concat([{ stage: nextStage, timestamp: now }]),
      };
    });
    saveItems(updated);
  };

  const revertStage = (itemId: string) => {
    const updated = items.map((item) => {
      if (item.id !== itemId) return item;
      const currentIdx = STAGES.indexOf(item.stage);
      if (currentIdx <= 0) return item;
      const prevStage = STAGES[currentIdx - 1];
      const now = new Date().toISOString();
      return {
        ...item,
        stage: prevStage,
        stageHistory: item.stageHistory.concat([{ stage: prevStage, timestamp: now }]),
      };
    });
    saveItems(updated);
  };

  const removeItem = (id: string) => {
    saveItems(items.filter((i) => i.id !== id));
  };

  const stageMetrics = useMemo(() => calculateStageMetrics(items), [items]);
  const velocity = useMemo(() => calculateFeedbackVelocity(items), [items]);
  const bottleneck = useMemo(() => identifyBottleneck(stageMetrics), [stageMetrics]);
  const suggestions = useMemo(() => getStageSuggestions(stageMetrics), [stageMetrics]);

  const totalItems = items.length;
  const completedItems = items.filter((i) => i.stage === 'shipped' || i.stage === 'measured').length;
  const overallConversion = totalItems > 0 ? Math.round((completedItems / totalItems) * 100 * 10) / 10 : 0;

  const filteredItems = useMemo(() => {
    if (filterStage === 'all') return items;
    return items.filter((i) => i.stage === filterStage);
  }, [items, filterStage]);

  const inputClass =
    'w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none text-sm';
  const labelClass = 'block text-xs text-gray-400 mb-1';

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">フィードバックファネル分析</h1>
          <p className="text-gray-400">
            フィードバックの受信からリリースまでのファネルを可視化し、ボトルネックと改善ポイントを特定します。
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="text-xs text-gray-400 mb-1">総フィードバック</div>
            <div className="text-2xl font-bold text-blue-400">{totalItems}</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="text-xs text-gray-400 mb-1">完了率</div>
            <div className="text-2xl font-bold" style={{ color: overallConversion > 50 ? '#22c55e' : overallConversion > 25 ? '#eab308' : '#ef4444' }}>
              {overallConversion}%
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="text-xs text-gray-400 mb-1">月間ベロシティ</div>
            <div className="text-2xl font-bold text-purple-400">{velocity}</div>
            <div className="text-xs text-gray-500">件/月</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="text-xs text-gray-400 mb-1">完了件数</div>
            <div className="text-2xl font-bold text-green-400">{completedItems}</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="text-xs text-gray-400 mb-1">ボトルネック</div>
            <div className="text-sm font-bold" style={{ color: bottleneck ? '#ef4444' : '#22c55e' }}>
              {bottleneck ? STAGE_LABELS[bottleneck.stage] : 'なし'}
            </div>
          </div>
        </div>

        {/* Funnel + Time Chart */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold mb-4">ファネル可視化</h2>
            <FunnelChart metrics={stageMetrics} />
          </div>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold mb-4">ステージ平均滞留時間</h2>
            <StageTimeChart metrics={stageMetrics} />

            {/* Bottleneck alert */}
            {bottleneck && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="text-xs font-medium text-red-400 mb-1">ボトルネック検出</div>
                <div className="text-sm text-gray-300">{bottleneck.reason}</div>
              </div>
            )}
          </div>
        </div>

        {/* Suggestions */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-8">
          <h2 className="text-lg font-semibold mb-4">改善提案</h2>
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg">
                <span
                  className="mt-0.5 w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: STAGE_COLORS[s.stage] }}
                />
                <span className="text-sm text-gray-300">{s.suggestion}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stage Metrics Table */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-8">
          <h2 className="text-lg font-semibold mb-4">ステージ別メトリクス</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">ステージ</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium text-xs">件数</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium text-xs">変換率</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium text-xs">脱落率</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium text-xs">平均滞留</th>
                </tr>
              </thead>
              <tbody>
                {stageMetrics.map((m) => (
                  <tr key={m.stage} className="border-b border-gray-800/50">
                    <td className="py-2 px-3">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STAGE_COLORS[m.stage] }} />
                        {STAGE_LABELS[m.stage]}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-medium">{m.count}</td>
                    <td className="py-2 px-3 text-right">{m.conversionRate}%</td>
                    <td className="py-2 px-3 text-right" style={{ color: m.dropOffRate > 30 ? '#ef4444' : '#d1d5db' }}>
                      {m.dropOffRate}%
                    </td>
                    <td className="py-2 px-3 text-right" style={{ color: m.avgDays > 7 ? '#eab308' : '#d1d5db' }}>
                      {m.avgDays}日
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Form */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">フィードバック追加</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-medium transition-colors"
            >
              {showForm ? '閉じる' : '新規追加'}
            </button>
          </div>
          {showForm && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className={labelClass}>タイトル</label>
                  <input
                    className={inputClass}
                    placeholder="フィードバック内容"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    onKeyDown={(e) => { if (e.key === 'Enter') addItem(); }}
                  />
                </div>
                <div>
                  <label className={labelClass}>ソース</label>
                  <input
                    className={inputClass}
                    placeholder="ユーザーインタビュー"
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass}>優先度</label>
                  <select
                    className={inputClass}
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as FeedbackItem['priority'] })}
                  >
                    {Object.keys(PRIORITY_LABELS).map((k) => (
                      <option key={k} value={k}>{PRIORITY_LABELS[k]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>カテゴリ</label>
                  <select
                    className={inputClass}
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={addItem}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
              >
                追加
              </button>
            </div>
          )}
        </div>

        {/* Feedback Items */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">フィードバック一覧 ({filteredItems.length}件)</h2>
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setFilterStage('all')}
                className="px-2 py-1 rounded text-xs transition-colors"
                style={{
                  backgroundColor: filterStage === 'all' ? '#3b82f620' : '#374151',
                  color: filterStage === 'all' ? '#60a5fa' : '#9ca3af',
                }}
              >
                全て
              </button>
              {STAGES.map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStage(s)}
                  className="px-2 py-1 rounded text-xs transition-colors"
                  style={{
                    backgroundColor: filterStage === s ? STAGE_COLORS[s] + '30' : '#374151',
                    color: filterStage === s ? STAGE_COLORS[s] : '#9ca3af',
                  }}
                >
                  {STAGE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
          {filteredItems.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-8">
              {items.length === 0 ? 'フィードバックを追加してファネル分析を開始してください' : 'このステージのフィードバックはありません'}
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredItems
                .slice()
                .sort((a, b) => {
                  const pOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
                  return pOrder[a.priority] - pOrder[b.priority];
                })
                .map((item) => {
                  const stageIdx = STAGES.indexOf(item.stage);
                  return (
                    <div key={item.id} className="p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-medium">{item.title}</span>
                            <span
                              className="px-1.5 py-0.5 rounded text-xs"
                              style={{
                                backgroundColor: STAGE_COLORS[item.stage] + '20',
                                color: STAGE_COLORS[item.stage],
                              }}
                            >
                              {STAGE_LABELS[item.stage]}
                            </span>
                            <span
                              className="px-1.5 py-0.5 rounded text-xs"
                              style={{
                                backgroundColor: PRIORITY_COLORS[item.priority] + '20',
                                color: PRIORITY_COLORS[item.priority],
                              }}
                            >
                              {PRIORITY_LABELS[item.priority]}
                            </span>
                            <span className="text-xs text-gray-500">{item.category}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            ソース: {item.source} | 作成: {new Date(item.createdAt).toLocaleDateString('ja-JP')}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {stageIdx > 0 && (
                            <button
                              onClick={() => revertStage(item.id)}
                              className="px-2 py-1 text-xs text-gray-400 hover:bg-gray-700 rounded transition-colors"
                              title="前のステージに戻す"
                            >
                              &#9664;
                            </button>
                          )}
                          {stageIdx < STAGES.length - 1 && (
                            <button
                              onClick={() => advanceStage(item.id)}
                              className="px-2 py-1 text-xs text-blue-400 hover:bg-blue-600/20 rounded transition-colors"
                              title="次のステージに進める"
                            >
                              &#9654;
                            </button>
                          )}
                          <button
                            onClick={() => removeItem(item.id)}
                            className="px-2 py-1 text-xs text-red-400 hover:bg-red-600/20 rounded transition-colors"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
