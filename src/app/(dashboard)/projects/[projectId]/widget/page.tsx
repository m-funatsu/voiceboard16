'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getProjectById, getWidgetConfig, upsertWidgetConfig } from '@/lib/storage';
import { APP_URL } from '@/lib/constants';
import type { Project, WidgetConfig } from '@/types';

export default function WidgetConfigPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [project, setProject] = useState<Project | null>(null);
  const [config, setConfig] = useState<Partial<WidgetConfig>>({
    position: 'bottom-right',
    theme: 'light',
    accentColor: '#6366f1',
    triggerText: 'Feedback',
    showBoardLink: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, wc] = await Promise.all([getProjectById(projectId), getWidgetConfig(projectId)]);
        setProject(p);
        if (wc) setConfig(wc);
        if (p && !wc) setConfig((c) => ({ ...c, accentColor: p.accentColor }));
      } catch (err) {
        console.error('Failed to load widget config:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertWidgetConfig(projectId, config);
    } catch (err) {
      console.error('Failed to save widget config:', err);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const widgetSnippet = `<script>
(function() {
  var s = document.createElement('script');
  s.src = '${APP_URL}/widget/v1.js';
  s.async = true;
  s.onload = function() {
    VoiceBoard.init({
      projectId: '${projectId}',
      position: '${config.position}',
      theme: '${config.theme}',
      accentColor: '${config.accentColor}',
      triggerText: '${config.triggerText}',
      apiBase: '${APP_URL}'
    });
  };
  document.head.appendChild(s);
})();
</script>`;

  const iframeSnippet = `<iframe
  src="${APP_URL}/embed/${projectId}"
  width="100%"
  height="600"
  frameborder="0"
  style="border: 1px solid #e5e7eb; border-radius: 12px;"
></iframe>`;

  if (loading) return <div className="text-sm text-gray-500">読み込み中...</div>;
  if (!project) return <div className="text-sm text-red-500">プロジェクトが見つかりません</div>;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">ウィジェット設定</h1>

      {/* Config */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">外観設定</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">位置</label>
            <select
              value={config.position}
              onChange={(e) => setConfig({ ...config, position: e.target.value as WidgetConfig['position'] })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="bottom-right">右下</option>
              <option value="bottom-left">左下</option>
              <option value="top-right">右上</option>
              <option value="top-left">左上</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">テーマ</label>
            <select
              value={config.theme}
              onChange={(e) => setConfig({ ...config, theme: e.target.value as WidgetConfig['theme'] })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="light">ライト</option>
              <option value="dark">ダーク</option>
              <option value="auto">自動</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">テーマカラー</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.accentColor}
                onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                className="h-9 w-9 cursor-pointer rounded border"
              />
              <span className="text-sm text-gray-500">{config.accentColor}</span>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">ボタンテキスト</label>
            <input
              type="text"
              value={config.triggerText}
              onChange={(e) => setConfig({ ...config, triggerText: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? '保存中...' : '設定を保存'}
        </button>
      </div>

      {/* Widget embed code */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">JSウィジェット</h2>
          <button
            onClick={() => copyToClipboard(widgetSnippet, 'widget')}
            className="rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
          >
            {copied === 'widget' ? 'コピーしました!' : 'コピー'}
          </button>
        </div>
        <p className="mb-3 text-sm text-gray-500">
          以下のコードを、あなたのサイトの &lt;/body&gt; タグの前に貼り付けてください。
        </p>
        <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-green-400">
          <code>{widgetSnippet}</code>
        </pre>
      </div>

      {/* iframe embed code */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">iframe埋め込み</h2>
          <button
            onClick={() => copyToClipboard(iframeSnippet, 'iframe')}
            className="rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
          >
            {copied === 'iframe' ? 'コピーしました!' : 'コピー'}
          </button>
        </div>
        <p className="mb-3 text-sm text-gray-500">
          フィードバック一覧をページ内にインラインで埋め込みます。
        </p>
        <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-green-400">
          <code>{iframeSnippet}</code>
        </pre>
      </div>
    </div>
  );
}
