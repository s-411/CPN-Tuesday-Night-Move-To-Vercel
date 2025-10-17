# COMPREHENSIVE TESTING DOCUMENT FOR FUTURE AI AGENT

## 🎯 MISSION OBJECTIVE

Verify that the recently added **Share Center** and **Leaderboards** features on the `dev-leaderboards` branch have NOT broken any pre-existing functionality in the CPN (Cost Per Nut) dating app. Specifically, test that:

1. All core user journeys still work
2. Subscription/payment flows are intact
3. Database operations (CRUD for girls/data entries) function correctly
4. Navigation and routing work properly
5. The two new features integrate cleanly without side effects

---

## 📋 WHAT WAS ADDED

### A. SHARE CENTER FEATURE (Activated)

**Purpose:** Premium feature allowing users to generate shareable social media images with their dating statistics.

**Files Modified/Created:**
- **Modified:** [src/pages/ShareCenter.tsx](../src/pages/ShareCenter.tsx) - Full implementation (was previously dormant)
- **Modified:** [src/lib/socialShare.ts](../src/lib/socialShare.ts) - Updated image generation logic
- **Modified:** [src/App.tsx](../src/App.tsx#L58) - Added 'sharecenter' to activeView state type
- **Modified:** [src/App.tsx](../src/App.tsx#L405-L407) - Added sidebar navigation item
- **Modified:** [src/App.tsx](../src/App.tsx#L520-L526) - Added view rendering with SubscriptionGate

**Key Details:**
- Uses `html2canvas` library (added to dependencies)
- **Behind paywall** - Only accessible to premium users (subscription_tier !== 'boyfriend')
- Wraps content in `<SubscriptionGate>` component
- URL hash detection: `#sharing-center` or `#sharecenter` triggers view
- **NO database schema changes** - purely frontend feature

**Integration Points:**
- Uses existing Supabase client for fetching user data
- Accesses `data_entries` and `girls` tables (read-only)
- Calculates metrics from existing data
- Uses AuthContext for user/profile access

---

### B. LEADERBOARDS FEATURE (Complete New Feature)

**Purpose:** Free-tier feature allowing users to create private groups, invite friends, and compete based on dating efficiency metrics.

**Files Created:**
- [src/pages/Leaderboards.tsx](../src/pages/Leaderboards.tsx) (274 lines) - Main page listing user's groups
- [src/pages/LeaderboardDetail.tsx](../src/pages/LeaderboardDetail.tsx) (468 lines) - Group rankings view
- [src/pages/JoinLeaderboard.tsx](../src/pages/JoinLeaderboard.tsx) (269 lines) - Invite acceptance flow
- [src/lib/leaderboards.ts](../src/lib/leaderboards.ts) (594 lines) - Complete backend logic

**Database Migrations:**
1. [supabase/migrations/20251011104648_create_leaderboards_schema.sql](../supabase/migrations/20251011104648_create_leaderboards_schema.sql)
   - Creates `leaderboard_groups` table
   - Creates `leaderboard_members` table
   - Creates `generate_invite_token()` function
   - Creates `validate_invite_token()` function
   - Creates `get_user_leaderboard_stats()` function
   - Creates `add_creator_as_member()` trigger
   - Sets up Row Level Security (RLS) policies

2. [supabase/migrations/20251011112205_fix_leaderboard_rls_recursion.sql](../supabase/migrations/20251011112205_fix_leaderboard_rls_recursion.sql)
   - Creates `user_is_group_member()` security definer function
   - First attempt to fix RLS recursion

3. [supabase/migrations/20251011120657_fix_leaderboard_rls_final.sql](../supabase/migrations/20251011120657_fix_leaderboard_rls_final.sql)
   - Temporary overly-permissive policy (security concern if not overridden)

4. [supabase/migrations/20251011120744_secure_leaderboard_rls.sql](../supabase/migrations/20251011120744_secure_leaderboard_rls.sql)
   - Creates `user_can_see_member()` security definer function
   - **FINAL FIX** for RLS recursion - replaces previous policies

**Files Modified:**
- [src/App.tsx](../src/App.tsx):
  - Added imports (lines 18-20)
  - Added state variables (lines 70-72)
  - Added URL detection for `/join/:token` routes (lines 111-116)
  - Added sidebar navigation (lines 401-404)
  - Added view rendering **WITHOUT SubscriptionGate** (lines 485-519)
  - Added leaderboard navigation handlers

- [src/lib/types/database.ts](../src/lib/types/database.ts):
  - Added `leaderboard_groups` table types (line 182+)
  - Added `leaderboard_members` table types (line 208+)
  - Added `get_user_leaderboard_stats` RPC function type (line 245+)

**Key Details:**
- **FREE TIER ACCESS** - No paywall, available to all users including 'boyfriend' tier
- Calculates stats from user's `data_entries` and `girls` tables
- Uses cryptographically secure invite tokens
- Supports three user scenarios:
  1. Logged-in user clicking invite link
  2. Logged-out user needing to sign in
  3. New user needing to sign up
- Example Group feature with mock data for preview
- Leave Group functionality with confirmation modal

**Integration Points:**
- URL routing: `/join/:token` pattern
- State management: `viewingLeaderboardGroup`, `joiningLeaderboardToken`, `leaderboardsRefresh`
- Navigation: Back button triggers `onBack()` which refreshes leaderboards list
- Database: New tables with foreign keys to `users` table
- Uses existing calculation functions from [src/lib/calculations.ts](../src/lib/calculations.ts)

---

## 🔍 CRITICAL TESTING AREAS

### 1. ROUTING & NAVIGATION

**Test:**
- ✅ `/` → Dashboard loads correctly
- ✅ `/#sharecenter` → Share Center loads (premium users only)
- ✅ `/join/:token` → JoinLeaderboard component loads
- ✅ Sidebar navigation works for all items
- ✅ Browser back/forward buttons work correctly
- ✅ Direct URL entry works
- ✅ Hash changes don't break state

**Files to Check:**
- [src/App.tsx](../src/App.tsx#L104-L116) - URL detection logic
- [src/App.tsx](../src/App.tsx#L125-L131) - Hash change handler

**What Could Break:**
- Existing routes (dashboard, analytics, settings) may not load
- URL state management could conflict with new views
- Browser history manipulation could cause infinite loops

---

### 2. SUBSCRIPTION & PAYWALL SYSTEM

**CRITICAL:** This is the highest-risk area for breakage.

**Test:**
- ✅ Free tier ('boyfriend') users can access:
  - Dashboard
  - Girls list (1 girl max)
  - Overview
  - **Leaderboards (NEW - must be accessible)**
- ✅ Free tier users are blocked from:
  - Analytics (behind SubscriptionGate)
  - Data Vault (behind SubscriptionGate)
  - **Share Center (NEW - must show paywall)**
- ✅ Premium users ('player', 'premium', 'lifetime') can access everything
- ✅ Upgrade modal appears when clicking locked features
- ✅ Stripe checkout flow works correctly
- ✅ Post-checkout redirect to `/subscription-success` works
- ✅ Subscription status updates correctly after payment

**Files to Check:**
- [src/App.tsx](../src/App.tsx#L467-L483) - Analytics gate
- [src/App.tsx](../src/App.tsx#L478-L484) - Data Vault gate
- [src/App.tsx](../src/App.tsx#L521-L526) - Share Center gate (NEW)
- [src/App.tsx](../src/App.tsx#L485-L519) - Leaderboards (NO gate - must be free)
- [src/components/SubscriptionGate.tsx](../src/components/SubscriptionGate.tsx)
- [src/components/UpgradeModal.tsx](../src/components/UpgradeModal.tsx)
- [src/contexts/AuthContext.tsx](../src/contexts/AuthContext.tsx)

**What Could Break:**
- Leaderboards might incorrectly show paywall
- Share Center might be accessible to free users
- Checkout flow might be disrupted by new state variables
- `profile?.subscription_tier` checks could fail

**Verification Commands:**
```bash
# Check for subscription_tier usage
grep -n "subscription_tier" src/App.tsx

# Check SubscriptionGate wrapping
grep -n "SubscriptionGate" src/App.tsx

# Verify leaderboards is NOT behind gate
grep -A5 "activeView === 'leaderboards'" src/App.tsx
```

---

### 3. DATABASE OPERATIONS

**Test:**
- ✅ Create new girl profile works
- ✅ Edit girl profile works
- ✅ Delete girl profile works
- ✅ Add data entry works
- ✅ Edit data entry works
- ✅ Delete data entry works
- ✅ Realtime updates trigger correctly
- ✅ Calculations (cost per nut, etc.) are accurate
- ✅ **NEW:** Create leaderboard group works
- ✅ **NEW:** Join leaderboard via invite works
- ✅ **NEW:** Leave leaderboard works
- ✅ **NEW:** Leaderboard stats calculate correctly

**Files to Check:**
- [src/App.tsx](../src/App.tsx#L80-L100) - Realtime subscriptions
- [src/App.tsx](../src/App.tsx#L183-L230) - loadGirls function
- [src/lib/leaderboards.ts](../src/lib/leaderboards.ts) - All CRUD operations

**Database Tables:**
- `users` - No changes, but accessed by new code
- `girls` - No schema changes, read by leaderboards
- `data_entries` - No schema changes, read by leaderboards
- `leaderboard_groups` - NEW table
- `leaderboard_members` - NEW table

**What Could Break:**
- Realtime subscriptions might not fire if channel name conflicts
- Foreign key constraints from new tables could cause cascade issues
- RLS policies could block legitimate operations
- Infinite recursion in RLS (already fixed, but verify)

**Verification:**
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'leaderboard%';

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'leaderboard%';

-- Check security definer functions exist
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('user_can_see_member', 'get_user_leaderboard_stats');
```

---

### 4. STATE MANAGEMENT

**Test:**
- ✅ Creating girl doesn't affect leaderboards state
- ✅ Switching views preserves data
- ✅ Modal states don't conflict
- ✅ Navigation between leaderboard views works
- ✅ `leaderboardsRefresh` trigger causes proper reload
- ✅ `viewingLeaderboardGroup` and `joiningLeaderboardToken` don't conflict

**Files to Check:**
- [src/App.tsx](../src/App.tsx#L55-L72) - All state declarations

**New State Variables:**
```typescript
const [viewingLeaderboardGroup, setViewingLeaderboardGroup] = useState<string | null>(null);
const [joiningLeaderboardToken, setJoiningLeaderboardToken] = useState<string | null>(null);
const [leaderboardsRefresh, setLeaderboardsRefresh] = useState(0);
```

**What Could Break:**
- State updates in one view could accidentally trigger re-renders in others
- Modal states could conflict (e.g., AddGirl modal + CreateGroup modal)
- Navigation state could become inconsistent

---

### 5. USER JOURNEY FLOWS

#### A. New User Onboarding
**Test Complete Flow:**
1. Visit app → See Step1 onboarding
2. Complete steps 1-4
3. Sign up
4. Land on dashboard
5. Add first girl
6. Add first data entry
7. View overview
8. Try to access Analytics → See paywall
9. **NEW:** Access Leaderboards → Works without paywall
10. **NEW:** Access Share Center → See paywall

**Critical:** New views must not interfere with onboarding flow.

#### B. Existing User Login
**Test:**
1. Sign in
2. Dashboard loads with existing data
3. All girls and entries display correctly
4. Calculations are accurate
5. **NEW:** Navigate to Leaderboards
6. **NEW:** Create a group
7. **NEW:** Copy invite link
8. **NEW:** Open invite link in incognito (tests join flow)

#### C. Premium Upgrade Flow
**Test:**
1. Sign in as free user
2. Click on Analytics → See upgrade modal
3. Click "Activate Player Mode"
4. Complete Stripe checkout
5. Redirect to `/subscription-success`
6. Verify premium access granted
7. **NEW:** Verify Share Center now accessible
8. **NEW:** Verify Leaderboards still accessible (no change)

---

## 🧪 AUTOMATED TEST COMMANDS

### TypeScript Compilation
```bash
npm run typecheck
```
**Expected:** No type errors. New types should integrate cleanly.

### Development Server
```bash
npm run dev
```
**Expected:** Runs on http://localhost:5173 without errors.

### Database Status
```bash
npm run db:status
```
**Expected:** Shows Supabase running with all services healthy.

### Check Migrations
```bash
supabase migration list
```
**Expected:** Shows 4 new leaderboard migrations as applied.

---

## 🔎 SPECIFIC CHROME DEVTOOLS VERIFICATION TASKS

**Note:** User will add Chrome DevTools MCP server for comprehensive testing.

### 1. Console Errors
**Check for:**
- No JavaScript errors on page load
- No errors when navigating between views
- No errors when creating/joining groups
- No infinite recursion errors (previous issue)

### 2. Network Tab
**Check for:**
- Supabase API calls succeed (200 status)
- No 403 Forbidden errors (RLS blocking)
- No 500 Internal Server errors
- Stripe checkout redirects work
- Invite token validation works

**Key Endpoints:**
- `POST /rest/v1/leaderboard_groups` - Create group
- `POST /rest/v1/leaderboard_members` - Join group
- `GET /rest/v1/leaderboard_members` - Get members
- `POST /rest/v1/rpc/get_user_leaderboard_stats` - Get stats
- `POST /rest/v1/rpc/validate_invite_token` - Validate token

### 3. Application Tab (Local Storage)
**Check for:**
- `supabase.auth.token` exists and is valid
- Session persists across page refreshes
- No token conflicts

### 4. Performance
**Check for:**
- Page load times haven't degraded
- No memory leaks when switching views
- Realtime subscriptions don't pile up

---

## ⚠️ KNOWN ISSUES (RESOLVED)

### Issue 1: RLS Infinite Recursion ✅ FIXED
**Symptom:** Error "infinite recursion detected in policy for relation 'leaderboard_members'"

**Root Cause:** Circular dependency in RLS policies where `leaderboard_members` SELECT policy queried same table.

**Fix Applied:** Migration [20251011120744_secure_leaderboard_rls.sql](../supabase/migrations/20251011120744_secure_leaderboard_rls.sql) created `user_can_see_member()` SECURITY DEFINER function to bypass RLS during checks.

**Verify Fixed:**
```bash
# Create a group - should succeed without recursion error
# In browser console:
await supabase.from('leaderboard_groups').insert({ name: 'Test Group' })
```

### Issue 2: Groups Not Showing After Creation ✅ FIXED
**Symptom:** After creating group, navigating back showed empty state.

**Root Cause:** Component used conditional rendering that persisted even after groups existed.

**Fix Applied:** Refactored [src/pages/Leaderboards.tsx](../src/pages/Leaderboards.tsx) to always show groups grid with Example Group, removing conditional empty state.

---

## 📝 TESTING CHECKLIST FOR AI AGENT

Use this checklist to systematically verify everything:

### Pre-Flight Checks
- [ ] Confirm on `dev-leaderboards` branch
- [ ] Run `npm install` (html2canvas dependency)
- [ ] Run `npm run db:start` (Supabase local)
- [ ] Run `npm run dev` (Vite dev server)
- [ ] Confirm no console errors on initial load

### Core Functionality (Must Not Break)
- [ ] Dashboard loads and displays user data
- [ ] Girls list shows all profiles correctly
- [ ] Add new girl works
- [ ] Edit existing girl works
- [ ] Delete girl works (with confirmation)
- [ ] Add data entry works
- [ ] Overview calculations are correct
- [ ] Analytics page loads (premium only)
- [ ] Settings page loads
- [ ] Sign out works

### Subscription System (Critical)
- [ ] Free users see paywall on Analytics
- [ ] Free users see paywall on Data Vault
- [ ] Free users see paywall on Share Center (NEW)
- [ ] Free users CAN access Leaderboards (NEW - no paywall)
- [ ] Premium users can access all features
- [ ] Upgrade modal appears correctly
- [ ] Stripe checkout flow works
- [ ] Post-payment redirect works

### Leaderboards Feature (New)
- [ ] Navigate to Leaderboards from sidebar
- [ ] See Example Group card
- [ ] Click Example Group shows mock data
- [ ] Create new group works
- [ ] Group appears in list after creation
- [ ] Copy invite link works
- [ ] Open invite link in new window
- [ ] Join group flow works (logged in)
- [ ] Join group flow works (logged out)
- [ ] Join group flow works (new user)
- [ ] Group rankings display correctly
- [ ] Stats calculate accurately
- [ ] Leave group works
- [ ] Leave group confirmation modal works
- [ ] Example Group appears LAST in list
- [ ] Example Group has no trophy icon
- [ ] Leave Group card aligned right on desktop

### Share Center Feature (New)
- [ ] Navigate to Share Center from sidebar
- [ ] Free users see paywall
- [ ] Premium users see full interface
- [ ] Select up to 3 metrics
- [ ] Generate image works
- [ ] Image displays correctly
- [ ] Download image works
- [ ] Copy image to clipboard works
- [ ] Filename updates correctly

### Integration & Navigation
- [ ] URL routing works for all pages
- [ ] Browser back button works
- [ ] Browser forward button works
- [ ] Direct URL entry works
- [ ] Hash changes work (`#sharecenter`)
- [ ] `/join/:token` routing works
- [ ] Sidebar active states correct
- [ ] No state conflicts between views

### Database & Realtime
- [ ] Realtime updates work when adding data
- [ ] Calculations update immediately
- [ ] No RLS errors in console
- [ ] No infinite recursion errors
- [ ] Leaderboard groups persist correctly
- [ ] Invite tokens are unique

### Chrome DevTools Verification
- [ ] Console: No errors
- [ ] Network: All API calls succeed
- [ ] Network: No 403 Forbidden errors
- [ ] Network: Stripe redirects work
- [ ] Performance: No memory leaks
- [ ] Application: Auth token valid

---

## 🚨 AREAS OF HIGHEST RISK

**Priority 1: Subscription Gates**
- Risk: Leaderboards might show paywall (should be free)
- Risk: Share Center might be accessible to free users (should be locked)
- Impact: Breaks monetization model

**Priority 2: Routing Conflicts**
- Risk: `/join/:token` could conflict with other routes
- Risk: Hash changes could break existing views
- Impact: Users can't navigate properly

**Priority 3: Database Integrity**
- Risk: Foreign key constraints could cause cascade deletes
- Risk: RLS policies could block legitimate operations
- Impact: Data loss or access denied errors

**Priority 4: State Management**
- Risk: New state variables could cause unexpected re-renders
- Risk: Modal states could conflict
- Impact: UI becomes unusable or buggy

---

## 📊 FILES CHANGED SUMMARY

**Total:** 37 files changed, 6,406 insertions, 1,282 deletions

**Critical Files Modified:**
1. [src/App.tsx](../src/App.tsx) - Main app routing and state
2. [src/lib/types/database.ts](../src/lib/types/database.ts) - Type definitions
3. [src/pages/ShareCenter.tsx](../src/pages/ShareCenter.tsx) - Activated feature
4. [package.json](../package.json) - Added html2canvas dependency

**Critical Files Created:**
1. [src/lib/leaderboards.ts](../src/lib/leaderboards.ts) - Backend logic (594 lines)
2. [src/pages/Leaderboards.tsx](../src/pages/Leaderboards.tsx) - Main page (274 lines)
3. [src/pages/LeaderboardDetail.tsx](../src/pages/LeaderboardDetail.tsx) - Detail view (468 lines)
4. [src/pages/JoinLeaderboard.tsx](../src/pages/JoinLeaderboard.tsx) - Invite flow (269 lines)
5. 4 database migrations in `supabase/migrations/`

---

## 🎬 RECOMMENDED TESTING SEQUENCE

1. **Start Fresh:** Clear browser cache, localStorage, restart dev server
2. **Test Core First:** Verify dashboard, girls CRUD, data entry CRUD
3. **Test Subscription:** Verify paywall logic on all gated features
4. **Test Leaderboards:** Complete full flow (create → invite → join → leave)
5. **Test Share Center:** Verify paywall, then test as premium user
6. **Test Integration:** Navigate between all views, check state persistence
7. **Test Edge Cases:** Concurrent operations, rapid navigation, back button
8. **Check Chrome DevTools:** Review console, network, performance

---

## ✅ SUCCESS CRITERIA

The testing is successful if:

1. ✅ All pre-existing features work exactly as before
2. ✅ No console errors during normal operation
3. ✅ Subscription gates function correctly (Share Center locked, Leaderboards free)
4. ✅ Database operations succeed without RLS errors
5. ✅ Navigation and routing work smoothly
6. ✅ Leaderboards feature works end-to-end
7. ✅ Share Center feature works for premium users
8. ✅ Stripe checkout flow remains intact
9. ✅ Realtime updates continue to work
10. ✅ Performance remains acceptable

---

## 📞 WHAT TO DO IF SOMETHING BREAKS

### If Leaderboards Shows Paywall:
**Check:** [src/App.tsx](../src/App.tsx#L485-L519)
**Fix:** Ensure Leaderboards rendering is NOT wrapped in `<SubscriptionGate>`

### If Share Center Accessible to Free Users:
**Check:** [src/App.tsx](../src/App.tsx#L520-L526)
**Fix:** Ensure Share Center IS wrapped in `<SubscriptionGate isLocked={profile?.subscription_tier === 'boyfriend'}>`

### If RLS Errors Appear:
**Check:** Database migrations applied correctly
**Fix:** Run `supabase migration up` or `npm run db:reset`

### If Routing Breaks:
**Check:** [src/App.tsx](../src/App.tsx#L104-L131)
**Fix:** Verify URL detection logic doesn't conflict with existing patterns

### If State Conflicts:
**Check:** [src/App.tsx](../src/App.tsx#L55-L72)
**Fix:** Ensure new state variables don't share names with existing ones

---

## 🔗 KEY FILE REFERENCES

- **Main App:** [src/App.tsx](../src/App.tsx)
- **Leaderboards Backend:** [src/lib/leaderboards.ts](../src/lib/leaderboards.ts)
- **Leaderboards UI:** [src/pages/Leaderboards.tsx](../src/pages/Leaderboards.tsx)
- **Leaderboard Detail:** [src/pages/LeaderboardDetail.tsx](../src/pages/LeaderboardDetail.tsx)
- **Join Flow:** [src/pages/JoinLeaderboard.tsx](../src/pages/JoinLeaderboard.tsx)
- **Share Center:** [src/pages/ShareCenter.tsx](../src/pages/ShareCenter.tsx)
- **Database Types:** [src/lib/types/database.ts](../src/lib/types/database.ts)
- **Subscription Gate:** [src/components/SubscriptionGate.tsx](../src/components/SubscriptionGate.tsx)
- **Main Migration:** [supabase/migrations/20251011104648_create_leaderboards_schema.sql](../supabase/migrations/20251011104648_create_leaderboards_schema.sql)
- **RLS Fix:** [supabase/migrations/20251011120744_secure_leaderboard_rls.sql](../supabase/migrations/20251011120744_secure_leaderboard_rls.sql)

---

## 📌 FINAL NOTES

**Branch:** `dev-leaderboards`
**Base Branch:** `main`
**Commits Ahead:** 13 commits
**Testing Environment:** Local development with Supabase local instance
**Production:** Deployed to Vercel pre-production environment

**Dependencies Added:**
- `html2canvas@^1.4.1` (for Share Center image generation)

**Environment Variables:**
No new environment variables required. All existing variables remain unchanged.

---

**END OF DOCUMENT**

This document should be sufficient for a future AI agent to comprehensively test the application without user intervention. The agent should be able to use Chrome DevTools MCP server to interact with the browser and verify all functionality systematically.
