// ============================================
// VoiceBoard - Feedback Analytics Engine
// ============================================

import type { Feedback, FeedbackStatus } from '@/types';
import {
  FEEDBACK_CATEGORIES,
  SENTIMENT_KEYWORDS,
  SENTIMENT_WEIGHTS,
  SENTIMENT_THRESHOLDS,
  NPS_CONFIG,
  NPS_BENCHMARKS,
  PRIORITY_THRESHOLDS,
  URGENCY_RULES,
  ADVISORY_CONFIG,
  RESPONSE_TEMPLATES,
  type ExtendedCategory,
  type SentimentLabel,
  type NPSSegment,
  type PriorityQuadrant,
  type ResponseType,
  type IndustryBenchmark,
} from '@/data/master-data';

// ============================================
// Types
// ============================================

export interface ClassificationResult {
  category: ExtendedCategory;
  confidence: number;
  matchedKeywords: string[];
}

export interface SentimentResult {
  score: number;
  label: SentimentLabel;
  positiveMatches: string[];
  negativeMatches: string[];
}

export interface NPSResult {
  score: number;
  promoterCount: number;
  passiveCount: number;
  detractorCount: number;
  promoterPercent: number;
  passivePercent: number;
  detractorPercent: number;
  total: number;
  benchmark: IndustryBenchmark | null;
  evaluation: string;
}

export interface NPSResponse {
  score: number;
  date?: string;
}

export interface FeedbackClusterGroup {
  label: string;
  items: FeedbackItem[];
  averageSentiment: number;
  totalVotes: number;
  dominantCategory: ExtendedCategory;
}

export interface FeedbackItem {
  id: string;
  title: string;
  description: string;
  category?: string;
  status?: FeedbackStatus;
  voteCount: number;
  createdAt: string;
  updatedAt?: string;
  respondedAt?: string | null;
  sentiment?: number;
}

export interface PrioritizedFeedback {
  item: FeedbackItem;
  quadrant: PriorityQuadrant;
  impactScore: number;
  frequencyScore: number;
  priorityScore: number;
}

export interface SentimentTrendPoint {
  period: string;
  averageSentiment: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  total: number;
}

export interface TopIssue {
  title: string;
  category: ExtendedCategory;
  occurrences: number;
  totalVotes: number;
  averageSentiment: number;
  relatedIds: string[];
}

export interface ResponseRateResult {
  totalFeedback: number;
  respondedCount: number;
  unrepondedCount: number;
  responseRate: number;
  averageResponseTimeHours: number | null;
  overdueCount: number;
}

export interface UrgencyResult {
  isUrgent: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
  reasons: string[];
  matchedPatterns: string[];
}

export interface AdvisoryReport {
  generatedAt: string;
  nps: {
    current: number | null;
    previousPeriod: number | null;
    trend: 'improving' | 'declining' | 'stable';
    benchmarkComparison: string;
  };
  topRequests: Array<{
    rank: number;
    title: string;
    votes: number;
    category: string;
  }>;
  topComplaints: Array<{
    rank: number;
    title: string;
    votes: number;
    category: string;
  }>;
  sentimentTrend: {
    currentPositiveRate: number;
    previousPositiveRate: number;
    changeDescription: string;
  };
  unresolvedWarnings: Array<{
    id: string;
    title: string;
    daysSinceCreated: number;
    severity: string;
  }>;
  roadmapSuggestions: Array<{
    priority: number;
    action: string;
    rationale: string;
    estimatedImpact: string;
  }>;
  churnRisk: {
    level: 'high' | 'medium' | 'low';
    negativeRate: number;
    indicators: string[];
  };
}

// ============================================
// 1. classifyFeedback - フィードバック自動分類
// ============================================

export function classifyFeedback(text: string): ClassificationResult {
  const normalizedText = text.toLowerCase();
  const scores: Array<{ category: ExtendedCategory; score: number; matches: string[] }> = [];

  for (const [categoryId, categoryDef] of Object.entries(FEEDBACK_CATEGORIES)) {
    const matched: string[] = [];
    let score = 0;

    for (const keyword of categoryDef.keywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        matched.push(keyword);
        score += 1;
      }
    }

    scores.push({
      category: categoryId as ExtendedCategory,
      score,
      matches: matched,
    });
  }

  scores.sort((a, b) => b.score - a.score);

  const best = scores[0];
  if (best.score === 0) {
    return {
      category: 'feature',
      confidence: 0,
      matchedKeywords: [],
    };
  }

  const totalKeywordHits = scores.reduce((sum, s) => sum + s.score, 0);
  const confidence = Math.min(best.score / Math.max(totalKeywordHits, 1), 1);

  return {
    category: best.category,
    confidence,
    matchedKeywords: best.matches,
  };
}

