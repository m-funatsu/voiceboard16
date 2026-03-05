// ============================================
// VoiceBoard Master Data - Feedback Management
// ============================================

// --------------------------------------------
// 1. フィードバック分類 (Feedback Categories)
// --------------------------------------------

export type ExtendedCategory =
  | 'bug'
  | 'feature'
  | 'ux'
  | 'performance'
  | 'documentation'
  | 'pricing'
  | 'support';

export interface CategoryDefinition {
  id: ExtendedCategory;
  label: string;
  labelJa: string;
  description: string;
  color: string;
  icon: string;
  /** キーワードベース分類用 */
  keywords: string[];
}

export const FEEDBACK_CATEGORIES: Record<ExtendedCategory, CategoryDefinition> = {
  bug: {
    id: 'bug',
    label: 'Bug Report',
    labelJa: 'バグ報告',
    description: '不具合・エラー・クラッシュの報告',
    color: 'bg-red-100 text-red-800',
    icon: '🐛',
    keywords: [
      'バグ', 'エラー', '不具合', '動かない', '落ちる', 'クラッシュ',
      '表示されない', 'おかしい', '壊れ', 'フリーズ', '固まる',
      '反応しない', '応答なし', '例外', '失敗', '止まる', '消えた',
      '文字化け', 'ログインできない', '保存されない', '読み込めない',
    ],
  },
  feature: {
    id: 'feature',
    label: 'Feature Request',
    labelJa: '機能要望',
    description: '新機能の追加リクエスト',
    color: 'bg-blue-100 text-blue-800',
    icon: '✨',
    keywords: [
      '機能', '追加', '欲しい', 'ほしい', '対応してほしい', '実装',
      'できるように', 'サポート', '連携', 'インテグレーション',
      '新しい', '導入', '搭載', '組み込み', '拡張', 'API',
      'エクスポート', 'インポート', '通知', 'アラート',
    ],
  },
  ux: {
    id: 'ux',
    label: 'UX Improvement',
    labelJa: 'UX改善',
    description: 'ユーザー体験・使いやすさの改善',
    color: 'bg-purple-100 text-purple-800',
    icon: '🎨',
    keywords: [
      '使いにくい', 'わかりにくい', 'UI', 'UX', 'デザイン', '操作',
      '直感的', 'レイアウト', 'ナビゲーション', '導線', '見た目',
      '配置', 'ボタン', 'フォント', '色', 'サイズ', '間隔',
      'モバイル', 'レスポンシブ', 'アクセシビリティ',
    ],
  },
  performance: {
    id: 'performance',
    label: 'Performance',
    labelJa: 'パフォーマンス',
    description: '速度・応答性・リソース効率の改善',
    color: 'bg-orange-100 text-orange-800',
    icon: '⚡',
    keywords: [
      '遅い', '重い', '速度', 'パフォーマンス', '時間がかかる',
      'タイムアウト', '読み込み', 'ロード', 'レスポンス', '応答',
      'メモリ', 'CPU', 'キャッシュ', '最適化', 'スケール',
    ],
  },
  documentation: {
    id: 'documentation',
    label: 'Documentation',
    labelJa: 'ドキュメント',
    description: 'マニュアル・ヘルプ・説明の改善',
    color: 'bg-teal-100 text-teal-800',
    icon: '📚',
    keywords: [
      'ドキュメント', 'マニュアル', 'ヘルプ', '説明', 'ガイド',
      'チュートリアル', 'FAQ', 'ドキュメンテーション', '資料',
      '手順', '方法がわからない', '使い方', 'README', '仕様',
    ],
  },
  pricing: {
    id: 'pricing',
    label: 'Pricing',
    labelJa: '価格',
    description: '料金・プラン・課金に関するフィードバック',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '💰',
    keywords: [
      '価格', '料金', 'プラン', '高い', '安い', 'コスト', '課金',
      '無料', '有料', 'サブスクリプション', '支払い', '割引',
      'クーポン', '月額', '年額', 'トライアル', '返金',
    ],
  },
  support: {
    id: 'support',
    label: 'Support',
    labelJa: 'サポート',
    description: 'カスタマーサポートに関するフィードバック',
    color: 'bg-indigo-100 text-indigo-800',
    icon: '🎧',
    keywords: [
      'サポート', '問い合わせ', '対応', '返信', 'カスタマー',
      'ヘルプデスク', 'チャット', 'チケット', '質問', '相談',
      '連絡', '担当者', 'レスポンス', '回答', '窓口',
    ],
  },
};

