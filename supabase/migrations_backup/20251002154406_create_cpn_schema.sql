/*
  # CPN v2 Complete Database Schema
  
  ## Overview
  This migration creates the complete database schema for CPN (Cost Per Nut) v2 application,
  a relationship metrics tracking platform with subscription tiers and comprehensive analytics.
  
  ## Tables Created
  
  1. **users** - Extends auth.users with app-specific data
     - Subscription tier management (free, premium, lifetime)
     - Stripe integration fields
     - User preferences and metadata
  
  2. **girls** - Profile management for tracked relationships
     - Personal attributes (name, age, rating)
     - Demographics (ethnicity, hair color, location)
     - Active/inactive status for filtering
  
  3. **data_entries** - Transaction records for relationship metrics
     - Date, amount spent, duration, number of nuts
     - Linked to girl profiles via foreign key
  
  4. **user_settings** - User preferences stored as JSONB
     - Theme settings, datetime formats
     - Privacy and notification preferences
  
  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies ensure users can only access their own data
  - CASCADE deletion prevents orphaned records
  
  ## Triggers
  - Automatic updated_at timestamp updates
  - Profile limit enforcement based on subscription tier
  - Automatic user profile creation on auth signup
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'lifetime')),
  subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- GIRLS/PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS girls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 120),
  nationality TEXT,
  ethnicity TEXT CHECK (ethnicity IN ('Asian', 'Black', 'Latina', 'White', 'Middle Eastern', 'Indian', 'Mixed', 'Native American', 'Pacific Islander', 'Other')),
  hair_color TEXT CHECK (hair_color IN ('Blonde', 'Brunette', 'Black', 'Red', 'Auburn', 'Gray/Silver', 'Dyed/Colorful', 'Other')),
  location_city TEXT,
  location_country TEXT,
  rating NUMERIC(3,1) NOT NULL DEFAULT 6.0 CHECK (rating >= 5.0 AND rating <= 10.0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_girls_user_id ON girls(user_id);
CREATE INDEX IF NOT EXISTS idx_girls_is_active ON girls(is_active);
CREATE INDEX IF NOT EXISTS idx_girls_created_at ON girls(created_at DESC);

ALTER TABLE girls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own girls" ON girls;
CREATE POLICY "Users can view own girls" ON girls
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own girls" ON girls;
CREATE POLICY "Users can insert own girls" ON girls
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own girls" ON girls;
CREATE POLICY "Users can update own girls" ON girls
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own girls" ON girls;
CREATE POLICY "Users can delete own girls" ON girls
  FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- DATA ENTRIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS data_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  girl_id UUID NOT NULL REFERENCES girls(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount_spent NUMERIC(10,2) NOT NULL CHECK (amount_spent >= 0),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  number_of_nuts INTEGER NOT NULL CHECK (number_of_nuts > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_entries_girl_id ON data_entries(girl_id);
CREATE INDEX IF NOT EXISTS idx_data_entries_date ON data_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_data_entries_created_at ON data_entries(created_at DESC);

ALTER TABLE data_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own data entries" ON data_entries;
CREATE POLICY "Users can view own data entries" ON data_entries
  FOR SELECT USING (
    girl_id IN (
      SELECT id FROM girls WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own data entries" ON data_entries;
CREATE POLICY "Users can insert own data entries" ON data_entries
  FOR INSERT WITH CHECK (
    girl_id IN (
      SELECT id FROM girls WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own data entries" ON data_entries;
CREATE POLICY "Users can update own data entries" ON data_entries
  FOR UPDATE USING (
    girl_id IN (
      SELECT id FROM girls WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own data entries" ON data_entries;
CREATE POLICY "Users can delete own data entries" ON data_entries
  FOR DELETE USING (
    girl_id IN (
      SELECT id FROM girls WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme_settings JSONB DEFAULT '{"theme": "dark", "accentColor": "yellow", "compactMode": false, "animationsEnabled": true}'::jsonb,
  datetime_settings JSONB DEFAULT '{"dateFormat": "MM/DD/YYYY", "timeFormat": "12h", "weekStart": "monday"}'::jsonb,
  privacy_settings JSONB DEFAULT '{"leaderboardVisibility": "friends", "showRealName": false, "shareAchievements": true, "anonymousMode": false}'::jsonb,
  notification_settings JSONB DEFAULT '{"leaderboardUpdates": true, "achievementUnlocks": true, "weeklySummaries": true, "emailNotifications": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- DATABASE FUNCTIONS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at on all relevant tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_girls_updated_at ON girls;
CREATE TRIGGER update_girls_updated_at BEFORE UPDATE ON girls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_data_entries_updated_at ON data_entries;
CREATE TRIGGER update_data_entries_updated_at BEFORE UPDATE ON data_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to enforce subscription tier limits
CREATE OR REPLACE FUNCTION check_profile_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_subscription_tier TEXT;
  v_active_profile_count INTEGER;
BEGIN
  -- Only check for INSERT or when activating a profile
  IF (TG_OP = 'INSERT' AND NEW.is_active = true) OR 
     (TG_OP = 'UPDATE' AND NEW.is_active = true AND OLD.is_active = false) THEN
    
    -- Get user's subscription tier
    SELECT subscription_tier INTO v_subscription_tier
    FROM users
    WHERE id = NEW.user_id;

    -- Count active profiles (excluding the current one being updated)
    IF TG_OP = 'INSERT' THEN
      SELECT COUNT(*) INTO v_active_profile_count
      FROM girls
      WHERE user_id = NEW.user_id AND is_active = true;
    ELSE
      SELECT COUNT(*) INTO v_active_profile_count
      FROM girls
      WHERE user_id = NEW.user_id AND is_active = true AND id != NEW.id;
    END IF;

    -- Enforce limits
    IF v_subscription_tier = 'free' AND v_active_profile_count >= 1 THEN
      RAISE EXCEPTION 'Free tier limited to 1 active profile. Upgrade to Premium for unlimited profiles.';
    ELSIF (v_subscription_tier = 'premium' OR v_subscription_tier = 'lifetime') AND v_active_profile_count >= 50 THEN
      RAISE EXCEPTION 'Maximum 50 active profiles reached.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profile limit enforcement
DROP TRIGGER IF EXISTS enforce_profile_limit ON girls;
CREATE TRIGGER enforce_profile_limit BEFORE INSERT OR UPDATE ON girls
  FOR EACH ROW EXECUTE FUNCTION check_profile_limit();

-- Function to automatically create user profile and settings on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.users (id, email, created_at, updated_at, last_login_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- Create default settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
