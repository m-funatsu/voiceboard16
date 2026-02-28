import Link from 'next/link';
import AuthForm from '@/components/auth/AuthForm';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm">V</div>
            <span className="text-xl font-bold">VoiceBoard</span>
          </Link>
          <p className="mt-2 text-sm text-gray-600">無料アカウントを作成</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <AuthForm mode="signup" />
        </div>
        <p className="mt-4 text-center text-sm text-gray-600">
          既にアカウントをお持ちの方は{' '}
          <Link href="/login" className="text-indigo-600 hover:underline">ログイン</Link>
        </p>
      </div>
    </div>
  );
}
