/*
  # Add Stripe Price ID Column to Users Table

  1. Changes to `users` table
    - Add `stripe_price_id` (text) - Stores the actual Stripe Price ID for the user's subscription
    - This allows accurate identification of which plan (weekly vs annual) the user is subscribed to
    
  2. Purpose
    - Enables precise plan identification when users change subscriptions in the billing portal
    - Allows the app to display correct plan information and pricing
    - Works in conjunction with subscription_plan_type for quick queries
    
  3. Notes
    - Column is nullable since free users don't have a Stripe price
    - Will be populated by webhook when subscriptions are created or updated
    - For existing active subscriptions, may need manual backfill
*/

-- Add stripe_price_id column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'stripe_price_id'
  ) THEN
    ALTER TABLE users ADD COLUMN stripe_price_id text;
  END IF;
END $$;

-- Add index for faster lookups by price ID
CREATE INDEX IF NOT EXISTS idx_users_stripe_price_id ON users(stripe_price_id);
