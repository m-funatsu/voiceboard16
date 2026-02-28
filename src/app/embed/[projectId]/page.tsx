'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getProjectById, getFeedback, submitFeedback, upvoteFeedback, getVotedFeedbackIds } from '@/lib/storage';
import { getOrCreateFingerprint } from '@/lib/fingerprint';
import FeedbackCard from '@/components/board/FeedbackCard';
import FeedbackSubmitForm from '@/components/board/FeedbackSubmitForm';
import type { Project, Feedback, FeedbackCategory } from '@/types';

export default function EmbedPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [fingerprint, setFingerprint] = useState('');

  const loadFeedback = useCallback(async (pId: string, fp: string) => {
    const result = await getFeedback(pId, { sort: 'votes', page: 1, limit: 20 });
    const votedIds = fp ? await getVotedFeedbackIds(pId, fp) : new Set<string>();
    setFeedback(result.items.map((item) => ({ ...item, hasVoted: votedIds.has(item.id) })));
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const fp = await getOrCreateFingerprint();
        setFingerprint(fp);
        const p = await getProjectById(projectId);
        setProject(p);
        if (p) await loadFeedback(p.id, fp);
      } catch (err) {
        console.error('Embed load error:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [projectId, loadFeedback]);

  // Notify parent of height changes for auto-resize
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      window.parent.postMessage(
        { type: 'voiceboard-resize', height: document.body.scrollHeight },
        '*'
      );
    });
    resizeObserver.observe(document.body);
    return () => resizeObserver.disconnect();
  }, []);

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

  if (loading) return <div className="p-4 text-sm text-gray-500">読み込み中...</div>;
  if (!project) return <div className="p-4 text-sm text-red-500">プロジェクトが見つかりません</div>;

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">{project.name}</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-white"
          style={{ backgroundColor: project.accentColor }}
        >
          {showForm ? '閉じる' : 'フィードバック'}
        </button>
      </div>

      {showForm && (
        <div className="mb-4 rounded-lg border border-gray-200 p-4">
          <FeedbackSubmitForm projectId={project.id} onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />
        </div>
      )}

      <div className="space-y-2">
        {feedback.map((item) => (
          <FeedbackCard key={item.id} feedback={item} onVote={handleVote} />
        ))}
      </div>
    </div>
  );
}
