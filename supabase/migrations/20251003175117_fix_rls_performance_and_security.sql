/*
  # Fix RLS Performance and Security Issues

  1. RLS Policy Optimization
    - Update all RLS policies to use `(select auth.uid())` instead of `auth.uid()`
    - This prevents re-evaluation for each row, improving query performance at scale
    - Affects policies on: users, girls, data_entries, user_settings tables

  2. Function Security
    - Fix search_path for all functions to prevent security vulnerabilities
    - Add `SECURITY DEFINER` and stable search_path to:
      - update_updated_at_column
      - check_profile_limit
      - handle_new_user

  3. Index Cleanup
    - Remove unused indexes that are not being utilized
    - Keeps only essential indexes for query performance

  4. Notes
    - All policies maintain the same access control logic
    - Functions are made more secure against search_path attacks
    - Database performance improved through optimized RLS
*/

-- =====================================================
-- 1. DROP AND RECREATE RLS POLICIES WITH OPTIMIZATION
-- =====================================================

-- USERS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert own profile"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- GIRLS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own girls" ON public.girls;
DROP POLICY IF EXISTS "Users can insert own girls" ON public.girls;
DROP POLICY IF EXISTS "Users can update own girls" ON public.girls;
DROP POLICY IF EXISTS "Users can delete own girls" ON public.girls;

CREATE POLICY "Users can view own girls"
  ON public.girls
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own girls"
  ON public.girls
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own girls"
  ON public.girls
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own girls"
  ON public.girls
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- DATA_ENTRIES TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own data entries" ON public.data_entries;
DROP POLICY IF EXISTS "Users can insert own data entries" ON public.data_entries;
DROP POLICY IF EXISTS "Users can update own data entries" ON public.data_entries;
DROP POLICY IF EXISTS "Users can delete own data entries" ON public.data_entries;

CREATE POLICY "Users can view own data entries"
  ON public.data_entries
  FOR SELECT
  TO authenticated
  USING (
    girl_id IN (
      SELECT id FROM public.girls WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert own data entries"
  ON public.data_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    girl_id IN (
      SELECT id FROM public.girls WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update own data entries"
  ON public.data_entries
  FOR UPDATE
  TO authenticated
  USING (
    girl_id IN (
      SELECT id FROM public.girls WHERE user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    girl_id IN (
      SELECT id FROM public.girls WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete own data entries"
  ON public.data_entries
  FOR DELETE
  TO authenticated
  USING (
    girl_id IN (
      SELECT id FROM public.girls WHERE user_id = (select auth.uid())
    )
  );

-- USER_SETTINGS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;

CREATE POLICY "Users can view own settings"
  ON public.user_settings
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own settings"
  ON public.user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own settings"
  ON public.user_settings
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- =====================================================
-- 2. FIX FUNCTION SEARCH PATHS FOR SECURITY
-- =====================================================

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix check_profile_limit function
CREATE OR REPLACE FUNCTION public.check_profile_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  profile_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Count existing active profiles for this user
  SELECT COUNT(*) INTO profile_count
  FROM public.girls
  WHERE user_id = NEW.user_id AND is_active = true;

  -- Set default max profiles (can be customized per tier)
  max_allowed := 50;

  -- Check if limit would be exceeded
  IF profile_count >= max_allowed THEN
    RAISE EXCEPTION 'Profile limit reached. Maximum allowed: %', max_allowed;
  END IF;

  RETURN NEW;
END;
$$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (NEW.id, NEW.email, NEW.created_at);

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;

-- =====================================================
-- 3. REMOVE UNUSED INDEXES
-- =====================================================

DROP INDEX IF EXISTS public.idx_users_email;
DROP INDEX IF EXISTS public.idx_users_stripe_customer_id;
DROP INDEX IF EXISTS public.idx_girls_is_active;
DROP INDEX IF EXISTS public.idx_girls_created_at;
DROP INDEX IF EXISTS public.idx_data_entries_created_at;
DROP INDEX IF EXISTS public.idx_user_settings_user_id;
