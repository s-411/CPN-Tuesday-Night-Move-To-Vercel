/**
 * Verify Subscription API Route
 * 
 * Verifies a Stripe checkout session and returns the subscription status.
 * Called after successful checkout to confirm activation.
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createRouteHandlerClient } from '../../../lib/supabase/server';
import { serverEnv } from '../../../lib/env';

const stripe = new Stripe(serverEnv.stripe.secretKey, {
  apiVersion: '2024-10-28.acacia' as any,
});

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user from Supabase
    const supabase = createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get session_id from query params
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session ID provided' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify the session belongs to this user
    if (session.metadata?.supabase_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Session does not belong to this user' },
        { status: 403 }
      );
    }

    // Get subscription details
    if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      // Fetch updated user data from Supabase
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('subscription_tier, subscription_status, subscription_plan_type')
        .eq('id', user.id)
        .maybeSingle();

      if (userError) {
        console.error('Error fetching user data:', userError);
      }

      // Fallback: update user immediately based on subscription status
      if (subscription.status === 'active') {
        const priceId = subscription.items?.data?.[0]?.price?.id as string | undefined;
        const { error: updateError } = await supabase
          .from('users')
          .update({
            subscription_tier: 'player',
            subscription_status: 'active',
            subscription_plan_type: (session.metadata?.plan_type as 'weekly' | 'annual') || null,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            subscription_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            has_seen_paywall: true,
            stripe_price_id: priceId || null,
          })
          .eq('id', user.id);
        if (updateError) {
          console.error('Fallback verify update failed:', updateError);
        }
      }

      return NextResponse.json({
        success: true,
        status: subscription.status,
        subscriptionTier: userData?.subscription_tier || 'boyfriend',
        subscriptionStatus: userData?.subscription_status || subscription.status,
        planType: userData?.subscription_plan_type || session.metadata?.plan_type,
        message: subscription.status === 'active' 
          ? 'Subscription activated successfully' 
          : `Subscription status: ${subscription.status}`,
      });
    }

    return NextResponse.json({
      success: false,
      status: 'incomplete',
      message: 'No active subscription found',
    });
  } catch (error) {
    console.error('Verify subscription error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify subscription' },
      { status: 500 }
    );
  }
}

