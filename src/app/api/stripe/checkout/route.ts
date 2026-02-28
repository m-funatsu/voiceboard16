import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export async function POST(req: NextRequest) {
  try {
    const { userId, planId } = await req.json();

    if (!userId || !planId) {
      return NextResponse.json({ error: 'userId and planId are required' }, { status: 400 });
    }

    const priceId = planId === 'business'
      ? process.env.STRIPE_BUSINESS_PRICE_ID!
      : process.env.STRIPE_PRO_PRICE_ID!;

    // Get or create Stripe customer
    const { data: profile } = await supabaseAdmin
      .from('voiceboard_profiles')
      .select('email, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let customerId = profile.stripe_customer_id;
    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: profile.email,
        metadata: { userId },
      });
      customerId = customer.id;
      await supabaseAdmin
        .from('voiceboard_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?checkout=cancelled`,
      metadata: { userId, planId },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
