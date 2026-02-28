'use client';

import { useState } from 'react';

interface VoteButtonProps {
  feedbackId: string;
  voteCount: number;
  hasVoted: boolean;
  onVote: (feedbackId: string) => Promise<boolean>;
}

export default function VoteButton({ feedbackId, voteCount, hasVoted: initialHasVoted, onVote }: VoteButtonProps) {
  const [count, setCount] = useState(voteCount);
  const [voted, setVoted] = useState(initialHasVoted);
  const [loading, setLoading] = useState(false);

  const handleVote = async () => {
    if (voted || loading) return;
    setLoading(true);
    try {
      const success = await onVote(feedbackId);
      if (success) {
        setCount((c) => c + 1);
        setVoted(true);
      }
    } catch (err) {
      console.error('Vote failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleVote}
      disabled={voted || loading}
      className={`flex flex-col items-center rounded-lg border px-3 py-2 text-sm transition-all ${
        voted
          ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
          : 'border-gray-300 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
      } ${loading ? 'opacity-50' : ''}`}
    >
      <span className="text-lg">{voted ? '👍' : '☝️'}</span>
      <span className="font-bold">{count}</span>
    </button>
  );
}
