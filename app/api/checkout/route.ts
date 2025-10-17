/**
 * Stripe Checkout Session API Route
 * 
 * Creates a Stripe Checkout session for subscription purchases.
 * This replaces the Supabase Edge Function for checkout.
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

    // Parse request body
    const body = await request.json();
    const { priceId, planType } = body;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Missing priceId - Stripe product configuration is incomplete' },
        { status: 400 }
      );
    }

    if (!planType || !['weekly', 'annual'].includes(planType)) {
      return NextResponse.json(
        { error: 'Missing or invalid planType - Must be "weekly" or "annual"' },
        { status: 400 }
      );
    }

    // Get user's email and existing Stripe customer ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    let customerId = userData?.stripe_customer_id;
    const currentEmail = user.email || userData?.email;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: currentEmail,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Update user with Stripe customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    } else {
      // Update existing Stripe customer email if it changed
      // Always use the most current email from auth (user.email)
      try {
        await stripe.customers.update(customerId, {
          email: currentEmail,
        });
        console.log('[Checkout API] Updated Stripe customer email:', { customerId, email: currentEmail });
      } catch (updateError) {
        console.error('[Checkout API] Failed to update Stripe customer email:', updateError);
        // Continue with checkout even if email update fails
      }
    }

    // Determine success and cancel URLs
    const baseUrl = env.app.url;
    const successUrl = `${baseUrl}/welcome-premium`;
    const cancelUrl = `${baseUrl}/step-4`;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        supabase_user_id: user.id,
        plan_type: planType,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan_type: planType,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

