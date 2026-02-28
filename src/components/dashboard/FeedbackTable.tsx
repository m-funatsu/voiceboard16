'use client';

import { useState } from 'react';
import StatusBadge from './StatusBadge';
import CategoryBadge from './CategoryBadge';
import type { Feedback, FeedbackStatus } from '@/types';
import { updateFeedback, deleteFeedback } from '@/lib/storage';

interface FeedbackTableProps {
  feedback: Feedback[];
  onUpdate: () => void;
}

export default function FeedbackTable({ feedback, onUpdate }: FeedbackTableProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleStatusChange = async (id: string, status: FeedbackStatus) => {
    setActionLoading(id);
    try {
      await updateFeedback(id, { status });
      onUpdate();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async (id: string) => {
    setActionLoading(id);
    try {
      await updateFeedback(id, { isArchived: true });
      onUpdate();
    } catch (err) {
      console.error('Failed to archive:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('本当に削除しますか？')) return;
    setActionLoading(id);
    try {
      await deleteFeedback(id);
      onUpdate();
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setActionLoading(null);
    }
  };

  if (feedback.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
        <p className="text-sm text-gray-500">まだフィードバックがありません</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className="px-4 py-3 font-medium text-gray-600">タイトル</th>
            <th className="px-4 py-3 font-medium text-gray-600">カテゴリ</th>
            <th className="px-4 py-3 font-medium text-gray-600">ステータス</th>
            <th className="px-4 py-3 font-medium text-gray-600 text-right">投票</th>
            <th className="px-4 py-3 font-medium text-gray-600">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {feedback.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">{item.title}</div>
                {item.description && (
                  <div className="mt-0.5 text-xs text-gray-500 line-clamp-1">{item.description}</div>
                )}
              </td>
              <td className="px-4 py-3">
                <CategoryBadge category={item.category} />
              </td>
              <td className="px-4 py-3">
                <select
                  value={item.status}
                  onChange={(e) => handleStatusChange(item.id, e.target.value as FeedbackStatus)}
                  disabled={actionLoading === item.id}
                  className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
                >
                  <option value="open">未対応</option>
                  <option value="planned">予定</option>
                  <option value="in_progress">対応中</option>
                  <option value="completed">完了</option>
                  <option value="declined">見送り</option>
                </select>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="font-medium text-gray-900">{item.voteCount}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <button
                    onClick={() => handleArchive(item.id)}
                    disabled={actionLoading === item.id}
                    className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                    title="アーカイブ"
                  >
                    📦
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={actionLoading === item.id}
                    className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50"
                    title="削除"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
