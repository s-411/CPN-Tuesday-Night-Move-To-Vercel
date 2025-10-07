/*
  # Update Default Subscription Tier

  1. Changes
    - Update default value for subscription_tier to 'boyfriend' instead of 'free'
    - Ensures new users start with Boyfriend Mode (free tier with 1 profile limit)
    
  2. Notes
    - This affects only new user registrations
    - Existing users maintain their current subscription_tier values
*/

-- Update the default value for subscription_tier column
ALTER TABLE users ALTER COLUMN subscription_tier SET DEFAULT 'boyfriend';