// ============================================
// 2. analyzeSentiment - 日本語感情分析
// ============================================

export function analyzeSentiment(text: string): SentimentResult {
  const normalizedText = text.toLowerCase();
  let score = 0;
  const positiveMatches: string[] = [];
  const negativeMatches: string[] = [];

  const hasIntensifierBefore = (position: number): boolean => {
    const preceding = normalizedText.slice(Math.max(0, position - 10), position);
    return SENTIMENT_KEYWORDS.intensifiers.some((w) => preceding.includes(w.toLowerCase()));
  };

  const hasNegatorBefore = (position: number): boolean => {
    const preceding = normalizedText.slice(Math.max(0, position - 8), position);
    return SENTIMENT_KEYWORDS.negators.some((w) => preceding.includes(w.toLowerCase()));
  };

  for (const keyword of SENTIMENT_KEYWORDS.positive) {
    const lowerKeyword = keyword.toLowerCase();
    const idx = normalizedText.indexOf(lowerKeyword);
    if (idx !== -1) {
      let weight = SENTIMENT_WEIGHTS.baseWeight;

      if (hasIntensifierBefore(idx)) {
        weight *= SENTIMENT_WEIGHTS.intensifierMultiplier;
      }

      if (hasNegatorBefore(idx)) {
        weight *= SENTIMENT_WEIGHTS.negatorFlip;
        negativeMatches.push(keyword);
      } else {
        positiveMatches.push(keyword);
      }

      score += weight;
    }
  }

  for (const keyword of SENTIMENT_KEYWORDS.negative) {
    const lowerKeyword = keyword.toLowerCase();
    const idx = normalizedText.indexOf(lowerKeyword);
    if (idx !== -1) {
      let weight = -SENTIMENT_WEIGHTS.baseWeight;

      if (hasIntensifierBefore(idx)) {
        weight *= SENTIMENT_WEIGHTS.intensifierMultiplier;
      }

      if (hasNegatorBefore(idx)) {
        weight *= SENTIMENT_WEIGHTS.negatorFlip;
        positiveMatches.push(keyword);
      } else {
        negativeMatches.push(keyword);
      }

      score += weight;
    }
  }

  score = Math.max(SENTIMENT_WEIGHTS.clampMin, Math.min(SENTIMENT_WEIGHTS.clampMax, score));

  let label: SentimentLabel;
  if (score >= SENTIMENT_THRESHOLDS.positiveMin) {
    label = 'positive';
  } else if (score <= SENTIMENT_THRESHOLDS.negativeMax) {
    label = 'negative';
  } else {
    label = 'neutral';
  }

  return { score, label, positiveMatches, negativeMatches };
}

// ============================================
// 3. calculateNPS - NPS算出
// ============================================

