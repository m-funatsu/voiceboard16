'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getProjectBySlug, getFeedback, submitFeedback, upvoteFeedback, getVotedFeedbackIds } from '@/lib/storage';
import { getOrCreateFingerprint } from '@/lib/fingerprint';
import FeedbackCard from '@/components/board/FeedbackCard';
import FeedbackSubmitForm from '@/components/board/FeedbackSubmitForm';
import SortBar from '@/components/board/SortBar';
import type { Project, Feedback, FeedbackCategory, FeedbackStatus } from '@/types';
import { ITEMS_PER_PAGE } from '@/lib/constants';

export default function PublicBoardPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [project, setProject] = useState<Project | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [fingerprint, setFingerprint] = useState('');

  const [sort, setSort] = useState<'votes' | 'newest' | 'trending'>('votes');
  const [category, setCategory] = useState<FeedbackCategory | undefined>();
  const [status, setStatus] = useState<FeedbackStatus | undefined>();
  const [page, setPage] = useState(1);

  const loadFeedback = useCallback(async (projectId: string, fp: string) => {
    try {
      const result = await getFeedback(projectId, { sort, category, status, page, limit: ITEMS_PER_PAGE });
      const votedIds = fp ? await getVotedFeedbackIds(projectId, fp) : new Set<string>();
      const items = result.items.map((item) => ({
        ...item,
        hasVoted: votedIds.has(item.id),
      }));
      setFeedback(items);
      setTotal(result.total);
    } catch (err) {
      console.error('Failed to load feedback:', err);
    }
  }, [sort, category, status, page]);

  useEffect(() => {
    const init = async () => {
      try {
        const fp = await getOrCreateFingerprint();
        setFingerprint(fp);
        const p = await getProjectBySlug(slug);
        setProject(p);
        if (p) {
          await loadFeedback(p.id, fp);
        }
      } catch (err) {
        console.error('Failed to load board:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [slug, loadFeedback]);

  const handleVote = async (feedbackId: string): Promise<boolean> => {
    if (!fingerprint) return false;
    return upvoteFeedback(feedbackId, fingerprint);
  };

  const handleSubmit = async (data: { title: string; description: string; category: FeedbackCategory; email?: string }) => {
    if (!project) return;
    await submitFeedback({
      projectId: project.id,
      title: data.title,
      description: data.description,
      category: data.category,
      email: data.email,
      fingerprint,
    });
    setShowForm(false);
    await loadFeedback(project.id, fingerprint);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="mb-2 text-xl font-bold text-gray-900">ボードが見つかりません</h1>
        <Link href="/" className="text-sm text-indigo-600 hover:underline">トップへ戻る</Link>
      </div>
    );
  }

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="h-6 w-6 rounded-md"
                style={{ backgroundColor: project.accentColor }}
              />
              <h1 className="text-lg font-bold text-gray-900">{project.name}</h1>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: project.accentColor }}
            >
              {showForm ? '閉じる' : 'フィードバックを送る'}
            </button>
          </div>
          {project.description && (
            <p className="mt-1 text-sm text-gray-500">{project.description}</p>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* Submit form */}
        {showForm && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">新しいフィードバック</h2>
            <FeedbackSubmitForm
              projectId={project.id}
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {/* Sort & Filter */}
        <div className="mb-4">
          <SortBar
            sort={sort}
            category={category}
            status={status}
            onSortChange={(s) => { setSort(s); setPage(1); }}
            onCategoryChange={(c) => { setCategory(c); setPage(1); }}
            onStatusChange={(s) => { setStatus(s); setPage(1); }}
          />
        </div>

        {/* Feedback list */}
        <div className="space-y-3">
          {feedback.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
              <p className="mb-2 text-gray-500">まだフィードバックがありません</p>
              <button
                onClick={() => setShowForm(true)}
                className="text-sm text-indigo-600 hover:underline"
              >
                最初のフィードバックを送る
              </button>
            </div>
          ) : (
            feedback.map((item) => (
              <FeedbackCard key={item.id} feedback={item} onVote={handleVote} />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              前へ
            </button>
            <span className="flex items-center px-3 text-sm text-gray-600">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              次へ
            </button>
          </div>
        )}
      </div>

      {/* Footer branding */}
      <footer className="border-t border-gray-200 bg-white py-4 text-center">
        <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">
          Powered by VoiceBoard
        </Link>
      </footer>
    </div>
  );
}
