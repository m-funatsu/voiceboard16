'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import type { Plan } from '@/types';

interface PremiumContextType {
  isPremium: boolean;
  plan: Plan;
  loading: boolean;
  refresh: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType>({
  isPremium: false,
  plan: 'free',
  loading: true,
  refresh: async () => {},
});

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [plan, setPlan] = useState<Plan>('free');
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (profile) {
      setIsPremium(profile.isPremium);
      setPlan(profile.plan);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [profile]);

  return (
    <PremiumContext.Provider value={{ isPremium, plan, loading, refresh }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  return useContext(PremiumContext);
}
