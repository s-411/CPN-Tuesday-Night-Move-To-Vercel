# Anonymous Session Onboarding Implementation Plan

**Total Time Budget**: 8 hours  
**Approach**: Database-first with anonymous sessions  
**Risk Level**: Zero impact to production (fully isolated)  
**Status**: Ready for implementation

---

## Table of Contents
1. [Phase 1: Environment Isolation & Setup](#phase-1-environment-isolation--setup) - 1.5 hours
2. [Phase 2: Database Schema & Migration](#phase-2-database-schema--migration) - 1.5 hours
3. [Phase 3: Authentication Layer](#phase-3-authentication-layer) - 1.5 hours
4. [Phase 4: Core Implementation](#phase-4-core-implementation) - 2.0 hours
5. [Phase 5: Testing & Validation](#phase-5-testing--validation) - 1.0 hour
6. [Phase 6: Integration & Go-Live](#phase-6-integration--go-live) - 0.5 hours

---

## Prerequisites

### Before Starting
- [ ] Supabase project access confirmed
- [ ] Local development environment running
- [ ] Database backup completed
- [ ] Feature flag system available (or use environment variable)
- [ ] Git branch created: `feature/anonymous-onboarding`

### Required Tools
- Bolt Database access
- Database migration tool access
- Browser DevTools for testing

### Safety Checks
- [ ] Confirm no active users during deployment window
- [ ] Verify rollback procedure documented
- [ ] Backup database before any migration
- [ ] Test migration on local/staging first

---

## Phase 1: Environment Isolation & Setup
**Duration**: 1.5 hours  
**Goal**: Create isolated development environment with feature flags

### 1.1 Feature Flag Setup (15 minutes)
**Task**: Implement feature flag to toggle anonymous onboarding on/off

```typescript
// File: src/lib/config/features.ts (CREATE NEW)

export const FEATURE_FLAGS = {
  ANONYMOUS_ONBOARDING: import.meta.env.VITE_ENABLE_ANONYMOUS_ONBOARDING === 'true',
} as const;

export function isAnonymousOnboardingEnabled(): boolean {
  return FEATURE_FLAGS.ANONYMOUS_ONBOARDING;
}
```

**Actions**:
- [ ] Create `src/lib/config/features.ts`
- [ ] Add to `.env.example`: `VITE_ENABLE_ANONYMOUS_ONBOARDING=false`
- [ ] Add to `.env` (local): `VITE_ENABLE_ANONYMOUS_ONBOARDING=true`
- [ ] Test flag toggle in console

**Validation**:
```bash
# In browser console:
import { isAnonymousOnboardingEnabled } from './lib/config/features'
console.log(isAnonymousOnboardingEnabled()) // Should return true locally
```

**Rollback**: Simply set env var to `false` - no code changes needed

---

### 1.2 Create Isolated Onboarding Module (20 minutes)
**Task**: Set up separate module structure for onboarding flow

```bash
src/
├── features/
│   └── onboarding/
│       ├── hooks/
│       │   └── useAnonymousSession.ts
│       ├── services/
│       │   ├── anonymousAuth.service.ts
│       │   └── onboardingData.service.ts
│       ├── types/
│       │   └── onboarding.types.ts
│       └── utils/
│           └── session.utils.ts
```

**Actions**:
- [ ] Create directory structure: `mkdir -p src/features/onboarding/{hooks,services,types,utils}`
- [ ] Create empty placeholder files (prevents import errors)
- [ ] Add to `.gitignore` if needed: `# Onboarding feature WIP`
- [ ] Document module structure in README

**Validation**: Run `npm run typecheck` - should pass with no errors

**Rollback**: Delete `src/features/onboarding` directory

---

### 1.3 Database Connection Verification (15 minutes)
**Task**: Verify Supabase connection and anonymous auth capability

**Actions**:
- [ ] Test Supabase client connection
- [ ] Verify anonymous auth is enabled in Supabase dashboard
- [ ] Check RLS policies are active
- [ ] Confirm service role key is NOT exposed to client

**Validation Script**:
```typescript
// Run in browser console (temporary test)
const { data, error } = await supabase.auth.signInAnonymously();
console.log('Anonymous user:', data);
// Clean up: await supabase.auth.signOut();
```

**Expected Result**: Should return anonymous user with `is_anonymous: true`

**Troubleshooting**:
- If fails: Check Supabase > Authentication > Providers > Anonymous is enabled
- If RLS errors: Proceed to Phase 2 (RLS policies will be added)

**Rollback**: No changes made - read-only verification

---

### 1.4 Git Workflow & Branch Protection (20 minutes)
**Task**: Set up safe development workflow

**Actions**:
- [ ] Create feature branch: `git checkout -b feature/anonymous-onboarding`
- [ ] Create `.github/workflows/onboarding-tests.yml` (if using CI)
- [ ] Add commit hooks to prevent direct pushes to main
- [ ] Document PR review requirements

**Validation**: 
- [ ] Confirm on feature branch: `git branch --show-current`
- [ ] Test commit: `git commit --allow-empty -m "test: verify branch protection"`

**Rollback**: `git checkout main && git branch -D feature/anonymous-onboarding`

---

### 1.5 Environment Variables Audit (20 minutes)
**Task**: Ensure all required environment variables are set

**Actions**:
- [ ] Review `.env.example` for completeness
- [ ] Add onboarding-specific vars:
  ```bash
  # Onboarding Feature Flags
  VITE_ENABLE_ANONYMOUS_ONBOARDING=false
  VITE_ONBOARDING_SESSION_DURATION=86400000
  ```
- [ ] Verify Supabase keys are present: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- [ ] Document each variable in `.env.example`

**Validation**: Run `npm run dev` - should start without errors

**Rollback**: No changes to production env vars

---

## Phase 2: Database Schema & Migration
**Duration**: 1.5 hours  
**Goal**: Create isolated onboarding tables and RLS policies

### 2.1 Design Onboarding Tables Schema (30 minutes)
**Task**: Design temporary onboarding tables (separate from production tables)

**Schema Design**:
```sql
-- File: supabase/migrations/[timestamp]_create_onboarding_tables.sql

-- Onboarding sessions tracking
CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  current_step INTEGER DEFAULT 1 CHECK (current_step BETWEEN 1 AND 4),
  is_completed BOOLEAN DEFAULT false,
  is_anonymous BOOLEAN DEFAULT true,
  converted_at TIMESTAMPTZ, -- When anonymous became permanent
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Temporary girl data during onboarding
CREATE TABLE IF NOT EXISTS onboarding_girls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES onboarding_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Girl data (same fields as production girls table)
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 120),
  ethnicity TEXT,
  hair_color TEXT,
  location_city TEXT,
  location_country TEXT,
  rating NUMERIC(3,1) NOT NULL DEFAULT 6.0 CHECK (rating >= 5.0 AND rating <= 10.0),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Temporary data entries during onboarding
CREATE TABLE IF NOT EXISTS onboarding_data_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES onboarding_sessions(id) ON DELETE CASCADE,
  girl_id UUID NOT NULL REFERENCES onboarding_girls(id) ON DELETE CASCADE,
  
  -- Data entry fields (same as production data_entries table)
  date DATE NOT NULL,
  amount_spent NUMERIC(10,2) NOT NULL CHECK (amount_spent >= 0),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  number_of_nuts INTEGER NOT NULL CHECK (number_of_nuts >= 0),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_onboarding_sessions_user_id ON onboarding_sessions(user_id);
CREATE INDEX idx_onboarding_sessions_expires_at ON onboarding_sessions(expires_at);
CREATE INDEX idx_onboarding_sessions_is_completed ON onboarding_sessions(is_completed);
CREATE INDEX idx_onboarding_girls_session_id ON onboarding_girls(session_id);
CREATE INDEX idx_onboarding_girls_user_id ON onboarding_girls(user_id);
CREATE INDEX idx_onboarding_data_entries_session_id ON onboarding_data_entries(session_id);

-- Comments for documentation
COMMENT ON TABLE onboarding_sessions IS 'Tracks anonymous onboarding sessions - cleaned up after 24h or completion';
COMMENT ON TABLE onboarding_girls IS 'Temporary girl data during onboarding - migrated to production girls table on completion';
COMMENT ON TABLE onboarding_data_entries IS 'Temporary data entries during onboarding - migrated to production data_entries table on completion';
```

**Actions**:
- [ ] Create migration file with timestamp
- [ ] Review schema with team (if applicable)
- [ ] Ensure foreign key cascades are correct
- [ ] Add appropriate indexes

**Validation**: Schema passes syntax check in SQL editor

**Rollback**: Keep rollback migration ready (see 2.4)

---

### 2.2 Create RLS Policies for Onboarding Tables (30 minutes)
**Task**: Secure onboarding tables with Row Level Security

```sql
-- File: Same migration file, continued

-- Enable RLS on all onboarding tables
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_girls ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_data_entries ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ONBOARDING_SESSIONS POLICIES
-- ============================================

-- Users (including anonymous) can view their own sessions
CREATE POLICY "Users can view own onboarding sessions"
  ON onboarding_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users (including anonymous) can create their own sessions
CREATE POLICY "Users can create own onboarding sessions"
  ON onboarding_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users (including anonymous) can update their own sessions
CREATE POLICY "Users can update own onboarding sessions"
  ON onboarding_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users cannot delete sessions (handled by cleanup job)
-- No DELETE policy = no one can delete except service role

-- ============================================
-- ONBOARDING_GIRLS POLICIES
-- ============================================

-- Users can view their own onboarding girls
CREATE POLICY "Users can view own onboarding girls"
  ON onboarding_girls FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own onboarding girls
CREATE POLICY "Users can insert own onboarding girls"
  ON onboarding_girls FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    session_id IN (
      SELECT id FROM onboarding_sessions 
      WHERE user_id = auth.uid() AND is_completed = false
    )
  );

-- Users can update their own onboarding girls (within active session)
CREATE POLICY "Users can update own onboarding girls"
  ON onboarding_girls FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- ONBOARDING_DATA_ENTRIES POLICIES
-- ============================================

-- Users can view their own onboarding data entries
CREATE POLICY "Users can view own onboarding data entries"
  ON onboarding_data_entries FOR SELECT
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM onboarding_sessions WHERE user_id = auth.uid()
    )
  );

-- Users can insert their own onboarding data entries
CREATE POLICY "Users can insert own onboarding data entries"
  ON onboarding_data_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    session_id IN (
      SELECT id FROM onboarding_sessions 
      WHERE user_id = auth.uid() AND is_completed = false
    )
  );

-- Users can update their own onboarding data entries
CREATE POLICY "Users can update own onboarding data entries"
  ON onboarding_data_entries FOR UPDATE
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM onboarding_sessions WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT id FROM onboarding_sessions WHERE user_id = auth.uid()
    )
  );
```

**Actions**:
- [ ] Add RLS policies to migration file
- [ ] Test policies with anonymous user simulation
- [ ] Verify authenticated users cannot access others' data
- [ ] Test service role can access all data (for cleanup)

**Validation**: Run policy test queries (see 2.3)

**Rollback**: Included in rollback migration (2.4)

---

### 2.3 Create Database Triggers & Functions (20 minutes)
**Task**: Automate timestamp updates and session management

```sql
-- File: Same migration file, continued

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_onboarding_sessions_updated_at
  BEFORE UPDATE ON onboarding_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_updated_at();

CREATE TRIGGER update_onboarding_girls_updated_at
  BEFORE UPDATE ON onboarding_girls
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_updated_at();

CREATE TRIGGER update_onboarding_data_entries_updated_at
  BEFORE UPDATE ON onboarding_data_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_updated_at();

-- Function to clean up expired sessions (run via cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_onboarding_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM onboarding_sessions
  WHERE expires_at < NOW() AND is_completed = false;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to migrate onboarding data to production tables
CREATE OR REPLACE FUNCTION complete_onboarding_migration(p_session_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_girl_id UUID;
  v_new_girl_id UUID;
  v_migrated_girls INTEGER := 0;
  v_migrated_entries INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Get user_id from session
  SELECT user_id INTO v_user_id
  FROM onboarding_sessions
  WHERE id = p_session_id AND is_completed = false;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Session not found or already completed'
    );
  END IF;

  -- Migrate girls
  FOR v_girl_id IN 
    SELECT id FROM onboarding_girls WHERE session_id = p_session_id
  LOOP
    INSERT INTO girls (user_id, name, age, ethnicity, hair_color, location_city, location_country, rating, is_active)
    SELECT user_id, name, age, ethnicity, hair_color, location_city, location_country, rating, true
    FROM onboarding_girls
    WHERE id = v_girl_id
    RETURNING id INTO v_new_girl_id;

    -- Migrate data entries for this girl
    INSERT INTO data_entries (girl_id, date, amount_spent, duration_minutes, number_of_nuts)
    SELECT v_new_girl_id, date, amount_spent, duration_minutes, number_of_nuts
    FROM onboarding_data_entries
    WHERE girl_id = v_girl_id;

    GET DIAGNOSTICS v_migrated_entries = ROW_COUNT;
    v_migrated_girls := v_migrated_girls + 1;
  END LOOP;

  -- Mark session as completed
  UPDATE onboarding_sessions
  SET is_completed = true, converted_at = NOW()
  WHERE id = p_session_id;

  -- Update user's onboarding_completed_at
  UPDATE users
  SET onboarding_completed_at = NOW()
  WHERE id = v_user_id;

  v_result := jsonb_build_object(
    'success', true,
    'migrated_girls', v_migrated_girls,
    'migrated_entries', v_migrated_entries,
    'user_id', v_user_id
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION cleanup_expired_onboarding_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION complete_onboarding_migration(UUID) TO authenticated;
```

**Actions**:
- [ ] Add triggers to migration file
- [ ] Add migration function
- [ ] Add cleanup function
- [ ] Test functions with sample data

**Validation**:
```sql
-- Test cleanup function
SELECT cleanup_expired_onboarding_sessions();

-- Test migration function (with test session)
SELECT complete_onboarding_migration('test-session-uuid');
```

**Rollback**: Drop functions in rollback migration

---

### 2.4 Create Rollback Migration (10 minutes)
**Task**: Prepare rollback script in case of issues

```sql
-- File: supabase/migrations/[timestamp]_rollback_onboarding_tables.sql

-- Drop functions
DROP FUNCTION IF EXISTS complete_onboarding_migration(UUID);
DROP FUNCTION IF EXISTS cleanup_expired_onboarding_sessions();
DROP FUNCTION IF EXISTS update_onboarding_updated_at();

-- Drop tables (CASCADE removes dependent objects)
DROP TABLE IF EXISTS onboarding_data_entries CASCADE;
DROP TABLE IF EXISTS onboarding_girls CASCADE;
DROP TABLE IF EXISTS onboarding_sessions CASCADE;

-- Verify cleanup
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'onboarding_sessions') THEN
    RAISE EXCEPTION 'Rollback failed: onboarding_sessions still exists';
  END IF;
END $$;
```

**Actions**:
- [ ] Create rollback migration file
- [ ] Test rollback on local database copy
- [ ] Document rollback procedure
- [ ] Keep file ready but don't apply

**Validation**: Test on local DB clone, then reset

**Rollback**: This IS the rollback

---

### 2.5 Apply Migration to Local Database (10 minutes)
**Task**: Apply migration to local Supabase instance

**Actions**:
- [ ] Run migration: `supabase db push`
- [ ] Verify tables created: Check Supabase dashboard
- [ ] Verify RLS enabled: Run test queries
- [ ] Check indexes created: `\d+ onboarding_sessions` in psql

**Validation Queries**:
```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'onboarding_%';

-- Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename LIKE 'onboarding_%';

-- Verify indexes
SELECT indexname, tablename FROM pg_indexes 
WHERE tablename LIKE 'onboarding_%';
```

**Expected Results**:
- 3 tables created: onboarding_sessions, onboarding_girls, onboarding_data_entries
- All tables have rowsecurity = true
- At least 6 indexes created

**Rollback**: Apply rollback migration if any issues

---

## Phase 3: Authentication Layer
**Duration**: 1.5 hours  
**Goal**: Implement anonymous authentication and session management

### 3.1 Create Anonymous Auth Service (30 minutes)
**Task**: Build service to manage anonymous sessions

```typescript
// File: src/features/onboarding/services/anonymousAuth.service.ts

import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { OnboardingSession } from '../types/onboarding.types';

export class AnonymousAuthService {
  /**
   * Create an anonymous user session and corresponding onboarding session
   */
  static async createAnonymousSession(): Promise<{
    user: User | null;
    session: OnboardingSession | null;
    error: Error | null;
  }> {
    try {
      // Step 1: Create anonymous auth user
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
      
      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned from anonymous sign in');

      // Step 2: Create onboarding session record
      const sessionToken = crypto.randomUUID();
      const { data: sessionData, error: sessionError } = await supabase
        .from('onboarding_sessions')
        .insert({
          user_id: authData.user.id,
          session_token: sessionToken,
          current_step: 1,
          is_anonymous: true,
          metadata: {
            created_via: 'anonymous_flow',
            user_agent: navigator.userAgent,
          },
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      return {
        user: authData.user,
        session: sessionData,
        error: null,
      };
    } catch (error) {
      console.error('Failed to create anonymous session:', error);
      return {
        user: null,
        session: null,
        error: error as Error,
      };
    }
  }

  /**
   * Get current onboarding session for authenticated user
   */
  static async getCurrentSession(userId: string): Promise<OnboardingSession | null> {
    try {
      const { data, error } = await supabase
        .from('onboarding_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_completed', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get current session:', error);
      return null;
    }
  }

  /**
   * Update current step in onboarding session
   */
  static async updateStep(sessionId: string, step: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('onboarding_sessions')
        .update({ current_step: step })
        .eq('id', sessionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to update step:', error);
      return false;
    }
  }

  /**
   * Convert anonymous user to permanent account
   * This happens when user verifies their email
   */
  static async convertAnonymousToPermanent(
    email: string
  ): Promise<{ error: Error | null }> {
    try {
      // Supabase will link the email to the existing anonymous user
      const { error } = await supabase.auth.updateUser({ email });
      
      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Failed to convert anonymous user:', error);
      return { error: error as Error };
    }
  }

  /**
   * Check if current user is anonymous
   */
  static async isAnonymousUser(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.is_anonymous ?? false;
    } catch {
      return false;
    }
  }
}
```

**Actions**:
- [ ] Create file: `src/features/onboarding/services/anonymousAuth.service.ts`
- [ ] Implement all methods
- [ ] Add error handling
- [ ] Add TypeScript types (see 3.2)

**Validation**: Test in browser console with temp user

**Rollback**: Delete file

---

### 3.2 Define TypeScript Types (15 minutes)
**Task**: Create type definitions for onboarding data structures

```typescript
// File: src/features/onboarding/types/onboarding.types.ts

export interface OnboardingSession {
  id: string;
  user_id: string;
  session_token: string;
  current_step: number;
  is_completed: boolean;
  is_anonymous: boolean;
  converted_at: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

export interface OnboardingGirl {
  id: string;
  session_id: string;
  user_id: string;
  name: string;
  age: number;
  ethnicity?: string;
  hair_color?: string;
  location_city?: string;
  location_country?: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface OnboardingDataEntry {
  id: string;
  session_id: string;
  girl_id: string;
  date: string;
  amount_spent: number;
  duration_minutes: number;
  number_of_nuts: number;
  created_at: string;
  updated_at: string;
}

export interface OnboardingFormData {
  girl: {
    name: string;
    age: number;
    ethnicity?: string;
    hair_color?: string;
    location_city?: string;
    location_country?: string;
    rating: number;
  };
  dataEntry: {
    date: string;
    amount_spent: number;
    duration_minutes: number;
    number_of_nuts: number;
  };
}

export interface OnboardingStepStatus {
  currentStep: number;
  completedSteps: number[];
  sessionId: string | null;
  girlId: string | null;
}
```

**Actions**:
- [ ] Create types file
- [ ] Ensure types match database schema
- [ ] Export all types
- [ ] Add JSDoc comments

**Validation**: Run `npm run typecheck`

**Rollback**: Delete file

---

### 3.3 Create Onboarding Data Service (30 minutes)
**Task**: Build service to manage girl and data entry operations

```typescript
// File: src/features/onboarding/services/onboardingData.service.ts

import { supabase } from '@/lib/supabase/client';
import type { OnboardingGirl, OnboardingDataEntry, OnboardingFormData } from '../types/onboarding.types';

export class OnboardingDataService {
  /**
   * Save girl data during onboarding
   */
  static async saveGirl(
    sessionId: string,
    girlData: OnboardingFormData['girl']
  ): Promise<{ girl: OnboardingGirl | null; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('onboarding_girls')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          ...girlData,
        })
        .select()
        .single();

      if (error) throw error;

      return { girl: data, error: null };
    } catch (error) {
      console.error('Failed to save girl:', error);
      return { girl: null, error: error as Error };
    }
  }

  /**
   * Update girl data during onboarding
   */
  static async updateGirl(
    girlId: string,
    girlData: Partial<OnboardingFormData['girl']>
  ): Promise<{ girl: OnboardingGirl | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('onboarding_girls')
        .update(girlData)
        .eq('id', girlId)
        .select()
        .single();

      if (error) throw error;

      return { girl: data, error: null };
    } catch (error) {
      console.error('Failed to update girl:', error);
      return { girl: null, error: error as Error };
    }
  }

  /**
   * Get girl data for session
   */
  static async getGirl(sessionId: string): Promise<OnboardingGirl | null> {
    try {
      const { data, error } = await supabase
        .from('onboarding_girls')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get girl:', error);
      return null;
    }
  }

  /**
   * Save data entry during onboarding
   */
  static async saveDataEntry(
    sessionId: string,
    girlId: string,
    entryData: OnboardingFormData['dataEntry']
  ): Promise<{ entry: OnboardingDataEntry | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('onboarding_data_entries')
        .insert({
          session_id: sessionId,
          girl_id: girlId,
          ...entryData,
        })
        .select()
        .single();

      if (error) throw error;

      return { entry: data, error: null };
    } catch (error) {
      console.error('Failed to save data entry:', error);
      return { entry: null, error: error as Error };
    }
  }

  /**
   * Get data entry for session
   */
  static async getDataEntry(sessionId: string): Promise<OnboardingDataEntry | null> {
    try {
      const { data, error } = await supabase
        .from('onboarding_data_entries')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get data entry:', error);
      return null;
    }
  }

  /**
   * Complete onboarding - migrate data to production tables
   */
  static async completeOnboarding(
    sessionId: string
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { data, error } = await supabase.rpc('complete_onboarding_migration', {
        p_session_id: sessionId,
      });

      if (error) throw error;
      
      if (!data?.success) {
        throw new Error(data?.error || 'Migration failed');
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      return { success: false, error: error as Error };
    }
  }
}
```

**Actions**:
- [ ] Create data service file
- [ ] Implement all CRUD operations
- [ ] Add error handling and logging
- [ ] Test with anonymous user

**Validation**: Test each method in browser console

**Rollback**: Delete file

---

### 3.4 Create React Hook for Session Management (15 minutes)
**Task**: Build custom hook to manage onboarding session state

```typescript
// File: src/features/onboarding/hooks/useAnonymousSession.ts

import { useState, useEffect, useCallback } from 'react';
import { AnonymousAuthService } from '../services/anonymousAuth.service';
import { OnboardingDataService } from '../services/onboardingData.service';
import type { OnboardingSession, OnboardingStepStatus } from '../types/onboarding.types';

export function useAnonymousSession() {
  const [session, setSession] = useState<OnboardingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stepStatus, setStepStatus] = useState<OnboardingStepStatus>({
    currentStep: 1,
    completedSteps: [],
    sessionId: null,
    girlId: null,
  });

  /**
   * Initialize or restore session
   */
  const initializeSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if user already has active session
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const existingSession = await AnonymousAuthService.getCurrentSession(user.id);
        
        if (existingSession) {
          setSession(existingSession);
          setStepStatus(prev => ({
            ...prev,
            currentStep: existingSession.current_step,
            sessionId: existingSession.id,
          }));
          setLoading(false);
          return;
        }
      }

      // Create new anonymous session
      const { user: newUser, session: newSession, error: createError } = 
        await AnonymousAuthService.createAnonymousSession();

      if (createError) throw createError;
      if (!newSession) throw new Error('Failed to create session');

      setSession(newSession);
      setStepStatus(prev => ({
        ...prev,
        sessionId: newSession.id,
      }));
    } catch (err) {
      setError(err as Error);
      console.error('Failed to initialize session:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update current step
   */
  const updateStep = useCallback(async (step: number) => {
    if (!session) return false;

    const success = await AnonymousAuthService.updateStep(session.id, step);
    if (success) {
      setSession(prev => prev ? { ...prev, current_step: step } : null);
      setStepStatus(prev => ({
        ...prev,
        currentStep: step,
        completedSteps: [...prev.completedSteps, step - 1].filter((s, i, arr) => arr.indexOf(s) === i),
      }));
    }
    return success;
  }, [session]);

  /**
   * Complete onboarding and migrate data
   */
  const completeOnboarding = useCallback(async () => {
    if (!session) return { success: false, error: new Error('No active session') };

    return await OnboardingDataService.completeOnboarding(session.id);
  }, [session]);

  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  return {
    session,
    loading,
    error,
    stepStatus,
    updateStep,
    completeOnboarding,
    reinitialize: initializeSession,
  };
}
```

**Actions**:
- [ ] Create hook file
- [ ] Implement session lifecycle
- [ ] Add memoization with useCallback
- [ ] Handle loading and error states

**Validation**: Test hook in demo component

**Rollback**: Delete file

---

### 3.5 Extend AuthContext with OTP Methods (10 minutes)
**Task**: Add OTP authentication methods to existing AuthContext

```typescript
// File: src/contexts/AuthContext.tsx (MODIFY)

// Add to AuthContextType interface:
interface AuthContextType {
  // ... existing properties
  signInWithOtp: (email: string) => Promise<{ error: AuthError | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: AuthError | null }>;
  resendOtp: (email: string) => Promise<{ error: AuthError | null }>;
}

// Add to AuthProvider component:
const signInWithOtp = async (email: string) => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false }, // User already exists as anonymous
  });
  return { error };
};

const verifyOtp = async (email: string, token: string) => {
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });
  return { error };
};

const resendOtp = async (email: string) => {
  // Just call signInWithOtp again
  return signInWithOtp(email);
};

// Add to value object:
const value = {
  // ... existing values
  signInWithOtp,
  verifyOtp,
  resendOtp,
};
```

**Actions**:
- [ ] Open `src/contexts/AuthContext.tsx`
- [ ] Add three new methods to interface
- [ ] Implement methods in provider
- [ ] Add to exported value
- [ ] Test methods work

**Validation**: Test OTP flow in browser console

**Rollback**: Remove added methods (keep git diff)

---

## Phase 4: Core Implementation
**Duration**: 2.0 hours  
**Goal**: Build UI components and integrate services

### 4.1 Install React Router (10 minutes)
**Task**: Add routing dependency

**Actions**:
- [ ] Install: `npm install react-router-dom@^6.20.0`
- [ ] Update `package.json` lock
- [ ] Restart dev server
- [ ] Verify no conflicts

**Validation**: Check `node_modules/react-router-dom` exists

**Rollback**: `npm uninstall react-router-dom`

---

### 4.2 Create Onboarding Layout Component (20 minutes)
**Task**: Build shared layout for onboarding pages

```typescript
// File: src/features/onboarding/components/OnboardingLayout.tsx

import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAnonymousSession } from '../hooks/useAnonymousSession';
import { isAnonymousOnboardingEnabled } from '@/lib/config/features';

export function OnboardingLayout() {
  const navigate = useNavigate();
  const { session, loading, error } = useAnonymousSession();

  useEffect(() => {
    // Redirect if feature is disabled
    if (!isAnonymousOnboardingEnabled()) {
      navigate('/sign-up');
      return;
    }

    // Redirect if session creation failed
    if (!loading && error) {
      console.error('Onboarding session error:', error);
      navigate('/sign-up');
    }
  }, [loading, error, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cpn-dark flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-cpn-dark">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-cpn-yellow">CPN</h1>
        </header>
        
        <main>
          <Outlet context={{ session }} />
        </main>
      </div>
    </div>
  );
}
```

**Actions**:
- [ ] Create layout component
- [ ] Add progress indicator
- [ ] Style with Tailwind
- [ ] Add error handling

**Validation**: Render layout in isolation

**Rollback**: Delete file

---

### 4.3 Create Step 1: Add Girl Component (25 minutes)
**Task**: Build girl profile input form

```typescript
// File: src/features/onboarding/components/Step1AddGirl.tsx

import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { OnboardingDataService } from '../services/onboardingData.service';
import { AnonymousAuthService } from '../services/anonymousAuth.service';
import type { OnboardingSession } from '../types/onboarding.types';

export function Step1AddGirl() {
  const navigate = useNavigate();
  const { session } = useOutletContext<{ session: OnboardingSession }>();
  
  const [formData, setFormData] = useState({
    name: '',
    age: 18,
    ethnicity: '',
    hair_color: '',
    location_city: '',
    location_country: '',
    rating: 6.0,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (formData.age < 18 || formData.age > 120) {
      newErrors.age = 'Age must be between 18 and 120';
    }
    
    if (formData.rating < 5.0 || formData.rating > 10.0) {
      newErrors.rating = 'Rating must be between 5.0 and 10.0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    
    try {
      const { girl, error } = await OnboardingDataService.saveGirl(
        session.id,
        formData
      );
      
      if (error) throw error;
      if (!girl) throw new Error('Failed to save girl data');
      
      // Update step progress
      await AnonymousAuthService.updateStep(session.id, 2);
      
      // Navigate to step 2
      navigate('/onboarding/step-2', { state: { girlId: girl.id } });
    } catch (err) {
      console.error('Failed to save girl:', err);
      setErrors({ submit: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-cpn p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Add Girl Profile</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="input-cpn w-full"
            placeholder="Enter name"
          />
          {errors.name && (
            <p className="text-red-400 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Age *
          </label>
          <input
            type="number"
            value={formData.age}
            onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) }))}
            className="input-cpn w-full"
            min="18"
            max="120"
          />
          {errors.age && (
            <p className="text-red-400 text-sm mt-1">{errors.age}</p>
          )}
        </div>

        {/* Add remaining fields: ethnicity, hair_color, etc. */}
        
        {errors.submit && (
          <div className="bg-red-900/20 border border-red-500 text-red-400 p-3 rounded">
            {errors.submit}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-cpn w-full"
        >
          {loading ? 'Saving...' : 'Continue to Add Data'}
        </button>
      </form>
    </div>
  );
}
```

**Actions**:
- [ ] Create Step1 component
- [ ] Add form validation
- [ ] Integrate with data service
- [ ] Add loading states
- [ ] Style with existing classes

**Validation**: Test form submission saves to database

**Rollback**: Delete file

---

### 4.4 Create Step 2: Add Data Entry Component (25 minutes)
**Task**: Build data entry form

```typescript
// File: src/features/onboarding/components/Step2AddData.tsx
// Similar structure to Step1, but for data entry
// Include CPN calculation preview
// Navigate to Step 3 on submit
```

**Actions**:
- [ ] Create Step2 component
- [ ] Add data entry form
- [ ] Add CPN calculation preview
- [ ] Integrate with data service
- [ ] Add back button to Step 1

**Validation**: Test data entry saves correctly

**Rollback**: Delete file

---

### 4.5 Create Step 3: Email Verification Component (25 minutes)
**Task**: Build OTP email verification UI

```typescript
// File: src/features/onboarding/components/Step3EmailVerify.tsx
// Two-phase UI: email input -> OTP verification
// Use signInWithOtp and verifyOtp from AuthContext
// Convert anonymous to permanent on success
// Navigate to Step 4
```

**Actions**:
- [ ] Create Step3 component
- [ ] Build email input phase
- [ ] Build OTP verification phase
- [ ] Add resend functionality
- [ ] Integrate with AuthContext

**Validation**: Test OTP flow end-to-end

**Rollback**: Delete file

---

### 4.6 Create Step 4: Results & Upgrade Component (25 minutes)
**Task**: Display CPN results and upgrade options

```typescript
// File: src/features/onboarding/components/Step4Results.tsx
// Calculate and display CPN metrics
// Show upgrade options (Stripe integration from Phase 1 analysis)
// Complete onboarding migration
// Navigate to welcome page
```

**Actions**:
- [ ] Create Step4 component
- [ ] Display CPN calculations
- [ ] Add upgrade buttons
- [ ] Trigger migration on load
- [ ] Handle migration errors

**Validation**: Test migration function works

**Rollback**: Delete file

---

### 4.7 Configure Routing (10 minutes)
**Task**: Add onboarding routes to App.tsx

```typescript
// File: src/App.tsx (MODIFY)

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { OnboardingLayout } from './features/onboarding/components/OnboardingLayout';
import { Step1AddGirl } from './features/onboarding/components/Step1AddGirl';
// ... import other steps

// Add routes:
<Routes>
  <Route path="/onboarding" element={<OnboardingLayout />}>
    <Route path="step-1" element={<Step1AddGirl />} />
    <Route path="step-2" element={<Step2AddData />} />
    <Route path="step-3" element={<Step3EmailVerify />} />
    <Route path="step-4" element={<Step4Results />} />
  </Route>
  
  {/* Existing routes */}
</Routes>
```

**Actions**:
- [ ] Add React Router to App.tsx
- [ ] Configure onboarding routes
- [ ] Add route guards
- [ ] Test navigation

**Validation**: Navigate through all steps

**Rollback**: Remove routing code

---

## Phase 5: Testing & Validation
**Duration**: 1.0 hour  
**Goal**: Comprehensive testing of entire flow

### 5.1 Unit Tests for Services (15 minutes)
**Task**: Test individual service methods

**Test Cases**:
```typescript
// Test: AnonymousAuthService.createAnonymousSession()
// - Should create user and session
// - Should set is_anonymous = true
// - Should return valid session token

// Test: OnboardingDataService.saveGirl()
// - Should save girl data
// - Should enforce RLS policies
// - Should validate age >= 18

// Test: OnboardingDataService.completeOnboarding()
// - Should migrate data to production tables
// - Should mark session as completed
// - Should update user onboarding_completed_at
```

**Actions**:
- [ ] Write tests for AnonymousAuthService
- [ ] Write tests for OnboardingDataService
- [ ] Run tests: `npm test`
- [ ] Fix any failures

**Validation**: All tests pass

**Rollback**: Skip if no test infrastructure

---

### 5.2 Integration Testing (20 minutes)
**Task**: Test complete user flow

**Test Scenarios**:
```
1. Happy Path:
   - Start onboarding → anonymous session created
   - Fill Step 1 → girl saved to onboarding_girls
   - Fill Step 2 → data entry saved
   - Verify email → anonymous converted to permanent
   - View results → data migrated to production tables

2. Error Path:
   - Invalid age (< 18) → validation error
   - Expired session → redirect to start
   - OTP verification fails → show error, allow retry
   - Migration fails → show error, allow manual retry

3. Edge Cases:
   - User closes tab at Step 2 → session persists
   - User refreshes page → session restored
   - User tries to skip to Step 3 → blocked by guard
```

**Actions**:
- [ ] Test happy path manually
- [ ] Test error scenarios
- [ ] Test edge cases
- [ ] Document any bugs found

**Validation**: No critical bugs found

**Rollback**: N/A (read-only testing)

---

### 5.3 Database Validation (10 minutes)
**Task**: Verify data integrity

**Validation Queries**:
```sql
-- Check onboarding tables are being used
SELECT COUNT(*) FROM onboarding_sessions WHERE is_completed = false;
SELECT COUNT(*) FROM onboarding_girls;
SELECT COUNT(*) FROM onboarding_data_entries;

-- Check migration worked
SELECT COUNT(*) FROM girls WHERE user_id IN (
  SELECT user_id FROM onboarding_sessions WHERE is_completed = true
);

-- Check RLS is enforced
-- Try to query another user's data (should fail)
```

**Actions**:
- [ ] Run validation queries
- [ ] Check data consistency
- [ ] Verify RLS enforcement
- [ ] Check no orphaned records

**Validation**: All queries return expected results

**Rollback**: N/A (read-only)

---

### 5.4 Performance Testing (10 minutes)
**Task**: Verify acceptable performance

**Metrics to Measure**:
- Anonymous session creation time: < 500ms
- Girl data save time: < 300ms
- Data entry save time: < 300ms
- Migration time: < 2000ms
- Database query performance

**Actions**:
- [ ] Use browser DevTools Network tab
- [ ] Measure API response times
- [ ] Check database query plans
- [ ] Identify slow queries

**Validation**: All operations complete in acceptable time

**Rollback**: N/A (read-only)

---

### 5.5 Security Audit (5 minutes)
**Task**: Verify security measures

**Security Checklist**:
- [ ] RLS policies prevent cross-user data access
- [ ] Anonymous users can only access own session
- [ ] Expired sessions are inaccessible
- [ ] Migration function uses SECURITY DEFINER safely
- [ ] No sensitive data in client-side storage
- [ ] OTP tokens are not logged

**Actions**:
- [ ] Review RLS policies
- [ ] Test unauthorized access attempts
- [ ] Check console for logged secrets
- [ ] Verify HTTPS in production

**Validation**: No security vulnerabilities found

**Rollback**: N/A (read-only audit)

---

## Phase 6: Integration & Go-Live
**Duration**: 0.5 hours  
**Goal**: Deploy to production safely

### 6.1 Pre-Deployment Checklist (10 minutes)
**Task**: Final verification before deployment

**Checklist**:
- [ ] All tests passing
- [ ] Feature flag set to `false` in production .env
- [ ] Database migration tested on staging
- [ ] Rollback procedure documented
- [ ] Monitoring alerts configured
- [ ] Team notified of deployment
- [ ] Backup completed

**Actions**:
- [ ] Run through checklist
- [ ] Fix any issues
- [ ] Get approval to deploy

**Validation**: All items checked

**Rollback**: Abort if any item fails

---

### 6.2 Deploy Database Migration (10 minutes)
**Task**: Apply migration to production database

**Actions**:
- [ ] Backup production database
- [ ] Apply migration: `supabase db push --linked`
- [ ] Verify tables created
- [ ] Verify RLS enabled
- [ ] Test with anonymous user

**Validation**: Migration successful, no errors

**Rollback**: Apply rollback migration if issues

---

### 6.3 Deploy Application Code (5 minutes)
**Task**: Merge and deploy code changes

**Actions**:
- [ ] Merge feature branch to main
- [ ] Deploy to production
- [ ] Verify deployment successful
- [ ] Check application loads

**Validation**: App deployed, feature flag still off

**Rollback**: Revert commit if critical issues

---

### 6.4 Enable Feature Flag (5 minutes)
**Task**: Gradually roll out feature

**Actions**:
- [ ] Set `VITE_ENABLE_ANONYMOUS_ONBOARDING=true` in production
- [ ] Rebuild/restart application
- [ ] Test onboarding flow in production
- [ ] Monitor error rates

**Validation**: Feature works in production

**Rollback**: Set flag back to `false`

---

### 6.5 Post-Deployment Monitoring (5 minutes)
**Task**: Watch for issues

**Monitoring Checklist**:
- [ ] Check error logs for new errors
- [ ] Monitor database CPU/memory
- [ ] Check onboarding completion rate
- [ ] Verify no increase in failed requests
- [ ] Monitor user feedback

**Actions**:
- [ ] Set up alerts for critical errors
- [ ] Monitor for 15 minutes
- [ ] Document any issues

**Validation**: No critical errors, acceptable performance

**Rollback**: Disable feature flag if critical issues

---

## Rollback Procedures

### Emergency Rollback (< 5 minutes)
If critical issues are found:

1. **Disable Feature Immediately**:
   ```bash
   # Set in production environment
   VITE_ENABLE_ANONYMOUS_ONBOARDING=false
   ```

2. **Verify Normal Flow Works**:
   - Test traditional sign-up flow
   - Confirm existing users unaffected

3. **Investigate Issue**:
   - Check error logs
   - Review recent database changes
   - Identify root cause

### Database Rollback (< 10 minutes)
If database migration causes issues:

1. **Apply Rollback Migration**:
   ```bash
   supabase db push --file supabase/migrations/[timestamp]_rollback_onboarding_tables.sql
   ```

2. **Verify Production Tables Intact**:
   ```sql
   SELECT COUNT(*) FROM girls;
   SELECT COUNT(*) FROM data_entries;
   SELECT COUNT(*) FROM users;
   ```

3. **Clean Up Orphaned Data** (if any):
   ```sql
   -- Check for references to dropped tables
   -- Clean up manually if needed
   ```

### Code Rollback (< 5 minutes)
If application code has critical bugs:

1. **Revert Commit**:
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Redeploy**:
   - Trigger deployment
   - Verify app loads

3. **Document Issue**:
   - Create bug report
   - Plan fix

---

## Success Criteria

### Technical Success
- [ ] Anonymous session creation works reliably
- [ ] All onboarding steps save data to database
- [ ] Email verification converts anonymous to permanent
- [ ] Data migration to production tables succeeds
- [ ] No impact on existing app functionality
- [ ] Performance within acceptable thresholds
- [ ] Security audit passes

### User Experience Success
- [ ] Users can complete onboarding in < 5 minutes
- [ ] No data loss during onboarding
- [ ] Clear error messages for all failures
- [ ] Mobile-responsive on all screens
- [ ] Smooth transitions between steps

### Business Success
- [ ] Onboarding completion rate > 40%
- [ ] Upgrade conversion rate measured
- [ ] No increase in support tickets
- [ ] Database costs within budget
- [ ] Feature flag working correctly

---

## Post-Implementation Tasks

### Week 1 After Launch
- [ ] Monitor onboarding analytics
- [ ] Review error logs daily
- [ ] Gather user feedback
- [ ] Optimize slow queries
- [ ] Document lessons learned

### Week 2-4 After Launch
- [ ] Set up automated cleanup job for expired sessions
- [ ] Add more detailed analytics tracking
- [ ] A/B test different onboarding variations
- [ ] Optimize database indexes based on usage
- [ ] Plan Phase 2 improvements

### Cleanup Jobs to Schedule
```sql
-- Run daily to clean up expired sessions
SELECT cron.schedule(
  'cleanup-expired-onboarding',
  '0 2 * * *', -- 2 AM daily
  $$SELECT cleanup_expired_onboarding_sessions()$$
);
```

---

## Risk Mitigation

### High-Risk Areas
1. **Anonymous Session Creation**: Could fail if Supabase auth is down
   - Mitigation: Feature flag, fallback to traditional sign-up

2. **Data Migration**: Could fail if database connection lost
   - Mitigation: Retry logic, transaction rollback, manual recovery

3. **Email Delivery**: OTP emails might not arrive
   - Mitigation: Resend functionality, clear error messages

4. **Database Load**: New tables could increase load
   - Mitigation: Proper indexing, monitoring, auto-scaling

### Medium-Risk Areas
1. **Browser Compatibility**: Might not work on old browsers
   - Mitigation: Feature detection, graceful degradation

2. **Network Failures**: Users on poor connections
   - Mitigation: Retry logic, loading states, offline messaging

### Low-Risk Areas
1. **UI Bugs**: Minor visual issues
   - Mitigation: Manual testing, user feedback

2. **Performance**: Slightly slower than expected
   - Mitigation: Optimization after launch

---

## Timeline Summary

| Phase | Duration | Cumulative |
|-------|----------|------------|
| 1. Environment Isolation & Setup | 1.5h | 1.5h |
| 2. Database Schema & Migration | 1.5h | 3.0h |
| 3. Authentication Layer | 1.5h | 4.5h |
| 4. Core Implementation | 2.0h | 6.5h |
| 5. Testing & Validation | 1.0h | 7.5h |
| 6. Integration & Go-Live | 0.5h | 8.0h |

**Total**: 8 hours

---

## Contact & Support

### During Implementation
- Questions: [Your team communication channel]
- Code Review: [PR review process]
- Blocker Resolution: [Escalation process]

### After Launch
- Bug Reports: [Issue tracking system]
- Performance Issues: [Monitoring dashboard]
- User Feedback: [Feedback collection method]

---

## Appendix: Useful Commands

### Database Queries
```sql
-- Check anonymous users
SELECT id, email, is_anonymous FROM auth.users WHERE is_anonymous = true LIMIT 10;

-- Check active onboarding sessions
SELECT * FROM onboarding_sessions WHERE is_completed = false ORDER BY created_at DESC LIMIT 10;

-- Check migration success rate
SELECT 
  COUNT(*) FILTER (WHERE is_completed = true) as completed,
  COUNT(*) FILTER (WHERE is_completed = false) as in_progress,
  COUNT(*) as total
FROM onboarding_sessions;
```

### Development Commands
```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Build
npm run build

# Database migration
supabase db push

# Database reset (local only!)
supabase db reset
```

---

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Status**: Ready for Implementation  
**Approved By**: [Awaiting Approval]

