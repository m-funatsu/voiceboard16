import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const projectId = new URL(req.url).searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
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
