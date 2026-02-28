import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const sort = searchParams.get('sort') || 'votes';
  const category = searchParams.get('category');
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  let query = supabaseAdmin
    .from('voiceboard_feedback')
    .select('*', { count: 'exact' })
    .eq('project_id', projectId)
    .eq('is_approved', true)
    .eq('is_archived', false)
    .is('merged_into_id', null);

  if (category) query = query.eq('category', category);
  if (status) query = query.eq('status', status);

  switch (sort) {
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

  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data, total: count || 0 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, title, description, category, email, fingerprint } = body;

    if (!projectId || !title) {
      return NextResponse.json({ error: 'projectId and title are required' }, { status: 400 });
    }

    if (title.length > 200) {
      return NextResponse.json({ error: 'Title too long' }, { status: 400 });
    }

    // Verify project exists and is public
    const { data: project } = await supabaseAdmin
      .from('voiceboard_projects')
      .select('id, user_id, is_public')
      .eq('id', projectId)
      .single();

    if (!project || !project.is_public) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Increment usage for project owner
    await supabaseAdmin.rpc('voiceboard_increment_usage', { p_user_id: project.user_id });

    // Insert feedback
    const { data, error } = await supabaseAdmin
      .from('voiceboard_feedback')
      .insert({
        project_id: projectId,
        title: title.trim(),
        description: (description || '').trim(),
        category: category || 'feature',
        submitter_email: email || null,
        submitter_fingerprint: fingerprint || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
