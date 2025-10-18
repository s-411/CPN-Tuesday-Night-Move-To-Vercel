/**
 * Create Affiliate API Route
 *
 * Creates a new affiliate in Rewardful for a newly signed up user.
 * Every user becomes an affiliate automatically to enable the referral program.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '../../../../lib/supabase/server';
import { serverEnv } from '../../../../lib/env';

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
    const { email, firstName, lastName } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if we have Rewardful configuration
    const rewardfulSecretKey = process.env.REWARDFUL_SECRET_KEY;
    const rewardfulCampaignId = process.env.REWARDFUL_CAMPAIGN_ID;

    if (!rewardfulSecretKey || !rewardfulCampaignId) {
      console.warn('[Referral] Rewardful not configured - skipping affiliate creation');
      return NextResponse.json({
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
      return NextResponse.json({
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
    return NextResponse.json({
      success: true,
      affiliateId: affiliate.id,
      referralLink,
    });
  } catch (error) {
    console.error('[Referral] Error creating affiliate:', error);

    // Don't fail signup if affiliate creation fails - just log and continue
    return NextResponse.json({
      warning: 'Error creating affiliate',
      error: error instanceof Error ? error.message : 'Unknown error',
      affiliateId: null,
      referralLink: null,
    });
  }
}
