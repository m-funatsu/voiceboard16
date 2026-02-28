import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm">V</div>
            <span className="text-xl font-bold text-gray-900">VoiceBoard</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
              ログイン
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              無料で始める
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mb-4 inline-block rounded-full bg-indigo-100 px-4 py-1 text-sm font-medium text-indigo-700">
            投票者数無制限 - 全プラン共通
          </div>
          <h1 className="mb-6 text-5xl font-bold leading-tight text-gray-900">
            ユーザーの声を集めて、
            <br />
            <span className="text-indigo-600">AIで優先度を可視化</span>
          </h1>
          <p className="mb-8 text-lg text-gray-600">
            埋め込み可能なフィードバックウィジェットで要望を収集。
            <br />
            誰でも閲覧・投票でき、AIが類似の声をまとめて優先度を自動判定します。
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-indigo-600 px-6 py-3 text-base font-medium text-white hover:bg-indigo-700"
            >
              無料で始める
            </Link>
            <Link
              href="#features"
              className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
            >
              機能を見る
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">3つの機能</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {/* Widget */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 text-2xl">
                💬
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">埋め込みウィジェット</h3>
              <p className="text-sm text-gray-600">
                JSスニペットまたはiframeで、あなたのサイトやツールにフィードバックフォームを簡単に設置。
                ユーザーは離脱せずに要望を送信できます。
              </p>
            </div>

            {/* Public Board */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-2xl">
                👍
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">公開フィードバックボード</h3>
              <p className="text-sm text-gray-600">
                全てのフィードバックを一覧表示。誰でも閲覧でき、
                賛同する要望には「Good」ボタンで投票。人気の要望が一目でわかります。
              </p>
            </div>

            {/* AI Dashboard */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-2xl">
                🤖
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">AI管理者ダッシュボード</h3>
              <p className="text-sm text-gray-600">
                AIが類似のフィードバックを自動でグルーピング。
                投票数・新しさ・類似件数から優先度を算出し、管理画面で一括管理。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">使い方</h2>
          <div className="space-y-8">
            {[
              { step: '1', title: 'プロジェクトを作成', desc: '管理画面でフィードバックボードを作成し、テーマカラーを設定します。' },
              { step: '2', title: 'ウィジェットを埋め込む', desc: '生成されるコードをあなたのサイトに貼り付けるだけ。iframeでの埋め込みも可能です。' },
              { step: '3', title: 'ユーザーが投稿・投票', desc: 'ユーザーはアカウント不要でフィードバック投稿と投票ができます。' },
              { step: '4', title: 'AIが分析・優先順位付け', desc: '類似のフィードバックを自動統合し、優先度スコアで何から対応すべきか明確にします。' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-4 text-center text-3xl font-bold text-gray-900">料金プラン</h2>
          <p className="mb-12 text-center text-gray-600">全プラン投票者数無制限。成長しても料金は変わりません。</p>
          <div className="grid gap-8 md:grid-cols-3">
            {/* Free */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="mb-1 text-lg font-semibold">Free</h3>
              <div className="mb-4 text-3xl font-bold">$0<span className="text-base font-normal text-gray-500">/月</span></div>
              <ul className="mb-6 space-y-2 text-sm text-gray-600">
                <li>1 ボード</li>
                <li>50件 / 月</li>
                <li>投票者数無制限</li>
                <li>基本AI（類似検出）</li>
                <li>VoiceBoardブランド表示</li>
              </ul>
              <Link href="/signup" className="block rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-medium hover:bg-gray-50">
                無料で始める
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-xl border-2 border-indigo-600 bg-white p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white">
                人気
              </div>
              <h3 className="mb-1 text-lg font-semibold">Pro</h3>
              <div className="mb-4 text-3xl font-bold">$19<span className="text-base font-normal text-gray-500">/月</span></div>
              <ul className="mb-6 space-y-2 text-sm text-gray-600">
                <li>無制限ボード</li>
                <li>無制限フィードバック</li>
                <li>投票者数無制限</li>
                <li>フルAI分析</li>
                <li>カスタムドメイン</li>
                <li>ブランド非表示</li>
              </ul>
              <Link href="/signup" className="block rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700">
                Proを始める
              </Link>
            </div>

            {/* Business */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="mb-1 text-lg font-semibold">Business</h3>
              <div className="mb-4 text-3xl font-bold">$49<span className="text-base font-normal text-gray-500">/月</span></div>
              <ul className="mb-6 space-y-2 text-sm text-gray-600">
                <li>Proの全機能</li>
                <li>ホワイトラベル</li>
                <li>API アクセス</li>
                <li>高度な分析</li>
                <li>優先サポート</li>
              </ul>
              <Link href="/signup" className="block rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-medium hover:bg-gray-50">
                Businessを始める
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">ユーザーの声を、プロダクトの力に</h2>
          <p className="mb-8 text-indigo-100">無料プランで今すぐ始めましょう。クレジットカード不要。</p>
          <Link
            href="/signup"
            className="inline-block rounded-lg bg-white px-6 py-3 text-base font-medium text-indigo-600 hover:bg-indigo-50"
          >
            無料で始める
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-gray-500">
          &copy; 2026 VoiceBoard. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
