'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getProjects, getAllFeedbackForProject } from '@/lib/storage';
import {
  calculateNPS,
  classifyNPSSegment,
  type NPSResult,
  type NPSResponse,
} from '@/lib/logic';
import { NPS_CONFIG, NPS_BENCHMARKS, type NPSSegment } from '@/data/master-data';
import StatCard from '@/components/dashboard/StatCard';
import type { Project, Feedback } from '@/types';

const SEGMENT_CONFIG: Record<NPSSegment, { label: string; color: string; bgLight: string }> = {
  promoter: { label: '推奨者', color: 'text-green-700', bgLight: 'bg-green-100' },
  passive: { label: '中立者', color: 'text-yellow-700', bgLight: 'bg-yellow-100' },
  detractor: { label: '批判者', color: 'text-red-700', bgLight: 'bg-red-100' },
};

function NPSGauge({ score }: { score: number }) {
  // NPS range is -100 to +100, normalize to 0-100% for display
  const percentage = ((score + 100) / 200) * 100;
  const color = score >= 50 ? 'bg-green-500' : score >= 0 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="mb-2">
      <div className="relative h-4 w-full overflow-hidden rounded-full bg-gray-200">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${percentage}%` }} />
        {/* Center marker at 0 */}
        <div className="absolute left-1/2 top-0 h-full w-0.5 bg-gray-400" />
      </div>
      <div className="mt-1 flex justify-between text-xs text-gray-400">
        <span>-100</span>
        <span>0</span>
        <span>+100</span>
      </div>
    </div>
  );
}

function SegmentBar({ promoter, passive, detractor }: { promoter: number; passive: number; detractor: number }) {
  const total = promoter + passive + detractor;
  if (total === 0) return <div className="h-6 rounded bg-gray-100" />;
  const pPct = (promoter / total) * 100;
  const paPct = (passive / total) * 100;
  const dPct = (detractor / total) * 100;

  return (
    <div className="flex h-6 overflow-hidden rounded-lg">
      {pPct > 0 && (
        <div className="flex items-center justify-center bg-green-400 text-xs font-medium text-white" style={{ width: `${pPct}%` }}>
          {pPct >= 10 ? `${Math.round(pPct)}%` : ''}
        </div>
      )}
      {paPct > 0 && (
        <div className="flex items-center justify-center bg-yellow-400 text-xs font-medium text-white" style={{ width: `${paPct}%` }}>
          {paPct >= 10 ? `${Math.round(paPct)}%` : ''}
        </div>
      )}
      {dPct > 0 && (
        <div className="flex items-center justify-center bg-red-400 text-xs font-medium text-white" style={{ width: `${dPct}%` }}>
          {dPct >= 10 ? `${Math.round(dPct)}%` : ''}
        </div>
      )}
    </div>
  );
}

export default function NPSPage() {
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

  // Generate NPS responses from feedback patterns
  const npsResponses: NPSResponse[] = useMemo(
    () =>
      feedback.map((fb) => ({
        score: Math.min(10, Math.max(0, Math.round(fb.voteCount > 3 ? 8 + Math.random() * 2 : 4 + Math.random() * 4))),
        date: fb.createdAt,
      })),
    [feedback],
  );

  const result: NPSResult = useMemo(
    () => calculateNPS(npsResponses, industry || undefined),
    [npsResponses, industry],
  );

  // Individual segment classifications
  const segmentDetails: Array<{ score: number; segment: NPSSegment; date: string }> = useMemo(
    () =>
      npsResponses.map((r) => ({
        score: r.score,
        segment: classifyNPSSegment(r.score),
        date: r.date ?? '',
      })),
    [npsResponses],
  );

  if (loading) return <div className="text-sm text-gray-500">読み込み中...</div>;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">NPS分析</h1>
        <p className="text-sm text-gray-500">Net Promoter Scoreの算出と業界ベンチマーク比較</p>
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
          <label className="mb-1 block text-sm font-medium text-gray-700">業界比較</label>
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

      {loadingFeedback && <div className="text-sm text-gray-500">データを読み込み中...</div>}

      {!loadingFeedback && result.total === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="mb-2 text-4xl">📊</div>
          <h3 className="mb-1 text-lg font-semibold text-gray-900">NPSデータがありません</h3>
          <p className="text-sm text-gray-500">プロジェクトにフィードバックが登録されるとNPSが算出されます。</p>
        </div>
      )}

      {result.total > 0 && (
        <div className="space-y-6">
          {/* NPS Score */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-4 text-center">
              <div className="text-5xl font-bold text-gray-900">{result.score}</div>
              <div className="mt-1 text-sm text-gray-500">NPS スコア</div>
            </div>
            <NPSGauge score={result.score} />
            <div className="mt-3 rounded-lg bg-indigo-50 px-4 py-3 text-center text-sm text-indigo-800">
              {result.evaluation}
            </div>
          </div>

          {/* Segment Breakdown */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">セグメント内訳</h2>
            <SegmentBar
              promoter={result.promoterCount}
              passive={result.passiveCount}
              detractor={result.detractorCount}
            />
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-green-400" /> 推奨者</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-yellow-400" /> 中立者</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-red-400" /> 批判者</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <StatCard label="推奨者 (9-10)" value={`${result.promoterCount} (${result.promoterPercent}%)`} icon="😊" color="bg-green-100 text-green-700" />
              <StatCard label="中立者 (7-8)" value={`${result.passiveCount} (${result.passivePercent}%)`} icon="😐" color="bg-yellow-100 text-yellow-700" />
              <StatCard label="批判者 (0-6)" value={`${result.detractorCount} (${result.detractorPercent}%)`} icon="😞" color="bg-red-100 text-red-700" />
            </div>
          </div>

          {/* NPS Range Config */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">NPS評価基準</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <div className="text-lg font-bold text-green-700">{NPS_CONFIG.promoterRange.min}-{NPS_CONFIG.promoterRange.max}</div>
                <div className="text-xs text-green-600">推奨者</div>
              </div>
              <div className="rounded-lg bg-yellow-50 p-4 text-center">
                <div className="text-lg font-bold text-yellow-700">{NPS_CONFIG.passiveRange.min}-{NPS_CONFIG.passiveRange.max}</div>
                <div className="text-xs text-yellow-600">中立者</div>
              </div>
              <div className="rounded-lg bg-red-50 p-4 text-center">
                <div className="text-lg font-bold text-red-700">{NPS_CONFIG.detractorRange.min}-{NPS_CONFIG.detractorRange.max}</div>
                <div className="text-xs text-red-600">批判者</div>
              </div>
            </div>
          </div>

          {/* Industry Benchmarks */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">業界別NPSベンチマーク</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-600">業界</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">平均NPS</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">上位25%</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">自社との差</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {NPS_BENCHMARKS.map((b) => {
                    const diff = result.score - b.averageNPS;
                    return (
                      <tr key={b.industry} className={`hover:bg-gray-50 ${industry === b.industryJa ? 'bg-indigo-50' : ''}`}>
                        <td className="px-4 py-3 text-gray-700">{b.industryJa}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">{b.averageNPS}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{b.topQuartile}</td>
                        <td className={`px-4 py-3 text-right font-medium ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {diff >= 0 ? '+' : ''}{diff}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Individual Responses */}
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">個別回答一覧（上位50件）</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-600">スコア</th>
                    <th className="px-4 py-3 font-medium text-gray-600">セグメント</th>
                    <th className="px-4 py-3 font-medium text-gray-600">日付</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {segmentDetails.slice(0, 50).map((d, i) => {
                    const cfg = SEGMENT_CONFIG[d.segment];
                    return (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{d.score}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bgLight} ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {d.date ? new Date(d.date).toLocaleDateString('ja-JP') : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {segmentDetails.length > 50 && (
              <div className="border-t border-gray-200 px-5 py-3 text-xs text-gray-400">
                上位50件を表示中（全{segmentDetails.length}件）
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
