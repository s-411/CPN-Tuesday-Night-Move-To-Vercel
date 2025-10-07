import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../lib/supabase/types/database';

export const config = {
  api: {
    bodyParser: false,
  },
};

function getEnv(name: string): string | undefined {
  return process.env[name];
}

function requireEnv(name: string): string {
  const value = getEnv(name);
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const stripeSecretKey = requireEnv('STRIPE_SECRET_KEY');
  const webhookSecret = requireEnv('STRIPE_WEBHOOK_SECRET');
  const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL') || getEnv('VITE_SUPABASE_URL');
  const supabaseServiceRole = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl) {
    return res.status(500).json({ error: 'Supabase URL not configured' });
  }

  const stripe = new Stripe(stripeSecretKey);
  const supabase = createClient<Database>(supabaseUrl, supabaseServiceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const sig = req.headers['stripe-signature'] as string | undefined;
  if (!sig) {
    return res.status(400).json({ error: 'No signature provided' });
  }

  const rawBody = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err?.message || err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const planType = session.metadata?.plan_type as 'weekly' | 'annual' | undefined;
        if (!userId || !planType) break;

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

        const priceId = subscription.items?.data?.[0]?.price?.id as string | undefined;

        const { error } = await supabase
          .from('users')
          .update({
            subscription_tier: 'player',
            subscription_status: 'active',
            subscription_plan_type: planType,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            subscription_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            has_seen_paywall: true,
            stripe_price_id: priceId || null,
          })
          .eq('id', userId);

        if (error) console.error('Error updating user after checkout:', error);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        const updateData: any = {
          subscription_status: subscription.status,
          subscription_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        };

        if (subscription.status === 'active') updateData.subscription_tier = 'player';
        if (['canceled', 'unpaid', 'past_due'].includes(subscription.status)) updateData.subscription_tier = 'boyfriend';

        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('stripe_subscription_id', subscription.id);
        if (error) console.error('Error updating subscription status:', error);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const { error } = await supabase
          .from('users')
          .update({
            subscription_tier: 'boyfriend',
            subscription_status: 'canceled',
            stripe_subscription_id: null,
            subscription_plan_type: null,
          })
          .eq('stripe_subscription_id', subscription.id);
        if (error) console.error('Error handling subscription cancellation:', error);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const { error } = await supabase
            .from('users')
            .update({ subscription_status: 'past_due' })
            .eq('stripe_subscription_id', invoice.subscription as string);
          if (error) console.error('Error updating subscription after payment failure:', error);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error?.message || 'Webhook processing failed' });
  }
}


