/*
  # CPN Application Database Schema
  
  ## Overview
  Creates the complete database structure for the CPN (Cost Per Nut) application,
  a relationship metrics tracking platform with user authentication and data analytics.
  
  ## Tables
  
  1. **users**
     - Extends auth.users with application-specific profile data
     - Tracks subscription tier (free, premium, lifetime)
     - Stores Stripe integration fields for payment processing
     - Records user metadata and timestamps
  
  2. **girls**
     - Stores profile information for tracked individuals
     - Contains demographics: name, age, ethnicity, hair color
     - Includes location data (city, country)
     - Rating system (5.0-10.0 scale)
     - Active/inactive status for filtering
     - Links to user via foreign key
  
  3. **data_entries**
     - Transaction records for each encounter
     - Tracks: date, amount spent, duration, number of nuts
     - Links to girl profiles via foreign key
     - Enables cost-per-nut calculations
  
  4. **user_settings**
     - JSONB storage for user preferences
     - Theme, datetime, privacy, notification settings
     - One-to-one relationship with users
  
  ## Security
  - Row Level Security enabled on all tables
  - Users can only access their own data
  - Policies for SELECT, INSERT, UPDATE, DELETE operations
  - Cascade deletion prevents orphaned records
  
  ## Automation
  - Auto-updating timestamps via triggers
  - Automatic user profile creation on signup
  - Subscription tier enforcement (free: 1 profile, premium/lifetime: 50 profiles)
*/

-- Enable required extensions
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
  subscription_end_date TIMESTAMPTZ,
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- GIRLS TABLE
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_girls_user_id ON girls(user_id);
CREATE INDEX IF NOT EXISTS idx_girls_is_active ON girls(is_active);
CREATE INDEX IF NOT EXISTS idx_girls_created_at ON girls(created_at DESC);

ALTER TABLE girls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own girls"
  ON girls FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own girls"
  ON girls FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own girls"
  ON girls FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own girls"
  ON girls FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_entries_girl_id ON data_entries(girl_id);
CREATE INDEX IF NOT EXISTS idx_data_entries_date ON data_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_data_entries_created_at ON data_entries(created_at DESC);

ALTER TABLE data_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data entries"
  ON data_entries FOR SELECT
  TO authenticated
  USING (
    girl_id IN (
      SELECT id FROM girls WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own data entries"
  ON data_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    girl_id IN (
      SELECT id FROM girls WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own data entries"
  ON data_entries FOR UPDATE
  TO authenticated
  USING (
    girl_id IN (
      SELECT id FROM girls WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    girl_id IN (
      SELECT id FROM girls WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own data entries"
  ON data_entries FOR DELETE
  TO authenticated
  USING (
    girl_id IN (
      SELECT id FROM girls WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- USER SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme_settings JSONB DEFAULT '{"theme": "dark", "accentColor": "yellow", "compactMode": false, "animationsEnabled": true}'::jsonb,
  datetime_settings JSONB DEFAULT '{"dateFormat": "MM/DD/YYYY", "timeFormat": "12h", "weekStart": "monday"}'::jsonb,
  privacy_settings JSONB DEFAULT '{"leaderboardVisibility": "friends", "showRealName": false, "shareAchievements": true, "anonymousMode": false}'::jsonb,
  notification_settings JSONB DEFAULT '{"leaderboardUpdates": true, "achievementUnlocks": true, "weeklySummaries": true, "emailNotifications": false}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_girls_updated_at
  BEFORE UPDATE ON girls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_entries_updated_at
  BEFORE UPDATE ON data_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enforce subscription tier profile limits
CREATE OR REPLACE FUNCTION check_profile_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_subscription_tier TEXT;
  v_active_profile_count INTEGER;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.is_active = true) OR 
     (TG_OP = 'UPDATE' AND NEW.is_active = true AND OLD.is_active = false) THEN
    
    SELECT subscription_tier INTO v_subscription_tier
    FROM users
    WHERE id = NEW.user_id;

    IF TG_OP = 'INSERT' THEN
      SELECT COUNT(*) INTO v_active_profile_count
      FROM girls
      WHERE user_id = NEW.user_id AND is_active = true;
    ELSE
      SELECT COUNT(*) INTO v_active_profile_count
      FROM girls
      WHERE user_id = NEW.user_id AND is_active = true AND id != NEW.id;
    END IF;

    IF v_subscription_tier = 'free' AND v_active_profile_count >= 1 THEN
      RAISE EXCEPTION 'Free tier limited to 1 active profile. Upgrade to Premium for unlimited profiles.';
    ELSIF (v_subscription_tier = 'premium' OR v_subscription_tier = 'lifetime') AND v_active_profile_count >= 50 THEN
      RAISE EXCEPTION 'Maximum 50 active profiles reached.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_profile_limit
  BEFORE INSERT OR UPDATE ON girls
  FOR EACH ROW
  EXECUTE FUNCTION check_profile_limit();

-- Auto-create user profile and settings on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at, last_login_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
