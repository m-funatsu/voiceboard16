'use client';

import VoteButton from './VoteButton';
import StatusBadge from '@/components/dashboard/StatusBadge';
import CategoryBadge from '@/components/dashboard/CategoryBadge';
import type { Feedback } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface FeedbackCardProps {
  feedback: Feedback;
  onVote: (feedbackId: string) => Promise<boolean>;
}

export default function FeedbackCard({ feedback, onVote }: FeedbackCardProps) {
  return (
    <div className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 hover:shadow-sm transition-shadow">
      <VoteButton
        feedbackId={feedback.id}
        voteCount={feedback.voteCount}
        hasVoted={feedback.hasVoted || false}
        onVote={onVote}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 truncate">{feedback.title}</h3>
        </div>
        {feedback.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{feedback.description}</p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <CategoryBadge category={feedback.category} />
          <StatusBadge status={feedback.status} />
          <span className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(feedback.createdAt), { addSuffix: true, locale: ja })}
          </span>
        </div>
      </div>
    </div>
  );
}
