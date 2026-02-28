'use client';

import type { FeedbackCategory, FeedbackStatus } from '@/types';

interface SortBarProps {
  sort: 'votes' | 'newest' | 'trending';
  category?: FeedbackCategory;
  status?: FeedbackStatus;
  onSortChange: (sort: 'votes' | 'newest' | 'trending') => void;
  onCategoryChange: (category?: FeedbackCategory) => void;
  onStatusChange: (status?: FeedbackStatus) => void;
}

export default function SortBar({ sort, category, status, onSortChange, onCategoryChange, onStatusChange }: SortBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Sort */}
      <div className="flex rounded-lg border border-gray-300 bg-white">
        {([
          { value: 'votes', label: '人気' },
          { value: 'newest', label: '新着' },
          { value: 'trending', label: 'トレンド' },
        ] as const).map((option) => (
          <button
            key={option.value}
            onClick={() => onSortChange(option.value)}
            className={`px-3 py-1.5 text-xs font-medium ${
              sort === option.value
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <select
        value={category || ''}
        onChange={(e) => onCategoryChange(e.target.value ? (e.target.value as FeedbackCategory) : undefined)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
      >
        <option value="">全カテゴリ</option>
        <option value="feature">機能要望</option>
        <option value="bug">バグ</option>
        <option value="improvement">改善</option>
      </select>

      {/* Status filter */}
      <select
        value={status || ''}
        onChange={(e) => onStatusChange(e.target.value ? (e.target.value as FeedbackStatus) : undefined)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
      >
        <option value="">全ステータス</option>
        <option value="open">未対応</option>
        <option value="planned">予定</option>
        <option value="in_progress">対応中</option>
        <option value="completed">完了</option>
        <option value="declined">見送り</option>
      </select>
    </div>
  );
}
