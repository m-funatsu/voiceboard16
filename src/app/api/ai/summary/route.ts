import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateProjectThemeSummary } from '@/lib/ai/summary';

async function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET(req: NextRequest) {
  const projectId = new URL(req.url).searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  // Check project visibility
  const { data: project, error: projectError } = await supabaseAdmin
    .from('voiceboard_projects')
    .select('id, user_id, is_public')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  if (!project.is_public) {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (project.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const { data: clusters, error } = await supabaseAdmin
    .from('voiceboard_clusters')
    .select('label, summary, combined_vote_count, feedback_count')
    .eq('project_id', projectId)
    .order('priority_score', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!clusters || clusters.length === 0) {
    return NextResponse.json({ summary: 'まだ分析するフィードバックがありません。' });
  }

  try {
    const summary = await generateProjectThemeSummary(
      clusters.map((c) => ({
        label: c.label,
        summary: c.summary,
        combinedVoteCount: c.combined_vote_count,
        feedbackCount: c.feedback_count,
      }))
    );
    return NextResponse.json({ summary });
  } catch (err) {
    console.error('Summary generation error:', err);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}
