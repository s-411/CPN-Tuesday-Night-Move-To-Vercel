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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const stripeSecretKey = requireEnv('STRIPE_SECRET_KEY');
    const supabaseUrl = requireEnv('VITE_SUPABASE_URL');
    const supabaseAnonKey = requireEnv('VITE_SUPABASE_ANON_KEY');
    const supabaseServiceRole = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

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

    const sessionId = req.query.session_id as string | undefined;
    if (!sessionId) {
      return res.status(400).json({ error: 'No session ID provided' });
    }

    const stripe = new Stripe(stripeSecretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.metadata?.supabase_user_id !== user.id) {
      return res.status(403).json({ error: 'Session does not belong to this user' });
    }

    if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

      const { data: profile, error: userError } = await supabaseAdmin
        .from('users')
        .select('subscription_tier, subscription_status, subscription_plan_type')
        .eq('id', user.id)
        .maybeSingle();

      if (userError) {
        console.error('Error fetching user data:', userError);
      }

      return res.status(200).json({
        success: true,
        status: subscription.status,
        subscriptionTier: profile?.subscription_tier || 'boyfriend',
        subscriptionStatus: profile?.subscription_status || subscription.status,
        planType: profile?.subscription_plan_type || (session.metadata?.plan_type as any),
        message: subscription.status === 'active'
          ? 'Subscription activated successfully'
          : `Subscription status: ${subscription.status}`,
      });
    }

    return res.status(200).json({ success: false, status: 'incomplete', message: 'No active subscription found' });
  } catch (error: any) {
    console.error('Verify subscription error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to verify subscription' });
  }
}


