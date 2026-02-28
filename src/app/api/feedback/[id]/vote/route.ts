import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const body = await req.json();
    const { fingerprint } = body;

    if (!fingerprint) {
      return NextResponse.json({ error: 'fingerprint is required' }, { status: 400 });
    }

    // Get IP hash for secondary dedup
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    const encoder = new TextEncoder();
    const data = encoder.encode(ip + 'voiceboard-salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const ipHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const { data: result, error } = await supabaseAdmin.rpc('voiceboard_upvote', {
      p_feedback_id: id,
      p_fingerprint: fingerprint,
      p_ip_hash: ipHash,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: result });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
