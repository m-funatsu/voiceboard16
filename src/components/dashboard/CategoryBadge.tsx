import { CATEGORY_CONFIG, type FeedbackCategory } from '@/types';

export default function CategoryBadge({ category }: { category: FeedbackCategory }) {
  const config = CATEGORY_CONFIG[category];
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}>
      {config.labelJa}
    </span>
  );
}
