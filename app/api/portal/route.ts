/**
 * Stripe Customer Portal API Route
 * 
 * Creates a Stripe Customer Portal session for users to manage their subscriptions.
 * This replaces the Supabase Edge Function for portal sessions.
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createRouteHandlerClient } from '../../../lib/supabase/server';
import { serverEnv, env } from '../../../lib/env';

const stripe = new Stripe(serverEnv.stripe.secretKey, {
  apiVersion: '2024-10-28.acacia' as any,
});

export async function POST(request: NextRequest) {
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

    // Get user's Stripe customer ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    const customerId = userData?.stripe_customer_id;

    if (!customerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found. Please subscribe to a plan first.' },
        { status: 404 }
      );
    }

    // Determine return URL
    const returnUrl = env.app.url;

    // Create Stripe Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Portal session error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create portal session' },
      { status: 500 }
    );
  }
}

