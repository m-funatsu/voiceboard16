import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ isPremium: false, plan: 'free' });
  }

  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (!user) {
    return NextResponse.json({ isPremium: false, plan: 'free' });
  }

  const { data: profile } = await supabaseAdmin
    .from('voiceboard_profiles')
    .select('plan, is_premium')
    .eq('id', user.id)
    .single();

  return NextResponse.json({
    isPremium: profile?.is_premium ?? false,
    plan: profile?.plan ?? 'free',
  });
}
