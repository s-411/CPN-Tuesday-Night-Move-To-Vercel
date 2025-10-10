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
    const supabaseUrl = requireEnv('VITE_SUPABASE_URL');
    const supabaseAnonKey = requireEnv('VITE_SUPABASE_ANON_KEY');
    const supabaseServiceRole = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    const appUrl = getEnv('VITE_APP_URL');

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

    const { data: profile, error: userError } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle();

    if (userError) {
      return res.status(500).json({ error: 'Failed to fetch user data' });
    }

    const customerId = profile?.stripe_customer_id;
    if (!customerId) {
      return res.status(404).json({ error: 'No Stripe customer found. Please subscribe to a plan first.' });
    }

    const stripe = new Stripe(stripeSecretKey);
    const inferredHost = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
    const returnUrl = ensureAbsoluteUrl(appUrl || inferredHost);

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Portal error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to create portal session' });
  }
}


