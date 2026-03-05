'use client';

import { useState, useMemo } from 'react';
import {
  getResponseTemplate,
} from '@/lib/logic';
import {
  COLLECTION_CHANNELS,
  FEEDBACK_CATEGORIES,
  RESPONSE_TEMPLATES,
  SENTIMENT_WEIGHTS,
  type CollectionChannel,
  type ExtendedCategory,
  type ResponseType,
} from '@/data/master-data';

type ActiveTab = 'channels' | 'categories' | 'templates' | 'weights';

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
        active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );
}

function ChannelsTab() {
  const channels = Object.values(COLLECTION_CHANNELS);
  const sorted = [...channels].sort((a, b) => b.qualityScore - a.qualityScore);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">収集チャネル比較</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">チャネル</th>
                <th className="px-4 py-3 font-medium text-gray-600">説明</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">回答率</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">品質</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((ch) => (
                <tr key={ch.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{ch.icon}</span>
                      <span className="font-medium text-gray-900">{ch.labelJa}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs">{ch.description}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-200">
                        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(ch.typicalResponseRate, 100)}%` }} />
                      </div>
                      <span className="font-medium text-gray-700">{ch.typicalResponseRate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${i < ch.qualityScore ? 'text-yellow-400' : 'text-gray-200'}`}
                        >
                          \u2605
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Channel Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {channels.map((ch) => (
          <div key={ch.id} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-2xl">{ch.icon}</span>
              <h3 className="text-lg font-semibold text-gray-900">{ch.labelJa}</h3>
            </div>
            <p className="mb-3 text-sm text-gray-600">{ch.description}</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-indigo-50 p-2 text-center">
                <div className="text-lg font-bold text-indigo-700">{ch.typicalResponseRate}%</div>
                <div className="text-xs text-indigo-500">回答率</div>
              </div>
              <div className="rounded-lg bg-yellow-50 p-2 text-center">
                <div className="text-lg font-bold text-yellow-700">{ch.qualityScore}/5</div>
                <div className="text-xs text-yellow-500">品質スコア</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoriesTab() {
  const categories = Object.values(FEEDBACK_CATEGORIES);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((cat) => (
          <div key={cat.id} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-2xl">{cat.icon}</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{cat.labelJa}</h3>
                <span className="text-xs text-gray-400">{cat.label}</span>
              </div>
            </div>
            <p className="mb-3 text-sm text-gray-600">{cat.description}</p>
            <div className="mb-2 text-xs font-medium text-gray-500">分類キーワード:</div>
            <div className="flex flex-wrap gap-1">
              {cat.keywords.map((kw) => (
                <span key={kw} className={`rounded px-1.5 py-0.5 text-xs ${cat.color}`}>
                  {kw}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TemplatesTab() {
  const [selectedType, setSelectedType] = useState<ResponseType>('thanks');
  const [selectedCategory, setSelectedCategory] = useState<ExtendedCategory | ''>('');

  const template = useMemo(
    () => getResponseTemplate(selectedType, selectedCategory || undefined),
    [selectedType, selectedCategory],
  );

  const responseTypes = Object.values(RESPONSE_TEMPLATES);

  return (
    <div className="space-y-6">
      {/* Type Selector */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">レスポンステンプレート</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          {responseTypes.map((rt) => (
            <button
              key={rt.id}
              onClick={() => setSelectedType(rt.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                selectedType === rt.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {rt.labelJa}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">カテゴリフィルター</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as ExtendedCategory | '')}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">デフォルト</option>
            <option value="bug">バグ報告</option>
            <option value="feature">機能要望</option>
            <option value="ux">UX改善</option>
          </select>
        </div>

        {/* Preview */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="mb-2 text-xs font-medium text-gray-500">プレビュー</div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{template}</div>
        </div>
      </div>

      {/* All Templates Grid */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">テンプレート一覧</h2>
        <div className="space-y-4">
          {responseTypes.map((rt) => (
            <div key={rt.id} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-gray-900">{rt.labelJa}（{rt.label}）</h3>
              <div className="space-y-2">
                {Object.entries(rt.templates).map(([key, text]) => {
                  const keyLabel: Record<string, string> = {
                    default: 'デフォルト',
                    bug: 'バグ報告',
                    feature: '機能要望',
                    ux: 'UX改善',
                  };
                  return (
                    <div key={key} className="rounded bg-white p-3 text-sm">
                      <div className="mb-1 text-xs font-medium text-gray-400">{keyLabel[key] ?? key}</div>
                      <div className="text-gray-600 leading-relaxed">{text}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WeightsTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">感情分析の重み設定</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-blue-50 p-4">
            <div className="text-sm text-blue-600 font-medium">基本ウェイト</div>
            <div className="text-2xl font-bold text-blue-800">{SENTIMENT_WEIGHTS.baseWeight}</div>
            <div className="text-xs text-blue-500">キーワード1つあたりのスコア</div>
          </div>
          <div className="rounded-lg bg-orange-50 p-4">
            <div className="text-sm text-orange-600 font-medium">強調語倍率</div>
            <div className="text-2xl font-bold text-orange-800">x{SENTIMENT_WEIGHTS.intensifierMultiplier}</div>
            <div className="text-xs text-orange-500">強調語が直前にある場合</div>
          </div>
          <div className="rounded-lg bg-purple-50 p-4">
            <div className="text-sm text-purple-600 font-medium">否定語反転係数</div>
            <div className="text-2xl font-bold text-purple-800">{SENTIMENT_WEIGHTS.negatorFlip}</div>
            <div className="text-xs text-purple-500">否定語が直前にある場合</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="text-sm text-gray-600 font-medium">スコア範囲</div>
            <div className="text-2xl font-bold text-gray-800">{SENTIMENT_WEIGHTS.clampMin} ~ {SENTIMENT_WEIGHTS.clampMax}</div>
            <div className="text-xs text-gray-500">上限/下限クランプ値</div>
          </div>
        </div>
      </div>

      {/* How scoring works */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">スコアリングの仕組み</h2>
        <div className="space-y-3">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="mb-1 text-sm font-medium text-gray-900">1. キーワードマッチング</div>
            <p className="text-sm text-gray-600">
              フィードバックのテキストをポジティブ語・ネガティブ語辞書と照合し、ヒットごとに基本ウェイト（{SENTIMENT_WEIGHTS.baseWeight}）を加算/減算します。
            </p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="mb-1 text-sm font-medium text-gray-900">2. 強調語の検出</div>
            <p className="text-sm text-gray-600">
              キーワードの直前に強調語（「とても」「非常に」等）がある場合、スコアを{SENTIMENT_WEIGHTS.intensifierMultiplier}倍にします。
            </p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="mb-1 text-sm font-medium text-gray-900">3. 否定語の検出</div>
            <p className="text-sm text-gray-600">
              キーワードの直前に否定語（「ない」「ません」等）がある場合、感情を反転（係数: {SENTIMENT_WEIGHTS.negatorFlip}）させます。
            </p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="mb-1 text-sm font-medium text-gray-900">4. クランプ処理</div>
            <p className="text-sm text-gray-600">
              最終スコアは {SENTIMENT_WEIGHTS.clampMin} ~ {SENTIMENT_WEIGHTS.clampMax} の範囲にクランプされます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChannelsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('channels');

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">マスターデータ管理</h1>
        <p className="text-sm text-gray-500">収集チャネル、カテゴリ定義、レスポンステンプレート、分析設定の参照</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 flex flex-wrap gap-2">
        <TabButton active={activeTab === 'channels'} label="収集チャネル" onClick={() => setActiveTab('channels')} />
        <TabButton active={activeTab === 'categories'} label="カテゴリ定義" onClick={() => setActiveTab('categories')} />
        <TabButton active={activeTab === 'templates'} label="レスポンステンプレート" onClick={() => setActiveTab('templates')} />
        <TabButton active={activeTab === 'weights'} label="分析設定" onClick={() => setActiveTab('weights')} />
      </div>

      {activeTab === 'channels' && <ChannelsTab />}
      {activeTab === 'categories' && <CategoriesTab />}
      {activeTab === 'templates' && <TemplatesTab />}
      {activeTab === 'weights' && <WeightsTab />}
    </div>
  );
}
