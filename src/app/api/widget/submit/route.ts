import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

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

    // Increment usage
    await supabaseAdmin.rpc('voiceboard_increment_usage', { p_user_id: project.user_id });

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
