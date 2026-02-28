'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import PremiumGate from '@/components/shared/PremiumGate';
import ClusterCard from '@/components/ai/ClusterCard';

interface Cluster {
  id: string;
  label: string;
  summary: string | null;
  combined_vote_count: number;
  feedback_count: number;
  priority_score: number;
  items: { id: string; title: string; vote_count: number; status: string }[];
}

export default function AIAnalysisPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const loadClusters = async () => {
    try {
      const res = await fetch(`/api/ai/clusters?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setClusters(data);
      }

      const summaryRes = await fetch(`/api/ai/summary?projectId=${projectId}`);
      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to load AI data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClusters();
  }, [projectId]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ projectId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Analysis failed');
      }

      await loadClusters();
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">AI分析</h1>
        <PremiumGate feature="AI分析">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {analyzing ? '分析中...' : '分析を実行'}
          </button>
        </PremiumGate>
      </div>

      <PremiumGate feature="AI分析">
        {loading ? (
          <div className="text-sm text-gray-500">読み込み中...</div>
        ) : (
          <>
            {/* Theme summary */}
            {summary && (
              <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
                <h2 className="mb-2 text-lg font-semibold text-gray-900">テーマサマリー</h2>
                <div className="whitespace-pre-wrap text-sm text-gray-700">{summary}</div>
              </div>
            )}

            {/* Clusters */}
            {clusters.length > 0 ? (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  フィードバッククラスタ（{clusters.length}グループ）
                </h2>
                {clusters.map((cluster) => (
                  <ClusterCard
                    key={cluster.id}
                    label={cluster.label}
                    summary={cluster.summary}
                    combinedVoteCount={cluster.combined_vote_count}
                    feedbackCount={cluster.feedback_count}
                    priorityScore={cluster.priority_score}
                    items={cluster.items}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
                <div className="mb-2 text-3xl">🤖</div>
                <p className="text-sm text-gray-500">
                  「分析を実行」ボタンを押すと、AIがフィードバックを分析し、類似の要望をグルーピングします。
                </p>
              </div>
            )}
          </>
        )}
      </PremiumGate>
    </div>
  );
}
