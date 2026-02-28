import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateProjectThemeSummary } from '@/lib/ai/summary';

export async function GET(req: NextRequest) {
  const projectId = new URL(req.url).searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
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
