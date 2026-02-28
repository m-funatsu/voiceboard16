'use client';

import Link from 'next/link';
import { usePremium } from '@/contexts/PremiumContext';

interface PremiumGateProps {
  children: React.ReactNode;
  feature?: string;
}

export default function PremiumGate({ children, feature = 'この機能' }: PremiumGateProps) {
  const { isPremium, loading } = usePremium();

  if (loading) return <div className="text-sm text-gray-500">読み込み中...</div>;

  if (!isPremium) {
    return (
      <div className="rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50 p-8 text-center">
        <div className="mb-2 text-3xl">🔒</div>
        <h3 className="mb-1 text-lg font-semibold text-gray-900">{feature}はPro以上のプランで利用可能です</h3>
        <p className="mb-4 text-sm text-gray-600">
          アップグレードして、AI分析や無制限のフィードバックなど全機能をお使いいただけます。
        </p>
        <Link
          href="/pricing"
          className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          プランを見る
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
