export const PLANS = {
  free: { price: 0, label: 'Free', labelJa: '無料' },
  pro: { price: 1900, label: 'Pro', labelJa: 'プロ' },
  business: { price: 4900, label: 'Business', labelJa: 'ビジネス' },
};

export async function createCheckoutSession(accessToken: string, planId: 'pro' | 'business'): Promise<{ url: string }> {
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ planId }),
  });
  if (!res.ok) throw new Error('チェックアウトセッションの作成に失敗しました');
  return res.json();
}

export async function checkPremiumStatus(accessToken: string): Promise<{ isPremium: boolean; plan: string }> {
  try {
    const res = await fetch('/api/stripe/status', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    if (!res.ok) return { isPremium: false, plan: 'free' };
    return res.json();
  } catch {
    return { isPremium: false, plan: 'free' };
  }
}