// --------------------------------------------
// 2. 感情分析ルール (Sentiment Analysis Rules)
// --------------------------------------------

export interface SentimentKeywords {
  positive: string[];
  negative: string[];
  intensifiers: string[];
  negators: string[];
}

export const SENTIMENT_KEYWORDS: SentimentKeywords = {
  positive: [
    // 称賛・満足
    '素晴らしい', '最高', '良い', 'よい', 'いい', '好き', '便利',
    '助かる', '嬉しい', 'ありがたい', '感謝', '使いやすい',
    '気に入', '満足', '快適', '優秀', '完璧', '期待通り',
    'スムーズ', '直感的', '効率的', '分かりやすい', 'わかりやすい',
    '見やすい', '速い', '早い', '安定', '信頼', '愛用',
    '気持ちいい', '綺麗', 'きれい', '楽', '簡単', '手軽',
    '推薦', 'おすすめ', '神', '最強', '感動', '革命的',
  ],
  negative: [
    // 不満・問題
    '悪い', 'ダメ', '使えない', '使いにくい', 'わかりにくい',
    '不満', '不便', '面倒', '残念', '困る', '困った',
    '遅い', '重い', 'ひどい', '最悪', 'がっかり', '失望',
    'イライラ', 'ストレス', '不安定', '信頼できない', '壊れ',
    'バグ', 'エラー', '不具合', 'クラッシュ', '落ちる',
    '動かない', '高い', '高すぎ', '解約', 'キャンセル',
    '乗り換え', '移行', '改悪', '劣化', '退化', '複雑',
    '意味不明', '理解できない', '無駄', '不要', 'うざい',
  ],
  intensifiers: [
    // 強調語（スコア倍率適用）
    'とても', '非常に', 'すごく', 'めちゃくちゃ', 'かなり',
    '極めて', '本当に', 'まじで', 'マジで', '超',
    '激しく', '圧倒的に', '断然', '絶対', '明らかに',
  ],
  negators: [
    // 否定語（感情反転用）
    'ない', 'ません', 'なく', 'ず', '不', '非',
    'できない', 'しない', 'ならない', 'いけない',
  ],
};

/** 感情スコアの重み設定 */
export const SENTIMENT_WEIGHTS = {
  /** 基本キーワード1つあたりのスコア */
  baseWeight: 0.3,
  /** 強調語が直前にある場合の倍率 */
  intensifierMultiplier: 1.5,
  /** 否定語が直前にある場合の反転係数 */
  negatorFlip: -0.8,
  /** スコアの上限・下限 */
  clampMin: -1.0,
  clampMax: 1.0,
} as const;

export type SentimentLabel = 'positive' | 'negative' | 'neutral';

export const SENTIMENT_THRESHOLDS = {
  positiveMin: 0.2,
  negativeMax: -0.2,
} as const;

// --------------------------------------------
// 3. NPS計算 (Net Promoter Score)
// --------------------------------------------

export type NPSSegment = 'promoter' | 'passive' | 'detractor';

export interface NPSConfig {
  promoterRange: { min: number; max: number };
  passiveRange: { min: number; max: number };
  detractorRange: { min: number; max: number };
}

export const NPS_CONFIG: NPSConfig = {
  promoterRange: { min: 9, max: 10 },
  passiveRange: { min: 7, max: 8 },
  detractorRange: { min: 0, max: 6 },
};

