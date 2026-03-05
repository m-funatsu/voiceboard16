import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret || !sig) {
    return NextResponse.json({ received: true, configured: false });
  }

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(stripeSecretKey);
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const planId = session.metadata?.planId || 'pro';

      if (userId) {
        await supabaseAdmin
          .from('voiceboard_profiles')
          .update({
            plan: planId,
            is_premium: true,
            premium_activated_at: new Date().toISOString(),
            stripe_subscription_id: session.subscription as string,
          })
          .eq('id', userId);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await supabaseAdmin
        .from('voiceboard_profiles')
        .update({
          plan: 'free',
          is_premium: false,
          stripe_subscription_id: null,
        })
        .eq('stripe_subscription_id', subscription.id);
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      if (subscription.status === 'active') {
        await supabaseAdmin
          .from('voiceboard_profiles')
          .update({ is_premium: true })
          .eq('stripe_subscription_id', subscription.id);
      } else if (subscription.status === 'past_due' || subscription.status === 'canceled') {
        await supabaseAdmin
          .from('voiceboard_profiles')
          .update({ is_premium: false, plan: 'free' })
          .eq('stripe_subscription_id', subscription.id);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const customerId = invoice.customer as string;
      console.error(`Payment failed for customer: ${customerId}`);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
