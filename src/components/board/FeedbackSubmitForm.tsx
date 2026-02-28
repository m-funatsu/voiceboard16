'use client';

import { useState } from 'react';
import type { FeedbackCategory } from '@/types';

interface FeedbackSubmitFormProps {
  projectId: string;
  onSubmit: (data: { title: string; description: string; category: FeedbackCategory; email?: string }) => Promise<void>;
  onCancel?: () => void;
}

export default function FeedbackSubmitForm({ projectId, onSubmit, onCancel }: FeedbackSubmitFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FeedbackCategory>('feature');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit({ title, description, category, email: email || undefined });
      setSuccess(true);
      setTitle('');
      setDescription('');
      setEmail('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '送信に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">フィードバックを送信しました！</div>}

      <div>
        <label htmlFor="fb-title" className="mb-1 block text-sm font-medium text-gray-700">
          タイトル <span className="text-red-500">*</span>
        </label>
        <input
          id="fb-title"
          type="text"
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="何を改善してほしいですか？"
        />
      </div>

      <div>
        <label htmlFor="fb-desc" className="mb-1 block text-sm font-medium text-gray-700">
          詳細
        </label>
        <textarea
          id="fb-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={2000}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="詳しい説明があればご記入ください"
        />
      </div>

      <div>
        <label htmlFor="fb-category" className="mb-1 block text-sm font-medium text-gray-700">
          カテゴリ
        </label>
        <select
          id="fb-category"
          value={category}
          onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="feature">機能要望</option>
          <option value="bug">バグ報告</option>
          <option value="improvement">改善提案</option>
        </select>
      </div>

      <div>
        <label htmlFor="fb-email" className="mb-1 block text-sm font-medium text-gray-700">
          メールアドレス（任意）
        </label>
        <input
          id="fb-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="返信を希望する場合"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? '送信中...' : 'フィードバックを送信'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
}
