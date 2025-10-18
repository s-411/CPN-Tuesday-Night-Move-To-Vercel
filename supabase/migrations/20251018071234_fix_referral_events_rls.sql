-- ============================================
-- FIX REFERRAL EVENTS RLS POLICIES
-- ============================================
-- Add INSERT policy to allow users to create referral events

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can view own referral events" ON public.referral_events;
DROP POLICY IF EXISTS "Only authenticated users can view events" ON public.referral_events;

-- ============================================
-- CREATE NEW RLS POLICIES
-- ============================================

-- Policy 1: Allow authenticated users to INSERT referral events
-- This allows signup flow to log events when a referred user signs up
CREATE POLICY "Authenticated users can insert referral events"
  ON public.referral_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must be authenticated
    auth.uid() IS NOT NULL
  );

-- Policy 2: Users can view their own referral events (as referrer or referee)
CREATE POLICY "Users can view own referral events"
  ON public.referral_events
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = referrer_user_id OR auth.uid() = referee_user_id
  );

-- Policy 3: Allow service role to manage all events (for admin/webhooks)
CREATE POLICY "Service role can manage all events"
  ON public.referral_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- ADD HELPFUL COMMENT
-- ============================================
COMMENT ON POLICY "Authenticated users can insert referral events" ON public.referral_events
  IS 'Allows signup flow to log referral events when a referred user signs up';
