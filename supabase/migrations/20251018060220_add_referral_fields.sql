-- ============================================
-- REWARDFUL REFERRAL PROGRAM - DATABASE SCHEMA
-- ============================================
-- This migration adds support for the Rewardful referral program
-- including affiliate tracking, referral credits, and audit logging

-- ============================================
-- STEP 1: Add referral columns to users table
-- ============================================

-- Rewardful affiliate ID (every user becomes an affiliate automatically)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rewardful_affiliate_id TEXT;

-- User's personal referral link from Rewardful
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rewardful_referral_link TEXT;

-- Track who referred this user (affiliate ID of the referrer)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referred_by_affiliate_id TEXT;

-- Track free weeks earned through referrals
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_credits_earned INTEGER DEFAULT 0;

-- Track remaining free weeks available to use
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_credits_remaining INTEGER DEFAULT 0;

-- Store additional referral statistics as JSON
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_stats JSONB DEFAULT '{}'::jsonb;

-- ============================================
-- STEP 2: Create referral_events table
-- ============================================
-- This table provides an audit log of all referral-related events

CREATE TABLE IF NOT EXISTS public.referral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The user who referred someone (referrer)
  referrer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- The user who was referred (referee)
  referee_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Type of event: 'signup', 'click', 'payment', 'credit_issued'
  event_type TEXT NOT NULL,

  -- Additional event data stored as JSON
  event_data JSONB DEFAULT '{}'::jsonb,

  -- Rewardful affiliate ID of the referrer
  rewardful_affiliate_id TEXT,

  -- Rewardful referral ID (unique per referral link click)
  rewardful_referral_id TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- STEP 3: Enable Row Level Security (RLS)
-- ============================================

ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Create RLS policies
-- ============================================

-- Users can view their own referral events (both as referrer and referee)
CREATE POLICY "Users can view own referral events" ON public.referral_events
  FOR SELECT USING (
    auth.uid() = referrer_user_id OR auth.uid() = referee_user_id
  );

-- Only authenticated users can view referral events
CREATE POLICY "Only authenticated users can view events" ON public.referral_events
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================
-- STEP 5: Create indexes for performance
-- ============================================

-- Index for querying referral events by referrer
CREATE INDEX IF NOT EXISTS idx_referral_events_referrer
  ON public.referral_events(referrer_user_id);

-- Index for querying referral events by referee
CREATE INDEX IF NOT EXISTS idx_referral_events_referee
  ON public.referral_events(referee_user_id);

-- Index for looking up users by Rewardful affiliate ID
CREATE INDEX IF NOT EXISTS idx_users_rewardful_affiliate_id
  ON public.users(rewardful_affiliate_id);

-- Index for looking up users by referrer's affiliate ID
CREATE INDEX IF NOT EXISTS idx_users_referred_by
  ON public.users(referred_by_affiliate_id);

-- ============================================
-- STEP 6: Add helpful comments
-- ============================================

COMMENT ON TABLE public.referral_events IS 'Audit log of all referral program events including signups, clicks, and credit issuance';
COMMENT ON COLUMN public.users.rewardful_affiliate_id IS 'Unique Rewardful affiliate ID for this user (every user is an affiliate)';
COMMENT ON COLUMN public.users.rewardful_referral_link IS 'Personal referral link for this user from Rewardful';
COMMENT ON COLUMN public.users.referred_by_affiliate_id IS 'Rewardful affiliate ID of the user who referred this user';
COMMENT ON COLUMN public.users.referral_credits_earned IS 'Total number of free weeks earned through successful referrals';
COMMENT ON COLUMN public.users.referral_credits_remaining IS 'Number of free weeks remaining to be used';
