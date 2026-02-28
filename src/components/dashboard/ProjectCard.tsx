'use client';

import Link from 'next/link';
import type { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
  stats?: { totalFeedback: number; totalVotes: number };
}

export default function ProjectCard({ project, stats }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-5 hover:border-indigo-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: project.accentColor }}
            />
            <h3 className="font-semibold text-gray-900">{project.name}</h3>
          </div>
          {project.description && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{project.description}</p>
          )}
        </div>
        <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
          /{project.slug}
        </span>
      </div>

      {stats && (
        <div className="mt-4 flex gap-4 border-t border-gray-100 pt-3">
          <div className="text-sm">
            <span className="font-medium text-gray-900">{stats.totalFeedback}</span>
            <span className="ml-1 text-gray-500">件</span>
          </div>
          <div className="text-sm">
            <span className="font-medium text-gray-900">{stats.totalVotes}</span>
            <span className="ml-1 text-gray-500">投票</span>
          </div>
        </div>
      )}
    </Link>
  );
}
