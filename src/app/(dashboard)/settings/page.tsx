'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePremium } from '@/contexts/PremiumContext';
import { getUsage } from '@/lib/storage';
import { useEffect, useState } from 'react';
import { PLAN_LIMITS } from '@/types';
import type { UsageInfo } from '@/types';

export default function AccountSettingsPage() {
  const { profile } = useAuth();
  const { plan } = usePremium();
  const [usage, setUsage] = useState<UsageInfo | null>(null);

  useEffect(() => {
    if (profile) {
      getUsage(profile.id).then(setUsage);
    }
  }, [profile]);

  if (!profile) return null;

  const limits = PLAN_LIMITS[plan];
  const feedbackUsed = usage?.feedbackCount || 0;
  const feedbackLimit = limits.maxFeedbackPerMonth;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">アカウント設定</h1>

      <div className="space-y-6">
        {/* Profile */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">プロフィール</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">メールアドレス</span>
              <span className="text-gray-900">{profile.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">プラン</span>
              <span className="inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                {plan.charAt(0).toUpperCase() + plan.slice(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">登録日</span>
              <span className="text-gray-900">{new Date(profile.createdAt).toLocaleDateString('ja-JP')}</span>
            </div>
          </div>
        </div>

        {/* Usage */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">今月の利用状況</h2>
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-gray-500">フィードバック受信数</span>
                <span className="text-gray-900">
                  {feedbackUsed} / {feedbackLimit === -1 ? '無制限' : feedbackLimit}
                </span>
              </div>
              {feedbackLimit !== -1 && (
                <div className="h-2 rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-indigo-500"
                    style={{ width: `${Math.min((feedbackUsed / feedbackLimit) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
            <div className="text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">プロジェクト上限</span>
                <span className="text-gray-900">{limits.maxProjects === -1 ? '無制限' : limits.maxProjects}</span>
              </div>
            </div>
            <div className="text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">AI分析</span>
                <span className="text-gray-900">{limits.aiAnalysis ? '利用可能' : '利用不可'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
