/**
 * Stripe Webhook Handler for Next.js
 * 
 * Processes Stripe webhook events to sync subscription status with Supabase.
 * This replaces the Supabase Edge Function for webhooks.
 * 
 * IMPORTANT: This endpoint must be publicly accessible (no auth required)
 * Security is handled by Stripe's webhook signature verification.
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerAdminClient } from '../../../../lib/supabase/server';
import { serverEnv } from '../../../../lib/env';

const stripe = new Stripe(serverEnv.stripe.secretKey, {
  apiVersion: '2024-10-28.acacia' as any,
});

const webhookSecret = serverEnv.stripe.webhookSecret;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Use admin client to bypass RLS
  const supabase = createServerAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const planType = session.metadata?.plan_type;

        if (!userId || !planType) {
          console.error('Missing metadata in checkout session:', { userId, planType });
          break;
        }

        // Retrieve subscription details
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        // Update user subscription in Supabase
        const { error } = await supabase
          .from('users')
          .update({
            subscription_tier: 'player',
            subscription_status: 'active',
            subscription_plan_type: planType as 'weekly' | 'annual',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            subscription_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('id', userId);

        if (error) {
          console.error('Error updating user after checkout:', error);
        } else {
          console.log('✅ Subscription activated for user:', userId);
        }

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        // If userId not in metadata, look up by customer ID
        let targetUserId = userId;
        if (!targetUserId) {
          const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('stripe_customer_id', subscription.customer as string)
            .maybeSingle();

          if (!user) {
            console.error('User not found for subscription update');
            break;
          }
          targetUserId = user.id;
        }

        // Determine subscription tier based on status
        const updateData: any = {
          subscription_status: subscription.status,
          subscription_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        };

        if (subscription.status === 'active') {
          updateData.subscription_tier = 'player';
        } else if (['canceled', 'unpaid', 'past_due'].includes(subscription.status)) {
          updateData.subscription_tier = 'boyfriend';
        }

        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Error updating subscription status:', error);
        } else {
          console.log('✅ Subscription updated:', subscription.id);
        }

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

        if (error) {
          console.error('Error handling subscription cancellation:', error);
        } else {
          console.log('✅ Subscription canceled:', subscription.id);
        }

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          const { error } = await supabase
            .from('users')
            .update({
              subscription_status: 'past_due',
            })
            .eq('stripe_subscription_id', invoice.subscription as string);

          if (error) {
            console.error('Error updating subscription after payment failure:', error);
          } else {
            console.log('⚠️ Subscription marked as past_due:', invoice.subscription);
          }
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Disable body parsing - Stripe needs the raw body
export const config = {
  api: {
    bodyParser: false,
  },
};

