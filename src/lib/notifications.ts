import { Resend } from 'resend';

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY!);
  return _resend;
}
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@example.com';

interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
}

export async function sendEmail({ to, subject, body }: SendEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[notifications] RESEND_API_KEY not set, skipping email');
    return null;
  }
  try {
    const { data, error } = await getResend().emails.send({
      from: `VoiceBoard <${FROM_EMAIL}>`,
      to,
      subject,
      html: wrapTemplate(subject, body),
    });
    if (error) { console.error('[notifications] Send failed:', error); return null; }
    return data;
  } catch (err) { console.error('[notifications] Error:', err); return null; }
}

function wrapTemplate(title: string, body: string): string {
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
<div style="padding:32px;">${body}</div>
<div style="padding:16px 32px;background:#f9fafb;text-align:center;font-size:12px;color:#9ca3af;"><p>この通知の配信停止は設定画面から行えます。</p></div>
</div></body></html>`;
}
