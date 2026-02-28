export type FeedbackCategory = 'bug' | 'feature' | 'improvement';
export type FeedbackStatus = 'open' | 'planned' | 'in_progress' | 'completed' | 'declined';
export type Plan = 'free' | 'pro' | 'business';

export interface Profile {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  plan: Plan;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  isPremium: boolean;
  premiumActivatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description: string | null;
  accentColor: string;
  logoUrl: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Feedback {
  id: string;
  projectId: string;
  title: string;
  description: string;
  category: FeedbackCategory;
  status: FeedbackStatus;
  submitterEmail: string | null;
  submitterFingerprint: string | null;
  voteCount: number;
  isApproved: boolean;
  isArchived: boolean;
  mergedIntoId: string | null;
  clusterId: string | null;
  priorityScore: number;
  createdAt: string;
  updatedAt: string;
  hasVoted?: boolean;
}

export interface Vote {
  id: string;
  feedbackId: string;
  voterFingerprint: string | null;
  voterUserId: string | null;
  voterIpHash: string | null;
  createdAt: string;
}

export interface FeedbackCluster {
  id: string;
  projectId: string;
  label: string;
  summary: string | null;
  combinedVoteCount: number;
  feedbackCount: number;
  priorityScore: number;
  createdAt: string;
  updatedAt: string;
  items?: Feedback[];
}

export interface WidgetConfig {
  id: string;
  projectId: string;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme: 'light' | 'dark' | 'auto';
  accentColor: string;
  triggerText: string;
  showBoardLink: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsageInfo {
  userId: string;
  billingPeriod: string;
  feedbackCount: number;
}

export interface FeedbackSubmission {
  projectId: string;
  title: string;
  description: string;
  category: FeedbackCategory;
  email?: string;
  fingerprint?: string;
}

export interface FeedbackFilters {
  category?: FeedbackCategory;
  status?: FeedbackStatus;
  sort: 'votes' | 'newest' | 'trending';
  page: number;
  limit: number;
}

export const CATEGORY_CONFIG: Record<FeedbackCategory, { label: string; labelJa: string; color: string }> = {
  bug: { label: 'Bug', labelJa: 'バグ', color: 'bg-red-100 text-red-800' },
  feature: { label: 'Feature', labelJa: '機能要望', color: 'bg-blue-100 text-blue-800' },
  improvement: { label: 'Improvement', labelJa: '改善', color: 'bg-green-100 text-green-800' },
};

export const STATUS_CONFIG: Record<FeedbackStatus, { label: string; labelJa: string; color: string }> = {
  open: { label: 'Open', labelJa: '未対応', color: 'bg-gray-100 text-gray-800' },
  planned: { label: 'Planned', labelJa: '予定', color: 'bg-purple-100 text-purple-800' },
  in_progress: { label: 'In Progress', labelJa: '対応中', color: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Completed', labelJa: '完了', color: 'bg-green-100 text-green-800' },
  declined: { label: 'Declined', labelJa: '見送り', color: 'bg-red-100 text-red-800' },
};

export const PLAN_LIMITS = {
  free: { maxProjects: 1, maxFeedbackPerMonth: 50, aiAnalysis: false, customDomain: false, removeBranding: false },
  pro: { maxProjects: -1, maxFeedbackPerMonth: -1, aiAnalysis: true, customDomain: true, removeBranding: true },
  business: { maxProjects: -1, maxFeedbackPerMonth: -1, aiAnalysis: true, customDomain: true, removeBranding: true },
} as const;
