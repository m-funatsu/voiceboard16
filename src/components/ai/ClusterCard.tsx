'use client';

interface ClusterItem {
  id: string;
  title: string;
  vote_count: number;
  status: string;
}

interface ClusterCardProps {
  label: string;
  summary: string | null;
  combinedVoteCount: number;
  feedbackCount: number;
  priorityScore: number;
  items: ClusterItem[];
}

export default function ClusterCard({ label, summary, combinedVoteCount, feedbackCount, priorityScore, items }: ClusterCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{label}</h3>
          {summary && <p className="mt-1 text-sm text-gray-600">{summary}</p>}
        </div>
        <div className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
          優先度 {Math.round(priorityScore)}
        </div>
      </div>

      <div className="mb-3 flex gap-4 text-sm">
        <span className="text-gray-500">
          <strong className="text-gray-900">{feedbackCount}</strong> 件
        </span>
        <span className="text-gray-500">
          <strong className="text-gray-900">{combinedVoteCount}</strong> 投票
        </span>
      </div>

      <div className="space-y-1.5">
        {items.slice(0, 5).map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded bg-gray-50 px-3 py-1.5 text-sm">
            <span className="truncate text-gray-700">{item.title}</span>
            <span className="shrink-0 ml-2 text-xs text-gray-400">👍 {item.vote_count}</span>
          </div>
        ))}
        {items.length > 5 && (
          <div className="text-xs text-gray-400 text-center">+{items.length - 5} 件</div>
        )}
      </div>
    </div>
  );
}
