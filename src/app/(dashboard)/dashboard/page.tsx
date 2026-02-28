'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getProjects, getProjectStats } from '@/lib/storage';
import ProjectCard from '@/components/dashboard/ProjectCard';
import StatCard from '@/components/dashboard/StatCard';
import type { Project } from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Record<string, { totalFeedback: number; totalVotes: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const projectList = await getProjects(user.id);
        setProjects(projectList);

        const statsMap: Record<string, { totalFeedback: number; totalVotes: number }> = {};
        await Promise.all(
          projectList.map(async (p) => {
            const s = await getProjectStats(p.id);
            statsMap[p.id] = { totalFeedback: s.totalFeedback, totalVotes: s.totalVotes };
          })
        );
        setStats(statsMap);
      } catch (err) {
        console.error('Failed to load projects:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const totalFeedback = Object.values(stats).reduce((sum, s) => sum + s.totalFeedback, 0);
  const totalVotes = Object.values(stats).reduce((sum, s) => sum + s.totalVotes, 0);

  if (loading) {
    return <div className="text-sm text-gray-500">読み込み中...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <Link
          href="/projects/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          新規プロジェクト
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <StatCard label="プロジェクト" value={projects.length} icon="📁" />
        <StatCard label="総フィードバック" value={totalFeedback} icon="💬" color="bg-green-100 text-green-700" />
        <StatCard label="総投票数" value={totalVotes} icon="👍" color="bg-purple-100 text-purple-700" />
      </div>

      {/* Projects */}
      {projects.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="mb-2 text-4xl">📋</div>
          <h3 className="mb-1 text-lg font-semibold text-gray-900">プロジェクトがありません</h3>
          <p className="mb-4 text-sm text-gray-500">
            最初のフィードバックボードを作成して、ユーザーの声を集めましょう。
          </p>
          <Link
            href="/projects/new"
            className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            プロジェクトを作成
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} stats={stats[project.id]} />
          ))}
        </div>
      )}
    </div>
  );
}
