import { STATUS_CONFIG, type FeedbackStatus } from '@/types';

export default function StatusBadge({ status }: { status: FeedbackStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}>
      {config.labelJa}
    </span>
  );
}
