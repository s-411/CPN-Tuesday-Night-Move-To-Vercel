import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/supabase/types/database';

function getEnv(name: string): string | undefined {
  return process.env[name];
}

function requireEnv(name: string): string {
  const value = getEnv(name);
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function ensureAbsoluteUrl(input: string): string {
  if (!input) return input;
  const hasScheme = /^https?:\/\//i.test(input);
  if (hasScheme) return input;
  // Handle protocol-relative or bare domains/paths
  if (input.startsWith('//')) return `https:${input}`;
  return `https://${input}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const stripeSecretKey = requireEnv('STRIPE_SECRET_KEY');
    const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL') || getEnv('VITE_SUPABASE_URL');
    const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || getEnv('VITE_SUPABASE_ANON_KEY');
    const supabaseServiceRole = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    const appUrl = getEnv('VITE_APP_URL') || getEnv('NEXT_PUBLIC_APP_URL');

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ error: 'Supabase URL or anon key not configured' });
    }

    const authHeader = req.headers['authorization'] || req.headers['Authorization' as any];
    const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : undefined;

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const supabaseUser = createClient<Database>(supabaseUrl, supabaseAnonKey);
    const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: authError } = await supabaseUser.auth.getUser(token);
    if (authError || !userData?.user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const user = userData.user;

    const { priceId, planType, successUrl, cancelUrl } = (req.body ?? {}) as {
      priceId?: string;
      planType?: 'weekly' | 'annual';
      successUrl?: string;
      cancelUrl?: string;
    };

    if (!priceId) {
      return res.status(400).json({ error: 'Missing priceId - Stripe product configuration is incomplete' });
    }
    if (!planType || !['weekly', 'annual'].includes(planType)) {
      return res.status(400).json({ error: 'Missing or invalid planType - Must be "weekly" or "annual"' });
    }

    // Get user email and existing customer id
    const { data: profile, error: userTableError } = await supabaseAdmin
      .from('users')
      .select('email, stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle();

    if (userTableError) {
      return res.status(500).json({ error: 'Failed to fetch user data' });
    }

    const stripe = new Stripe(stripeSecretKey);

    let customerId = profile?.stripe_customer_id || undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email!,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      await supabaseAdmin
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    const inferredHost = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
    const resolvedAppUrl = appUrl ? ensureAbsoluteUrl(appUrl) : inferredHost;
    const baseUrl = successUrl ? ensureAbsoluteUrl(successUrl) : resolvedAppUrl;
    const cancelBase = cancelUrl ? ensureAbsoluteUrl(cancelUrl) : resolvedAppUrl;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl ? ensureAbsoluteUrl(successUrl) : `${baseUrl}/welcome-premium`,
      cancel_url: cancelUrl ? ensureAbsoluteUrl(cancelUrl) : `${cancelBase}/step-4`,
      metadata: { supabase_user_id: user.id, plan_type: planType },
      subscription_data: { metadata: { supabase_user_id: user.id, plan_type: planType } },
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to create checkout session' });
  }
}


