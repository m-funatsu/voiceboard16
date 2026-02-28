'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePremium } from '@/contexts/PremiumContext';
import { createCheckoutSession } from '@/lib/stripe';

const plans = [
  {
    id: 'free' as const,
    name: 'Free',
    price: '$0',
    features: ['1 ボード', '50件 / 月', '投票者数無制限', '基本AI（類似検出）', 'VoiceBoardブランド表示'],
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: '$19',
    popular: true,
    features: ['無制限ボード', '無制限フィードバック', '投票者数無制限', 'フルAI分析', 'カスタムドメイン', 'ブランド非表示'],
  },
  {
    id: 'business' as const,
    name: 'Business',
    price: '$49',
    features: ['Proの全機能', 'ホワイトラベル', 'API アクセス', '高度な分析', '優先サポート'],
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const { plan: currentPlan } = usePremium();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (planId: 'pro' | 'business') => {
    if (!user) return;
    setLoading(planId);
    try {
      const { url } = await createCheckoutSession(user.id, planId);
      if (url) window.location.href = url;
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">料金プラン</h1>
      <p className="mb-8 text-gray-600">全プラン投票者数無制限。成長しても料金は変わりません。</p>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          return (
            <div
              key={plan.id}
              className={`relative rounded-xl border-2 bg-white p-6 ${
                plan.popular ? 'border-indigo-600' : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white">
                  人気
                </div>
              )}
              <h3 className="mb-1 text-lg font-semibold">{plan.name}</h3>
              <div className="mb-4 text-3xl font-bold">
                {plan.price}
                <span className="text-base font-normal text-gray-500">/月</span>
              </div>
              <ul className="mb-6 space-y-2 text-sm text-gray-600">
                {plan.features.map((f) => (
                  <li key={f}>- {f}</li>
                ))}
              </ul>
              {isCurrent ? (
                <div className="rounded-lg bg-gray-100 px-4 py-2 text-center text-sm font-medium text-gray-600">
                  現在のプラン
                </div>
              ) : plan.id === 'free' ? (
                <div className="rounded-lg bg-gray-50 px-4 py-2 text-center text-sm text-gray-500">
                  無料
                </div>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={loading !== null}
                  className={`w-full rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                    plan.popular ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-800 hover:bg-gray-900'
                  }`}
                >
                  {loading === plan.id ? '処理中...' : `${plan.name}にアップグレード`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
