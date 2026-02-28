import { supabase } from './supabase';
import type { Project, Feedback, FeedbackFilters, FeedbackSubmission, WidgetConfig, UsageInfo, FeedbackStatus } from '@/types';

// ============================================
// Projects
// ============================================

export async function getProjects(userId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from('voiceboard_projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Project[];
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('voiceboard_projects')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data as Project | null;
}

export async function getProjectById(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('voiceboard_projects')
    .select('*')
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data as Project | null;
}

export async function createProject(project: { userId: string; name: string; slug: string; description?: string; accentColor?: string }): Promise<Project> {
  const { data, error } = await supabase
    .from('voiceboard_projects')
    .insert({
      user_id: project.userId,
      name: project.name,
      slug: project.slug,
      description: project.description || null,
      accent_color: project.accentColor || '#6366f1',
    })
    .select()
    .single();
  if (error) throw error;
  return data as Project;
}

export async function updateProject(id: string, updates: Partial<Pick<Project, 'name' | 'slug' | 'description' | 'accentColor' | 'isPublic'>>): Promise<Project> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.slug !== undefined) dbUpdates.slug = updates.slug;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.accentColor !== undefined) dbUpdates.accent_color = updates.accentColor;
  if (updates.isPublic !== undefined) dbUpdates.is_public = updates.isPublic;

  const { data, error } = await supabase
    .from('voiceboard_projects')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Project;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase
    .from('voiceboard_projects')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ============================================
// Feedback
// ============================================

export async function getFeedback(projectId: string, filters: FeedbackFilters): Promise<{ items: Feedback[]; total: number }> {
  let query = supabase
    .from('voiceboard_feedback')
    .select('*', { count: 'exact' })
    .eq('project_id', projectId)
    .eq('is_approved', true)
    .eq('is_archived', false)
    .is('merged_into_id', null);

  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  switch (filters.sort) {
    case 'votes':
      query = query.order('vote_count', { ascending: false });
      break;
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'trending':
      query = query.order('priority_score', { ascending: false });
      break;
  }

  const offset = (filters.page - 1) * filters.limit;
  query = query.range(offset, offset + filters.limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { items: data as Feedback[], total: count || 0 };
}

export async function getAllFeedbackForProject(projectId: string): Promise<Feedback[]> {
  const { data, error } = await supabase
    .from('voiceboard_feedback')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Feedback[];
}

export async function getFeedbackById(id: string): Promise<Feedback | null> {
  const { data, error } = await supabase
    .from('voiceboard_feedback')
    .select('*')
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data as Feedback | null;
}

export async function submitFeedback(submission: FeedbackSubmission): Promise<Feedback> {
  const { data, error } = await supabase
    .from('voiceboard_feedback')
    .insert({
      project_id: submission.projectId,
      title: submission.title,
      description: submission.description,
      category: submission.category,
      submitter_email: submission.email || null,
      submitter_fingerprint: submission.fingerprint || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Feedback;
}

export async function updateFeedback(id: string, updates: Partial<Pick<Feedback, 'status' | 'isApproved' | 'isArchived' | 'mergedIntoId' | 'clusterId'>>): Promise<Feedback> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.isApproved !== undefined) dbUpdates.is_approved = updates.isApproved;
  if (updates.isArchived !== undefined) dbUpdates.is_archived = updates.isArchived;
  if (updates.mergedIntoId !== undefined) dbUpdates.merged_into_id = updates.mergedIntoId;
  if (updates.clusterId !== undefined) dbUpdates.cluster_id = updates.clusterId;

  const { data, error } = await supabase
    .from('voiceboard_feedback')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Feedback;
}

export async function deleteFeedback(id: string): Promise<void> {
  const { error } = await supabase
    .from('voiceboard_feedback')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ============================================
// Votes
// ============================================

export async function upvoteFeedback(feedbackId: string, fingerprint: string, ipHash?: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('voiceboard_upvote', {
    p_feedback_id: feedbackId,
    p_fingerprint: fingerprint,
    p_ip_hash: ipHash || null,
  });
  if (error) throw error;
  return data as boolean;
}

export async function hasVoted(feedbackId: string, fingerprint: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('voiceboard_votes')
    .select('id')
    .eq('feedback_id', feedbackId)
    .eq('voter_fingerprint', fingerprint)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

export async function getVotedFeedbackIds(projectId: string, fingerprint: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('voiceboard_votes')
    .select('feedback_id, voiceboard_feedback!inner(project_id)')
    .eq('voter_fingerprint', fingerprint)
    .eq('voiceboard_feedback.project_id', projectId);
  if (error) throw error;
  return new Set((data || []).map((v: { feedback_id: string }) => v.feedback_id));
}

// ============================================
// Widget Configs
// ============================================

export async function getWidgetConfig(projectId: string): Promise<WidgetConfig | null> {
  const { data, error } = await supabase
    .from('voiceboard_widget_configs')
    .select('*')
    .eq('project_id', projectId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data as WidgetConfig | null;
}

export async function upsertWidgetConfig(projectId: string, config: Partial<WidgetConfig>): Promise<WidgetConfig> {
  const { data, error } = await supabase
    .from('voiceboard_widget_configs')
    .upsert({
      project_id: projectId,
      position: config.position || 'bottom-right',
      theme: config.theme || 'light',
      accent_color: config.accentColor || '#6366f1',
      trigger_text: config.triggerText || 'Feedback',
      show_board_link: config.showBoardLink ?? true,
    }, { onConflict: 'project_id' })
    .select()
    .single();
  if (error) throw error;
  return data as WidgetConfig;
}

// ============================================
// Usage
// ============================================

export async function getUsage(userId: string): Promise<UsageInfo | null> {
  const billingPeriod = new Date();
  billingPeriod.setDate(1);
  const periodStr = billingPeriod.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('voiceboard_usage')
    .select('*')
    .eq('user_id', userId)
    .eq('billing_period', periodStr)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ? { userId: data.user_id, billingPeriod: data.billing_period, feedbackCount: data.feedback_count } : null;
}

// ============================================
// Stats
// ============================================

export async function getProjectStats(projectId: string): Promise<{ totalFeedback: number; totalVotes: number; statusCounts: Record<FeedbackStatus, number> }> {
  const { data, error } = await supabase
    .from('voiceboard_feedback')
    .select('status, vote_count')
    .eq('project_id', projectId)
    .eq('is_archived', false);
  if (error) throw error;

  const statusCounts: Record<FeedbackStatus, number> = { open: 0, planned: 0, in_progress: 0, completed: 0, declined: 0 };
  let totalVotes = 0;
  for (const item of data || []) {
    statusCounts[item.status as FeedbackStatus] = (statusCounts[item.status as FeedbackStatus] || 0) + 1;
    totalVotes += item.vote_count;
  }

  return { totalFeedback: (data || []).length, totalVotes, statusCounts };
}