export function calculateNPS(
  responses: NPSResponse[],
  industry?: string,
): NPSResult {
  if (responses.length === 0) {
    return {
      score: 0,
      promoterCount: 0,
      passiveCount: 0,
      detractorCount: 0,
      promoterPercent: 0,
      passivePercent: 0,
      detractorPercent: 0,
      total: 0,
      benchmark: null,
      evaluation: '回答データがありません',
    };
  }

  let promoterCount = 0;
  let passiveCount = 0;
  let detractorCount = 0;

  for (const response of responses) {
    const s = Math.round(Math.max(0, Math.min(10, response.score)));
    if (s >= NPS_CONFIG.promoterRange.min) {
      promoterCount++;
    } else if (s >= NPS_CONFIG.passiveRange.min) {
      passiveCount++;
    } else {
      detractorCount++;
    }
  }

  const total = responses.length;
  const promoterPercent = (promoterCount / total) * 100;
  const passivePercent = (passiveCount / total) * 100;
  const detractorPercent = (detractorCount / total) * 100;
  const score = Math.round(promoterPercent - detractorPercent);

  const benchmark = industry
    ? NPS_BENCHMARKS.find(
        (b) => b.industry.toLowerCase() === industry.toLowerCase() ||
               b.industryJa === industry,
      ) ?? null
    : null;

  let evaluation: string;
  if (benchmark) {
    if (score >= benchmark.topQuartile) {
      evaluation = `業界トップクラス（${benchmark.industryJa}平均: ${benchmark.averageNPS}）`;
    } else if (score >= benchmark.averageNPS) {
      evaluation = `業界平均以上（${benchmark.industryJa}平均: ${benchmark.averageNPS}）`;
    } else {
      evaluation = `業界平均以下（${benchmark.industryJa}平均: ${benchmark.averageNPS}、改善が必要）`;
    }
  } else {
    if (score >= 50) {
      evaluation = '非常に良好';
    } else if (score >= 0) {
      evaluation = '改善の余地あり';
    } else {
      evaluation = '早急な改善が必要';
    }
  }

  return {
    score,
    promoterCount,
    passiveCount,
    detractorCount,
    promoterPercent: Math.round(promoterPercent * 10) / 10,
    passivePercent: Math.round(passivePercent * 10) / 10,
    detractorPercent: Math.round(detractorPercent * 10) / 10,
    total,
    benchmark,
    evaluation,
  };
}

// ============================================
// 4. clusterFeedback - 類似フィードバックグルーピング
// ============================================

export function clusterFeedbackByKeywords(items: FeedbackItem[]): FeedbackClusterGroup[] {
  if (items.length === 0) return [];

  const groups = new Map<string, FeedbackItem[]>();

  for (const item of items) {
    const text = `${item.title} ${item.description}`;
    const classification = classifyFeedback(text);
    const sentiment = analyzeSentiment(text);

    const enrichedItem: FeedbackItem = {
      ...item,
      category: classification.category,
      sentiment: sentiment.score,
    };

    const topKeywords = classification.matchedKeywords.slice(0, 3).sort().join('|');
    const groupKey = topKeywords || classification.category;

    const existing = groups.get(groupKey);
    if (existing) {
      existing.push(enrichedItem);
    } else {
      groups.set(groupKey, [enrichedItem]);
    }
  }

  const clusters: FeedbackClusterGroup[] = [];
  for (const [label, groupItems] of groups) {
    const sentiments = groupItems.map((it) => it.sentiment ?? 0);
    const averageSentiment =
      sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
    const totalVotes = groupItems.reduce((sum, it) => sum + it.voteCount, 0);

    const categoryCounts = new Map<string, number>();
    for (const it of groupItems) {
      const cat = it.category ?? 'feature';
      categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
    }
    let dominantCategory: ExtendedCategory = 'feature';
    let maxCount = 0;
    for (const [cat, count] of categoryCounts) {
      if (count > maxCount) {
        maxCount = count;
        dominantCategory = cat as ExtendedCategory;
      }
    }

    clusters.push({
      label,
      items: groupItems,
      averageSentiment: Math.round(averageSentiment * 100) / 100,
      totalVotes,
      dominantCategory,
    });
  }

  clusters.sort((a, b) => b.totalVotes - a.totalVotes);
  return clusters;
}

// ============================================
// 5. prioritizeFeedback - インパクト×頻度の優先度
// ============================================

