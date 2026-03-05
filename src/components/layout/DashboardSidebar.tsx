'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { href: '/dashboard', label: 'ダッシュボード', icon: '📊' },
  { href: '/advisory', label: 'アドバイザリー', icon: '📋' },
  { href: '/nps', label: 'NPS分析', icon: '📈' },
  { href: '/priority', label: '優先度マトリクス', icon: '🎯' },
  { href: '/urgency', label: '緊急度検出', icon: '🚨' },
  { href: '/channels', label: 'マスターデータ', icon: '📚' },
  { href: '/projects/new', label: '新規プロジェクト', icon: '➕' },
  { href: '/settings', label: '設定', icon: '⚙️' },
  { href: '/pricing', label: '料金プラン', icon: '💳' },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  return (
    <aside className="flex w-60 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm">V</div>
        <span className="text-lg font-bold">VoiceBoard</span>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <div className="mb-2 text-xs text-gray-500 truncate">{profile?.email}</div>
        <div className="mb-3 inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
          {profile?.plan === 'free' ? 'Free' : profile?.plan === 'pro' ? 'Pro' : 'Business'}
        </div>
        <button
          onClick={signOut}
          className="block w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
        >
          ログアウト
        </button>
      </div>
    </aside>
  );
}
