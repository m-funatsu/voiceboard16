export const APP_NAME = 'VoiceBoard';
export const APP_DESCRIPTION = 'Collect, organize, and prioritize user feedback with AI-powered insights';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const ITEMS_PER_PAGE = 20;

export const RATE_LIMITS = {
  submissionsPerHour: 10,
  votesPerSecond: 3,
} as const;
