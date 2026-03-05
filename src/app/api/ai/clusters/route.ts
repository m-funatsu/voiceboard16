import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';

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
    .select('*')
    .eq('project_id', projectId)
    .order('priority_score', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch feedback items for each cluster
  const clustersWithItems = await Promise.all(
    (clusters || []).map(async (cluster) => {
      const { data: items } = await supabaseAdmin
        .from('voiceboard_feedback')
        .select('id, title, description, vote_count, status, category, created_at')
        .eq('cluster_id', cluster.id)
        .order('vote_count', { ascending: false });
      return { ...cluster, items: items || [] };
    })
  );

  return NextResponse.json(clustersWithItems);
}