export function prioritizeFeedback(items: FeedbackItem[]): PrioritizedFeedback[] {
  if (items.length === 0) return [];

  const maxVotes = Math.max(...items.map((it) => it.voteCount), 1);

  const clusters = clusterFeedbackByKeywords(items);
  const itemClusterSize = new Map<string, number>();
  for (const cluster of clusters) {
    for (const item of cluster.items) {
      itemClusterSize.set(item.id, cluster.items.length);
    }
  }

  const results: PrioritizedFeedback[] = items.map((item) => {
    const clusterSize = itemClusterSize.get(item.id) ?? 1;
    const sentiment = analyzeSentiment(`${item.title} ${item.description}`);

    // インパクトスコア: 投票数の正規化 + ネガティブ度による緊急性加算
    const voteNormalized = item.voteCount / maxVotes;
    const negativityBonus = Math.max(0, -sentiment.score) * 0.3;
    const impactScore = Math.min(1, voteNormalized * 0.7 + negativityBonus + 0.1);

    // 頻度スコア: クラスタサイズ（同様の報告数）
    const frequencyScore = clusterSize;

    // 総合優先度スコア
    const priorityScore = impactScore * 60 + frequencyScore * 40;

    // 象限判定
    const isHighImpact = impactScore >= PRIORITY_THRESHOLDS.highImpact;
    const isHighFrequency = frequencyScore >= PRIORITY_THRESHOLDS.highFrequency;

    let quadrant: PriorityQuadrant;
    if (isHighImpact && isHighFrequency) {
      quadrant = 'critical';
    } else if (isHighImpact && !isHighFrequency) {
      quadrant = 'strategic';
    } else if (!isHighImpact && isHighFrequency) {
      quadrant = 'quick_win';
    } else {
      quadrant = 'backlog';
    }

    return {
      item,
      quadrant,
      impactScore: Math.round(impactScore * 100) / 100,
      frequencyScore,
      priorityScore: Math.round(priorityScore * 100) / 100,
    };
  });

  results.sort((a, b) => b.priorityScore - a.priorityScore);
  return results;
}

// ============================================
// 6. trackSentimentTrend - 感情推移分析
// ============================================

export function trackSentimentTrend(
  feedbacks: FeedbackItem[],
  period: 'daily' | 'weekly' | 'monthly',
): SentimentTrendPoint[] {
  if (feedbacks.length === 0) return [];

  const buckets = new Map<
    string,
    { sentiments: number[]; positive: number; negative: number; neutral: number }
  >();

  for (const fb of feedbacks) {
    const date = new Date(fb.createdAt);
    let key: string;

    switch (period) {
      case 'daily':
        key = date.toISOString().slice(0, 10);
        break;
      case 'weekly': {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        key = startOfWeek.toISOString().slice(0, 10);
        break;
      }
      case 'monthly':
        key = date.toISOString().slice(0, 7);
        break;
    }

    const sentiment = analyzeSentiment(`${fb.title} ${fb.description}`);

    if (!buckets.has(key)) {
      buckets.set(key, { sentiments: [], positive: 0, negative: 0, neutral: 0 });
    }
    const bucket = buckets.get(key)!;
    bucket.sentiments.push(sentiment.score);

    if (sentiment.label === 'positive') bucket.positive++;
    else if (sentiment.label === 'negative') bucket.negative++;
    else bucket.neutral++;
  }

  const trend: SentimentTrendPoint[] = [];
  for (const [periodKey, data] of buckets) {
    const avg = data.sentiments.reduce((s, v) => s + v, 0) / data.sentiments.length;
    trend.push({
      period: periodKey,
      averageSentiment: Math.round(avg * 100) / 100,
      positiveCount: data.positive,
      negativeCount: data.negative,
      neutralCount: data.neutral,
      total: data.sentiments.length,
    });
  }

  trend.sort((a, b) => a.period.localeCompare(b.period));
  return trend;
}

// ============================================
// 7. identifyTopIssues - 上位課題抽出
// ============================================

export function identifyTopIssues(
  feedbacks: FeedbackItem[],
  limit: number = ADVISORY_CONFIG.defaultTopIssuesLimit,
): TopIssue[] {
  const clusters = clusterFeedbackByKeywords(feedbacks);

  const issues: TopIssue[] = clusters.map((cluster) => {
    const sentiments = cluster.items.map((it) =>
      analyzeSentiment(`${it.title} ${it.description}`).score,
    );
    const avgSentiment = sentiments.reduce((s, v) => s + v, 0) / sentiments.length;

    return {
      title: cluster.label,
      category: cluster.dominantCategory,
      occurrences: cluster.items.length,
      totalVotes: cluster.totalVotes,
      averageSentiment: Math.round(avgSentiment * 100) / 100,
      relatedIds: cluster.items.map((it) => it.id),
    };
  });

  // ソート: 出現回数 × 投票数の積でランキング
  issues.sort((a, b) => b.occurrences * b.totalVotes - a.occurrences * a.totalVotes);
  return issues.slice(0, limit);
}

// ============================================
// 8. calculateResponseRate - 対応率と平均対応時間
// ============================================

