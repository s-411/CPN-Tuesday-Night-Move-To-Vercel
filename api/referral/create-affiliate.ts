/**
 * Create Affiliate Vercel Serverless Function
 *
 * Creates a new affiliate in Rewardful for a newly signed up user.
 * Every user becomes an affiliate automatically to enable the referral program.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the authenticated user from Supabase
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with the user's token
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.VITE_SUPABASE_ANON_KEY || '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Parse request body
    const { email, firstName, lastName } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if we have Rewardful configuration
    const rewardfulSecretKey = process.env.REWARDFUL_SECRET_KEY;
    const rewardfulCampaignId = process.env.REWARDFUL_CAMPAIGN_ID;

    if (!rewardfulSecretKey || !rewardfulCampaignId) {
      console.warn('[Referral] Rewardful not configured - skipping affiliate creation');
      return res.status(200).json({
        warning: 'Referral program not configured',
        affiliateId: null,
        referralLink: null,
      });
    }

    console.log('[Referral] Creating affiliate for user:', email);

    // Create affiliate in Rewardful
    const response = await fetch('https://api.getrewardful.com/v1/affiliates', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${rewardfulSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        first_name: firstName || '',
        last_name: lastName || '',
        campaign_id: rewardfulCampaignId,
        state: 'active',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Referral] Failed to create affiliate:', response.status, errorText);

      // Don't fail signup if affiliate creation fails - just log and continue
      return res.status(200).json({
        warning: 'Failed to create affiliate',
        affiliateId: null,
        referralLink: null,
      });
    }

    const affiliate = await response.json();

    console.log('[Referral] Affiliate created successfully:', affiliate.id);

    // Get the referral link from the affiliate response
    // Rewardful returns an array of links for the affiliate
    const referralLink = affiliate.links && affiliate.links.length > 0
      ? affiliate.links[0].url
      : null;

    // Return affiliate data
    return res.status(200).json({
      success: true,
      affiliateId: affiliate.id,
      referralLink,
    });
  } catch (error) {
    console.error('[Referral] Error creating affiliate:', error);

    // Don't fail signup if affiliate creation fails - just log and continue
    return res.status(200).json({
      warning: 'Error creating affiliate',
      error: error instanceof Error ? error.message : 'Unknown error',
      affiliateId: null,
      referralLink: null,
    });
  }
}
