/*
  # Add Subscription Tracking Fields to Users Table

  1. Changes to `users` table
    - Add `has_seen_paywall` (boolean) - Tracks if user has seen the initial paywall after first sign-in
    - Add `subscription_period_start` (timestamptz) - When current subscription period started
    - Add `subscription_period_end` (timestamptz) - When current subscription period ends
    - Add `subscription_plan_type` (text) - 'weekly' or 'annual' for Player Mode subscriptions
    - Update `subscription_tier` check constraint to include 'boyfriend' and 'player' tiers
    
  2. Notes
    - These fields enable tracking of paywall presentation and subscription lifecycle
    - Default `has_seen_paywall` to false for new users
    - Existing users will need to see the paywall on next login
*/

-- Add new columns to users table
DO $$
BEGIN
  -- Add has_seen_paywall column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'has_seen_paywall'
  ) THEN
    ALTER TABLE users ADD COLUMN has_seen_paywall boolean DEFAULT false NOT NULL;
  END IF;

  -- Add subscription_period_start column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'subscription_period_start'
  ) THEN
    ALTER TABLE users ADD COLUMN subscription_period_start timestamptz;
  END IF;

  -- Add subscription_period_end column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'subscription_period_end'
  ) THEN
    ALTER TABLE users ADD COLUMN subscription_period_end timestamptz;
  END IF;

  -- Add subscription_plan_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'subscription_plan_type'
  ) THEN
    ALTER TABLE users ADD COLUMN subscription_plan_type text;
  END IF;
END $$;

-- Update subscription_tier check constraint to include new tiers
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_subscription_tier_check;
ALTER TABLE users ADD CONSTRAINT users_subscription_tier_check 
  CHECK (subscription_tier = ANY (ARRAY['boyfriend'::text, 'player'::text, 'free'::text, 'premium'::text, 'lifetime'::text]));

-- Add check constraint for subscription_plan_type
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_subscription_plan_type_check;
ALTER TABLE users ADD CONSTRAINT users_subscription_plan_type_check 
  CHECK (subscription_plan_type IS NULL OR subscription_plan_type = ANY (ARRAY['weekly'::text, 'annual'::text]));