export function calculateResponseRate(feedbacks: FeedbackItem[]): ResponseRateResult {
  if (feedbacks.length === 0) {
    return {
      totalFeedback: 0,
      respondedCount: 0,
      unrepondedCount: 0,
      responseRate: 0,
      averageResponseTimeHours: null,
      overdueCount: 0,
    };
  }

  const resolvedStatuses: FeedbackStatus[] = ['planned', 'in_progress', 'completed', 'declined'];
  let respondedCount = 0;
  const responseTimes: number[] = [];
  let overdueCount = 0;
  const now = Date.now();
  const warningMs = ADVISORY_CONFIG.unrespondedWarningDays * 24 * 60 * 60 * 1000;

  for (const fb of feedbacks) {
    const hasResponse = fb.status && resolvedStatuses.includes(fb.status);

    if (hasResponse) {
      respondedCount++;
      if (fb.respondedAt) {
        const created = new Date(fb.createdAt).getTime();
        const responded = new Date(fb.respondedAt).getTime();
        responseTimes.push((responded - created) / (1000 * 60 * 60));
      }
    } else {
      const created = new Date(fb.createdAt).getTime();
      if (now - created > warningMs) {
        overdueCount++;
      }
    }
  }

  const unrepondedCount = feedbacks.length - respondedCount;
  const responseRate = Math.round((respondedCount / feedbacks.length) * 1000) / 10;
  const averageResponseTimeHours =
    responseTimes.length > 0
      ? Math.round((responseTimes.reduce((s, v) => s + v, 0) / responseTimes.length) * 10) / 10
      : null;

  return {
    totalFeedback: feedbacks.length,
    respondedCount,
    unrepondedCount,
    responseRate,
    averageResponseTimeHours,
    overdueCount,
  };
}

// ============================================
// 9. detectUrgent - 緊急対応必要フィードバック検出
// ============================================

export function detectUrgent(feedback: FeedbackItem): UrgencyResult {
  const text = `${feedback.title} ${feedback.description}`.toLowerCase();
  const reasons: string[] = [];
  const matchedPatterns: string[] = [];
  let highestSeverity: 'critical' | 'high' | 'medium' | 'low' = 'low';

  const severityOrder = { critical: 3, high: 2, medium: 1, low: 0 };

  for (const rule of URGENCY_RULES) {
    const matched = rule.pattern.filter((p) => text.includes(p.toLowerCase()));
    if (matched.length > 0) {
      matchedPatterns.push(...matched);
      reasons.push(rule.description);
      if (severityOrder[rule.severity] > severityOrder[highestSeverity]) {
        highestSeverity = rule.severity;
      }
    }
  }

  // 感情分析による追加判定
  const sentiment = analyzeSentiment(text);
  if (sentiment.score <= -0.7) {
    reasons.push('極めてネガティブな感情を検出');
    if (severityOrder.high > severityOrder[highestSeverity]) {
      highestSeverity = 'high';
    }
  }

  // 投票数が多い + ネガティブ = 影響範囲が大きい
  if (feedback.voteCount >= 10 && sentiment.score < -0.3) {
    reasons.push(`高投票数(${feedback.voteCount})かつネガティブ: 影響範囲が大きい`);
    if (severityOrder.high > severityOrder[highestSeverity]) {
      highestSeverity = 'high';
    }
  }

  return {
    isUrgent: highestSeverity !== 'low',
    severity: highestSeverity,
    reasons,
    matchedPatterns,
  };
}

// ============================================
// 10. generateAdvisory - "So What?" レポート生成
// ============================================