export interface IndustryBenchmark {
  industry: string;
  industryJa: string;
  averageNPS: number;
  topQuartile: number;
}

export const NPS_BENCHMARKS: IndustryBenchmark[] = [
  { industry: 'SaaS', industryJa: 'SaaS', averageNPS: 31, topQuartile: 55 },
  { industry: 'E-Commerce', industryJa: 'EC', averageNPS: 45, topQuartile: 65 },
  { industry: 'FinTech', industryJa: 'フィンテック', averageNPS: 34, topQuartile: 56 },
  { industry: 'Healthcare', industryJa: 'ヘルスケア', averageNPS: 27, topQuartile: 50 },
  { industry: 'EdTech', industryJa: 'エドテック', averageNPS: 38, topQuartile: 58 },
  { industry: 'Media', industryJa: 'メディア', averageNPS: 22, topQuartile: 42 },
  { industry: 'Logistics', industryJa: '物流', averageNPS: 18, topQuartile: 38 },
  { industry: 'Travel', industryJa: '旅行', averageNPS: 29, topQuartile: 48 },
  { industry: 'Gaming', industryJa: 'ゲーム', averageNPS: 25, topQuartile: 45 },
  { industry: 'HRTech', industryJa: 'HRテック', averageNPS: 30, topQuartile: 52 },
];

// --------------------------------------------
// 4. 優先度マトリクス (Priority Matrix)
// --------------------------------------------

export type PriorityQuadrant =
  | 'critical'     // 高インパクト × 高頻度 → 最優先
  | 'strategic'    // 高インパクト × 低頻度 → 計画的対応
  | 'quick_win'    // 低インパクト × 高頻度 → 素早く対応
  | 'backlog';     // 低インパクト × 低頻度 → 後回し

export interface PriorityQuadrantConfig {
  id: PriorityQuadrant;
  label: string;
  labelJa: string;
  description: string;
  color: string;
  actionAdvice: string;
}

export const PRIORITY_QUADRANTS: Record<PriorityQuadrant, PriorityQuadrantConfig> = {
  critical: {
    id: 'critical',
    label: 'Critical',
    labelJa: '最優先',
    description: '高インパクト・高頻度 - すぐに対応すべき課題',
    color: 'bg-red-100 text-red-800 border-red-300',
    actionAdvice: '次のスプリントで最優先対応。関連チームへ即座にエスカレーション。',
  },
  strategic: {
    id: 'strategic',
    label: 'Strategic',
    labelJa: '計画的対応',
    description: '高インパクト・低頻度 - ロードマップに組み込む',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    actionAdvice: 'ロードマップに組み込み、四半期計画で対応。詳細な要件定義を実施。',
  },
  quick_win: {
    id: 'quick_win',
    label: 'Quick Win',
    labelJa: '素早く対応',
    description: '低インパクト・高頻度 - 少ない工数で多くのユーザーに影響',
    color: 'bg-green-100 text-green-800 border-green-300',
    actionAdvice: '空き時間や改善スプリントで対応。1-2日以内で完了できる施策を優先。',
  },
  backlog: {
    id: 'backlog',
    label: 'Backlog',
    labelJa: 'バックログ',
    description: '低インパクト・低頻度 - 余裕がある時に検討',
    color: 'bg-gray-100 text-gray-600 border-gray-300',
    actionAdvice: 'バックログに記録し定期的にレビュー。状況変化で優先度が上がる可能性あり。',
  },
};

/** 優先度スコア算出の閾値 */
export const PRIORITY_THRESHOLDS = {
  /** インパクトが「高い」と判定する最低スコア (0-1) */
  highImpact: 0.6,
  /** 頻度が「高い」と判定する最低値 */
  highFrequency: 5,
} as const;

// --------------------------------------------
// 5. フィードバック収集チャネル (Collection Channels)
// --------------------------------------------

