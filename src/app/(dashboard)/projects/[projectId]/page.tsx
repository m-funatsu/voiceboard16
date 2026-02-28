'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getProjectById, getAllFeedbackForProject, getProjectStats } from '@/lib/storage';
import FeedbackTable from '@/components/dashboard/FeedbackTable';
import StatCard from '@/components/dashboard/StatCard';
import type { Project, Feedback } from '@/types';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [project, setProject] = useState<Project | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<{ totalFeedback: number; totalVotes: number; statusCounts: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [p, f, s] = await Promise.all([
        getProjectById(projectId),
        getAllFeedbackForProject(projectId),
        getProjectStats(projectId),
      ]);
      setProject(p);
      setFeedback(f);
      setStats(s);
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  if (loading) return <div className="text-sm text-gray-500">読み込み中...</div>;
  if (!project) return <div className="text-sm text-red-500">プロジェクトが見つかりません</div>;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-sm text-gray-500">/{project.slug}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/board/${project.slug}`}
            target="_blank"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            公開ボードを見る
          </Link>
          <Link
            href={`/projects/${project.id}/widget`}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            ウィジェット設定
          </Link>
          <Link
            href={`/projects/${project.id}/ai`}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            AI分析
          </Link>
          <Link
            href={`/projects/${project.id}/settings`}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            設定
          </Link>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="mb-6 grid grid-cols-4 gap-4">
          <StatCard label="総フィードバック" value={stats.totalFeedback} icon="💬" />
          <StatCard label="総投票数" value={stats.totalVotes} icon="👍" color="bg-green-100 text-green-700" />
          <StatCard label="未対応" value={stats.statusCounts.open || 0} icon="📬" color="bg-yellow-100 text-yellow-700" />
          <StatCard label="完了" value={stats.statusCounts.completed || 0} icon="✅" color="bg-emerald-100 text-emerald-700" />
        </div>
      )}

      {/* Feedback list */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">フィードバック一覧</h2>
      </div>
      <FeedbackTable feedback={feedback} onUpdate={loadData} />
    </div>
  );
}