export function generateAdvisory(
  feedbacks: FeedbackItem[],
  npsResponses?: NPSResponse[],
  previousNpsResponses?: NPSResponse[],
  industry?: string,
): AdvisoryReport {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - ADVISORY_CONFIG.sentimentTrendPeriodDays * 24 * 60 * 60 * 1000);

  // --- NPS分析 ---
  const currentNps = npsResponses ? calculateNPS(npsResponses, industry) : null;
  const previousNps = previousNpsResponses ? calculateNPS(previousNpsResponses, industry) : null;

  let npsTrend: 'improving' | 'declining' | 'stable' = 'stable';
  if (currentNps && previousNps && previousNps.total > 0) {
    const diff = currentNps.score - previousNps.score;
    if (diff >= ADVISORY_CONFIG.npsDeclineWarningThreshold) npsTrend = 'improving';
    else if (diff <= -ADVISORY_CONFIG.npsDeclineWarningThreshold) npsTrend = 'declining';
  }

  let benchmarkComparison = '業界ベンチマークデータなし';
  if (currentNps?.benchmark) {
    benchmarkComparison = currentNps.evaluation;
  } else if (currentNps) {
    benchmarkComparison = currentNps.evaluation;
  }

  // --- 感情トレンド ---
  const recentFeedbacks = feedbacks.filter((fb) => new Date(fb.createdAt) >= thirtyDaysAgo);
  const olderFeedbacks = feedbacks.filter((fb) => {
    const d = new Date(fb.createdAt);
    const sixtyDaysAgo = new Date(thirtyDaysAgo.getTime() - ADVISORY_CONFIG.sentimentTrendPeriodDays * 24 * 60 * 60 * 1000);
    return d >= sixtyDaysAgo && d < thirtyDaysAgo;
  });

  const countPositive = (items: FeedbackItem[]): number =>
    items.filter((fb) => analyzeSentiment(`${fb.title} ${fb.description}`).label === 'positive').length;

  const currentPositiveRate = recentFeedbacks.length > 0
    ? Math.round((countPositive(recentFeedbacks) / recentFeedbacks.length) * 100)
    : 0;
  const previousPositiveRate = olderFeedbacks.length > 0
    ? Math.round((countPositive(olderFeedbacks) / olderFeedbacks.length) * 100)
    : 0;

  const positiveDiff = currentPositiveRate - previousPositiveRate;
  let changeDescription: string;
  if (olderFeedbacks.length === 0) {
    changeDescription = `直近${ADVISORY_CONFIG.sentimentTrendPeriodDays}日間のポジティブ率: ${currentPositiveRate}%（比較データなし）`;
  } else if (positiveDiff > 0) {
    changeDescription = `先月比でポジティブ${positiveDiff}%増（${previousPositiveRate}% → ${currentPositiveRate}%）`;
  } else if (positiveDiff < 0) {
    changeDescription = `先月比でポジティブ${Math.abs(positiveDiff)}%減（${previousPositiveRate}% → ${currentPositiveRate}%）`;
  } else {
    changeDescription = `先月と同水準（ポジティブ率: ${currentPositiveRate}%）`;
  }

  // --- 上位要望・不満 ---
  const positiveFeedbacks = feedbacks.filter(
    (fb) => analyzeSentiment(`${fb.title} ${fb.description}`).label === 'positive',
  );
  const negativeFeedbacks = feedbacks.filter(
    (fb) => analyzeSentiment(`${fb.title} ${fb.description}`).label === 'negative',
  );

  const topRequestClusters = clusterFeedbackByKeywords(
    feedbacks.filter((fb) => {
      const cat = classifyFeedback(`${fb.title} ${fb.description}`).category;
      return cat === 'feature' || cat === 'ux';
    }),
  ).slice(0, 5);

  const topComplaintClusters = clusterFeedbackByKeywords(negativeFeedbacks).slice(0, 5);

  const topRequests = topRequestClusters.map((c, i) => ({
    rank: i + 1,
    title: c.label,
    votes: c.totalVotes,
    category: c.dominantCategory,
  }));

  const topComplaints = topComplaintClusters.map((c, i) => ({
    rank: i + 1,
    title: c.label,
    votes: c.totalVotes,
    category: c.dominantCategory,
  }));

  // --- 未対応フィードバック警告 ---
  const unresolvedWarnings = feedbacks
    .filter((fb) => {
      const isUnresolved = !fb.status || fb.status === 'open';
      const created = new Date(fb.createdAt).getTime();
      const daysSince = (now.getTime() - created) / (1000 * 60 * 60 * 24);
      return isUnresolved && daysSince >= ADVISORY_CONFIG.unrespondedWarningDays;
    })
    .map((fb) => {
      const daysSinceCreated = Math.floor(
        (now.getTime() - new Date(fb.createdAt).getTime()) / (1000 * 60 * 60 * 24),
      );
      const urgency = detectUrgent(fb);
      return {
        id: fb.id,
        title: fb.title,
        daysSinceCreated,
        severity: urgency.severity,
      };
    })
    .sort((a, b) => b.daysSinceCreated - a.daysSinceCreated);

  // --- ロードマップ提案 ---
  const prioritized = prioritizeFeedback(feedbacks);
  const roadmapSuggestions: AdvisoryReport['roadmapSuggestions'] = [];

  const criticalItems = prioritized.filter((p) => p.quadrant === 'critical').slice(0, 2);
  const strategicItems = prioritized.filter((p) => p.quadrant === 'strategic').slice(0, 2);
  const quickWins = prioritized.filter((p) => p.quadrant === 'quick_win').slice(0, 2);

  let priority = 1;
  for (const item of criticalItems) {
    roadmapSuggestions.push({
      priority: priority++,
      action: `「${item.item.title}」への対応`,
      rationale: `インパクト: ${item.impactScore}、頻度: ${item.frequencyScore}件の類似報告`,
      estimatedImpact: '高 - 多数のユーザーに影響する最優先課題',
    });
  }
  for (const item of strategicItems) {
    roadmapSuggestions.push({
      priority: priority++,
      action: `「${item.item.title}」の計画的実装`,
      rationale: `インパクトが高く（${item.impactScore}）、戦略的価値のある改善`,
      estimatedImpact: '中-高 - 製品の競争力を強化',
    });
  }
  for (const item of quickWins) {
    roadmapSuggestions.push({
      priority: priority++,
      action: `「${item.item.title}」の簡易対応`,
      rationale: `${item.frequencyScore}件の類似報告があり、少ない工数で多くのユーザーに効果`,
      estimatedImpact: '中 - コスト効率の高い改善',
    });
  }

  // --- チャーンリスク ---
  const negativeRate = feedbacks.length > 0
    ? Math.round((negativeFeedbacks.length / feedbacks.length) * 100)
    : 0;

  const churnIndicators: string[] = [];
  if (negativeRate >= ADVISORY_CONFIG.churnRiskNegativeThreshold) {
    churnIndicators.push(`ネガティブ率${negativeRate}%（閾値: ${ADVISORY_CONFIG.churnRiskNegativeThreshold}%）`);
  }
  if (npsTrend === 'declining') {
    churnIndicators.push('NPSが前期比で下降傾向');
  }
  if (unresolvedWarnings.length >= 10) {
    churnIndicators.push(`${unresolvedWarnings.length}件の未対応フィードバック（${ADVISORY_CONFIG.unrespondedWarningDays}日超過）`);
  }

  const churnKeywords = ['解約', 'キャンセル', '乗り換え', '退会', 'やめる'];
  const churnMentions = feedbacks.filter((fb) => {
    const text = `${fb.title} ${fb.description}`;
    return churnKeywords.some((kw) => text.includes(kw));
  }).length;
  if (churnMentions > 0) {
    churnIndicators.push(`解約関連の言及が${churnMentions}件`);
  }

  let churnLevel: 'high' | 'medium' | 'low';
  if (churnIndicators.length >= 3) {
    churnLevel = 'high';
  } else if (churnIndicators.length >= 1) {
    churnLevel = 'medium';
  } else {
    churnLevel = 'low';
  }

  return {
    generatedAt: now.toISOString(),
    nps: {
      current: currentNps?.score ?? null,
      previousPeriod: previousNps?.score ?? null,
      trend: npsTrend,
      benchmarkComparison,
    },
    topRequests,
    topComplaints,
    sentimentTrend: {
      currentPositiveRate,
      previousPositiveRate,
      changeDescription,
    },
    unresolvedWarnings,
    roadmapSuggestions,
    churnRisk: {
      level: churnLevel,
      negativeRate,
      indicators: churnIndicators,
    },
  };
}

// ============================================
// Utility: レスポンステンプレート取得
// ============================================

export function getResponseTemplate(
  responseType: ResponseType,
  category?: ExtendedCategory,
): string {
  const template = RESPONSE_TEMPLATES[responseType];
  if (!template) return '';

  if (category && category in template.templates) {
    return template.templates[category as keyof typeof template.templates];
  }
  return template.templates.default;
}

// ============================================
// Utility: NPSセグメント判定
// ============================================

export function classifyNPSSegment(score: number): NPSSegment {
  const clamped = Math.round(Math.max(0, Math.min(10, score)));
  if (clamped >= NPS_CONFIG.promoterRange.min) return 'promoter';
  if (clamped >= NPS_CONFIG.passiveRange.min) return 'passive';
  return 'detractor';
}
