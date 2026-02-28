import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const projectId = new URL(req.url).searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('voiceboard_widget_configs')
    .select('*')
    .eq('project_id', projectId)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return defaults if no config exists
  const config = data || {
    position: 'bottom-right',
    theme: 'light',
    accent_color: '#6366f1',
    trigger_text: 'Feedback',
    show_board_link: true,
  };

  return NextResponse.json(config);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