export type CollectionChannel =
  | 'widget'
  | 'email'
  | 'survey'
  | 'sns'
  | 'interview'
  | 'support_ticket'
  | 'app_review';

export interface ChannelConfig {
  id: CollectionChannel;
  label: string;
  labelJa: string;
  description: string;
  icon: string;
  /** 一般的なレスポンス率 (%) */
  typicalResponseRate: number;
  /** フィードバック品質の傾向 (1-5) */
  qualityScore: number;
}

export const COLLECTION_CHANNELS: Record<CollectionChannel, ChannelConfig> = {
  widget: {
    id: 'widget',
    label: 'Widget',
    labelJa: 'ウィジェット',
    description: 'プロダクト内埋め込みフィードバックフォーム',
    icon: '💬',
    typicalResponseRate: 8,
    qualityScore: 4,
  },
  email: {
    id: 'email',
    label: 'Email',
    labelJa: 'メール',
    description: 'メールによるフィードバック収集',
    icon: '📧',
    typicalResponseRate: 15,
    qualityScore: 3,
  },
  survey: {
    id: 'survey',
    label: 'Survey',
    labelJa: 'アンケート',
    description: '定期的なユーザーアンケート',
    icon: '📋',
    typicalResponseRate: 12,
    qualityScore: 4,
  },
  sns: {
    id: 'sns',
    label: 'SNS',
    labelJa: 'SNS',
    description: 'Twitter/X、Facebook等のソーシャルメディア',
    icon: '📱',
    typicalResponseRate: 2,
    qualityScore: 2,
  },
  interview: {
    id: 'interview',
    label: 'Interview',
    labelJa: 'インタビュー',
    description: '1on1ユーザーインタビュー',
    icon: '🎙️',
    typicalResponseRate: 90,
    qualityScore: 5,
  },
  support_ticket: {
    id: 'support_ticket',
    label: 'Support Ticket',
    labelJa: 'サポートチケット',
    description: 'カスタマーサポートから転送されたフィードバック',
    icon: '🎫',
    typicalResponseRate: 100,
    qualityScore: 3,
  },
  app_review: {
    id: 'app_review',
    label: 'App Review',
    labelJa: 'アプリレビュー',
    description: 'アプリストアのレビュー・評価',
    icon: '⭐',
    typicalResponseRate: 1,
    qualityScore: 2,
  },
};

// --------------------------------------------
// 6. レスポンステンプレート (Response Templates)
// --------------------------------------------

export type ResponseType = 'thanks' | 'investigating' | 'resolved' | 'declined';

export interface ResponseTemplate {
  id: ResponseType;
  label: string;
  labelJa: string;
  /** カテゴリ別テンプレート本文 */
  templates: {
    default: string;
    bug: string;
    feature: string;
    ux: string;
  };
}

