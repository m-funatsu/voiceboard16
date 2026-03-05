import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/notifications';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Check for completed transcriptions not yet notified
    const { data: completedFeedback, error: feedbackError } = await supabaseAdmin
      .from('voiceboard_feedback')
      .select('id, project_id, title, submitter_email')
      .eq('status', 'completed')
      .eq('notified', false);

    if (feedbackError) throw feedbackError;

    let notified = 0;

    for (const item of completedFeedback || []) {
      // Get project owner
      const { data: project } = await supabaseAdmin
        .from('voiceboard_projects')
        .select('user_id, name')
        .eq('id', item.project_id)
        .single();

      if (!project) continue;

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('id', project.user_id)
        .single();

      if (profile?.email) {
        await sendEmail({
          to: profile.email,
          subject: '議事録が完成しました',
          body: `
            <h2 style="color:#111827;font-size:18px;margin:0 0 12px;">議事録が完成しました</h2>
            <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 8px;">
              プロジェクト「<strong>${project.name}</strong>」のフィードバック「${item.title}」の処理が完了しました。
            </p>
            <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 20px;">
              ダッシュボードから結果をご確認ください。
            </p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://voiceboard.app'}/projects/${item.project_id}"
               style="display:inline-block;background:#6366f1;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
              結果を確認する
            </a>
          `,
        });

        // Mark as notified
        await supabaseAdmin
          .from('voiceboard_feedback')
          .update({ notified: true })
          .eq('id', item.id);

        notified++;
      }
    }

    return NextResponse.json({ success: true, notified });
  } catch (err) {
    console.error('[notifications] Cron error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