export const RESPONSE_TEMPLATES: Record<ResponseType, ResponseTemplate> = {
  thanks: {
    id: 'thanks',
    label: 'Thank You',
    labelJa: '感謝',
    templates: {
      default:
        '貴重なフィードバックをいただきありがとうございます。お寄せいただいたご意見は、チーム内で共有し今後の改善に活かしてまいります。',
      bug:
        'バグのご報告ありがとうございます。開発チームにて状況を確認いたします。追加の情報がございましたら、お気軽にお知らせください。',
      feature:
        '機能のご要望をいただきありがとうございます。プロダクトロードマップの検討材料として活用させていただきます。',
      ux:
        'UI/UXに関するご意見ありがとうございます。より使いやすいプロダクトを目指して改善を検討いたします。',
    },
  },
  investigating: {
    id: 'investigating',
    label: 'Investigating',
    labelJa: '調査中',
    templates: {
      default:
        'いただいたフィードバックについて、現在チームで調査・検討を進めております。進捗がございましたら改めてご連絡いたします。',
      bug:
        'ご報告いただいた不具合について、現在開発チームで原因調査を行っております。再現手順を確認し、修正に取り組んでまいります。',
      feature:
        'ご要望いただいた機能について、技術的な実現可能性と優先度を検討しております。結果が出ましたらお知らせいたします。',
      ux:
        'UX改善のご提案について、デザインチームで検証を進めております。ユーザビリティテストの結果を踏まえて対応を決定いたします。',
    },
  },
  resolved: {
    id: 'resolved',
    label: 'Resolved',
    labelJa: '対応完了',
    templates: {
      default:
        'いただいたフィードバックへの対応が完了いたしました。改善内容をご確認いただき、引き続きお気づきの点がございましたらお知らせください。',
      bug:
        'ご報告いただいた不具合の修正が完了いたしました。最新バージョンにてご確認ください。同様の問題が再発した場合はお知らせください。',
      feature:
        'ご要望いただいた機能を実装いたしました。新機能をお試しいただき、ご感想をお聞かせいただけると幸いです。',
      ux:
        'UI/UX改善の対応が完了いたしました。新しいデザインをご確認ください。さらなる改善点がございましたらフィードバックをお待ちしております。',
    },
  },
  declined: {
    id: 'declined',
    label: 'Declined',
    labelJa: '見送り',
    templates: {
      default:
        'いただいたフィードバックについて慎重に検討いたしましたが、現時点では対応を見送らせていただくことになりました。今後の方針変更時に再度検討させていただきます。',
      bug:
        'ご報告いただいた件について調査いたしましたが、現在の仕様として想定された動作であることを確認いたしました。ご不便をおかけし申し訳ございません。',
      feature:
        'ご要望いただいた機能について検討いたしましたが、プロダクトの方向性を踏まえ、現時点では実装を見送らせていただきます。代替手段がございましたらご案内いたします。',
      ux:
        'UX改善のご提案について検討いたしましたが、全体的な一貫性やアクセシビリティの観点から、現在のデザインを維持する判断をいたしました。',
    },
  },
};

// --------------------------------------------
// 7. 緊急度判定ルール (Urgency Detection)
// --------------------------------------------

export interface UrgencyRule {
  pattern: string[];
  severity: 'critical' | 'high' | 'medium';
  description: string;
}

export const URGENCY_RULES: UrgencyRule[] = [
  {
    pattern: ['データ', '消えた', '消失', '紛失', 'ロスト'],
    severity: 'critical',
    description: 'データ損失の可能性',
  },
  {
    pattern: ['セキュリティ', '脆弱性', '漏洩', '不正アクセス', 'ハッキング'],
    severity: 'critical',
    description: 'セキュリティインシデントの可能性',
  },
  {
    pattern: ['課金', '二重', '請求', '引き落とし', '返金'],
    severity: 'critical',
    description: '課金トラブルの可能性',
  },
  {
    pattern: ['全く', '使えない', '完全に', '停止', 'ダウン'],
    severity: 'high',
    description: 'サービス停止レベルの障害',
  },
  {
    pattern: ['至急', '緊急', 'すぐに', '早急', 'ASAP'],
    severity: 'high',
    description: 'ユーザーが緊急と判断',
  },
  {
    pattern: ['解約', 'キャンセル', '乗り換え', '退会', 'やめる'],
    severity: 'medium',
    description: 'チャーンリスク',
  },
];

// --------------------------------------------
// 8. アドバイザリー設定 (Advisory Config)
// --------------------------------------------

export const ADVISORY_CONFIG = {
  /** 未対応フィードバックの警告閾値（日数） */
  unrespondedWarningDays: 7,
  /** 感情トレンド比較期間（日数） */
  sentimentTrendPeriodDays: 30,
  /** 上位課題抽出のデフォルト件数 */
  defaultTopIssuesLimit: 5,
  /** チャーンリスク判定のネガティブ率閾値 (%) */
  churnRiskNegativeThreshold: 40,
  /** NPS低下警告の閾値（ポイント） */
  npsDeclineWarningThreshold: 5,
} as const;
