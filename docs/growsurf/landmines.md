# 🚨 LANDMINES: Critical Safety Guide
## What Can Go Wrong & How to Avoid It

**READ THIS BEFORE STARTING IMPLEMENTATION**

This document outlines every major risk, testing checkpoint, and "what if it breaks" scenario for implementing the referral program. The biggest landmine is **database changes** - Supabase doesn't have automatic rollbacks, so we must be extremely careful.

---

## 🔴 CRITICAL: Database Safety Strategy

### The Problem

**Supabase does NOT have automatic database rollbacks.** Once you run a migration on production, you cannot easily "undo" it. If you add columns with constraints, drop tables, or modify RLS policies incorrectly, you can:
- Break existing user queries (app becomes unusable)
- Lose data (if you drop tables/columns)
- Lock out users (if RLS policies are too restrictive)
- Expose data (if RLS policies are too permissive)

### The Solution: Three-Tier Testing

**NEVER run migrations on production first. ALWAYS follow this sequence:**

#### Tier 1: Local Supabase (Safe Sandbox)

```bash
# You already have local Supabase set up
# Check status:
supabase status

# Your local database is at: postgresql://postgres:postgres@localhost:54322/postgres
# This is COMPLETELY isolated from production
# You can blow it up and recreate it instantly
```

**Benefits:**
- Instant reset: `supabase db reset` wipes everything and reapplies migrations
- No risk to production data
- Fast iteration
- Free to experiment

**Process:**
1. Create migration file locally
2. Apply with `supabase db reset`
3. Test thoroughly
4. If anything breaks, fix and reset again
5. Only proceed to Tier 2 when 100% confident

#### Tier 2: Supabase Staging Branch (Production-Like)

**CRITICAL:** Create a staging branch BEFORE touching production.

```bash
# Create a preview branch (requires Supabase Pro plan)
# This creates a separate database that mirrors production structure
supabase branches create staging-referral-program

# Link to staging branch
supabase link --project-ref YOUR_STAGING_PROJECT_ID

# Push migration to staging
supabase db push

# Test on staging for 24-48 hours minimum
```

**If you DON'T have Supabase Pro (no branches):**

Alternative: Create a second Supabase project manually for staging:
1. Go to supabase.com dashboard
2. Create new project: "CPN-Staging"
3. Copy production schema to staging (export SQL from prod, import to staging)
4. Test migrations on staging project first

**Benefits:**
- Production-like environment
- Can test with real Stripe test mode
- Can test cross-domain attribution
- No risk to real users

**Process:**
1. Apply migration to staging
2. Test ALL existing features (full regression)
3. Test new features
4. Leave staging running for 24-48 hours
5. Monitor for errors, memory leaks, slow queries
6. Only proceed to Tier 3 when 100% confident

#### Tier 3: Production (The Point of No Return)

**BEFORE running migration on production:**

1. **Backup production database:**
```bash
# In Supabase Dashboard:
# 1. Go to Database → Backups
# 2. Create manual backup: "pre-referral-migration-YYYY-MM-DD"
# 3. Download SQL dump as extra safety measure
```

2. **Schedule maintenance window:**
   - Inform users (if possible)
   - Choose low-traffic time (e.g., 2am-4am)
   - Have rollback plan ready

3. **Test migration on production with feature flag OFF:**
```bash
# Set in Vercel:
ENABLE_REFERRAL_PROGRAM=false

# This ensures:
# - New code deployed but inactive
# - Migration applied but not used
# - If something breaks, only backend affected (users don't see it)
```

4. **Apply migration:**
```bash
# Connect to production
supabase link --project-ref YOUR_PRODUCTION_PROJECT_ID

# Push migration
supabase db push

# WATCH FOR ERRORS
# If ANY errors, STOP immediately
```

5. **Verify production health:**
   - Login as test user
   - Check dashboard loads
   - Check data entry works
   - Check analytics loads
   - Check Sentry/logging for errors

6. **If everything looks good after 1 hour:**
   - Enable feature flag for internal users only (5-10 people)
   - Monitor for 24 hours
   - Gradual rollout (10% → 50% → 100%)

---

## 🧪 Testing Checkpoints: Story-by-Story

### Story 1.1: Database Schema (DAY 1)

**Landmines:**

1. **Migration fails to run:**
   - **Cause:** SQL syntax error, constraint violation, conflicting table names
   - **What happens:** `supabase db reset` fails, error in console
   - **How to avoid:**
     - Test SQL in Supabase Studio SQL editor first
     - Run `supabase db reset` locally before committing
   - **If it happens:**
     ```bash
     # Fix SQL in migration file
     # Reset again
     supabase db reset
     ```

2. **RLS policy too restrictive:**
   - **Cause:** Policy uses `auth.uid() = user_id` but column name is different
   - **What happens:** Users can't view their own data
   - **How to avoid:**
     - Test RLS by querying as non-admin user in Studio
     - Use SQL function to test: `SELECT * FROM users WHERE id = auth.uid()`
   - **If it happens:**
     - Drop policy: `DROP POLICY "policy_name" ON table_name;`
     - Fix policy logic
     - Recreate: `CREATE POLICY ...`

3. **RLS policy too permissive:**
   - **Cause:** Policy uses `USING (true)` or missing `auth.uid()` check
   - **What happens:** Users can see other users' data (SECURITY BREACH)
   - **How to avoid:**
     - ALWAYS test by logging in as User A, try to access User B's data
     - Use `SELECT auth.uid()` in Studio to verify current user ID
   - **If it happens:**
     - Drop policy immediately
     - Fix and recreate with proper restrictions

4. **Existing queries break:**
   - **Cause:** New NOT NULL column added without default value
   - **What happens:** INSERT queries fail, users can't sign up
   - **How to avoid:**
     - ALWAYS make new columns nullable: `ADD COLUMN name TEXT`
     - OR provide default value: `ADD COLUMN name TEXT DEFAULT ''`
   - **If it happens:**
     ```sql
     -- Make column nullable
     ALTER TABLE users ALTER COLUMN column_name DROP NOT NULL;
     ```

**Testing Checklist:**

```bash
# After migration applied locally:

# 1. Verify schema
open http://127.0.0.1:54323
# → Navigate to Table Editor
# → Check users table has 5 new columns (all nullable)
# → Check referral_events table exists

# 2. Test existing queries
# In Studio SQL Editor:
SELECT * FROM users WHERE id = auth.uid();
# Should return current user's data with new columns (all NULL)

SELECT * FROM girls WHERE user_id = auth.uid();
# Should return user's girls unchanged

# 3. Test RLS on new table
# In Studio SQL Editor (as authenticated user):
SELECT * FROM referral_events WHERE referrer_user_id = auth.uid();
# Should return empty set (new user has no events yet)

# Try to access another user's events:
SELECT * FROM referral_events WHERE referrer_user_id = 'other-user-uuid';
# Should return empty set (RLS blocks access)

# 4. Test INSERT (service role only)
# This should fail if RLS is correct:
INSERT INTO referral_events (referrer_user_id, referee_user_id, event_type)
VALUES (auth.uid(), auth.uid(), 'signup');
# Expected: RLS blocks (no INSERT policy for users, only backend)

# 5. Start app and test existing functionality
npm run dev:api  # Terminal 1
npm run dev      # Terminal 2

# Test in browser:
# - Login ✓
# - View dashboard ✓
# - Add girl profile ✓
# - Add data entry ✓
# - View analytics ✓

# Check browser console: NO ERRORS
# Check terminal logs: NO ERRORS
```

**Red Flags (STOP if you see these):**

- ❌ Migration fails to apply
- ❌ `supabase db reset` hangs or times out
- ❌ Existing queries return empty results
- ❌ RLS policy allows cross-user data access
- ❌ Console errors about "relation does not exist"
- ❌ TypeScript errors about missing columns (expected - will fix in later stories)

**Rollback Procedure:**

```bash
# Option 1: Reset local database
supabase db reset

# Option 2: Drop new tables/columns manually
# In Studio SQL Editor:
DROP TABLE IF EXISTS public.referral_events;
ALTER TABLE public.users DROP COLUMN IF EXISTS growsurf_referral_code;
ALTER TABLE public.users DROP COLUMN IF EXISTS referred_by_code;
ALTER TABLE public.users DROP COLUMN IF EXISTS referral_credits_earned;
ALTER TABLE public.users DROP COLUMN IF EXISTS referral_credits_remaining;
ALTER TABLE public.users DROP COLUMN IF EXISTS referral_stats;

# Option 3: Delete migration file and start over
rm supabase/migrations/YYYYMMDDHHMMSS_add_referral_fields.sql
```

---

### Story 1.2: Referral Detection (DAY 2)

**Landmines:**

1. **GrowSurf SDK blocks page load:**
   - **Cause:** Synchronous loading or slow CDN response
   - **What happens:** Landing page hangs, white screen
   - **How to avoid:**
     - ALWAYS use `async defer` attributes on script tag
     - Test on throttled network (Chrome DevTools → Network → Slow 3G)
   - **If it happens:**
     ```html
     <!-- WRONG -->
     <script src="https://app.growsurf.com/growsurf.js"></script>

     <!-- RIGHT -->
     <script src="https://app.growsurf.com/growsurf.js" async defer></script>
     ```

2. **SessionStorage quota exceeded:**
   - **Cause:** Storing large objects in sessionStorage
   - **What happens:** Browser throws QuotaExceededError, referral context lost
   - **How to avoid:**
     - Keep referral context small (< 1KB)
     - Use try/catch around sessionStorage calls
   - **If it happens:**
     - Clear sessionStorage: `sessionStorage.clear()`
     - Reduce object size (only store essential data)

3. **Referral context lost on page refresh:**
   - **Cause:** Using localStorage instead of sessionStorage OR clearing too early
   - **What happens:** Users lose "1 week free" offer mid-signup
   - **How to avoid:**
     - Use sessionStorage (persists until browser tab closed)
     - Only clear context AFTER user enters app (not during signup)
   - **If it happens:**
     - Review clearReferralContext() calls
     - Only clear in Affiliate Step 3 after "Enter the App"

**Testing Checklist:**

```bash
# Test 1: URL param detection
# 1. Navigate to http://localhost:5173/?ref=TEST123
# 2. Open browser console
# 3. Run: sessionStorage.getItem('referral_context')
# Expected: {"isReferred":true,"referralCode":"TEST123",...}

# Test 2: Persistence
# 1. Navigate to http://localhost:5173/?ref=TEST123
# 2. Wait for page load (verify console log: "Referral detected: TEST123")
# 3. Navigate to http://localhost:5173/ (no ?ref param)
# 4. Run in console: sessionStorage.getItem('referral_context')
# Expected: Still returns {"isReferred":true,...}

# Test 3: GrowSurf SDK loading
# 1. Navigate to http://localhost:5173/
# 2. Open browser console
# 3. Run: window.growsurf
# Expected: Object with GrowSurf methods (init, getReferralData, etc.)
# If undefined: Check index.html script tag, check network tab for 404

# Test 4: Network throttling
# 1. Chrome DevTools → Network → Throttling → Slow 3G
# 2. Refresh page
# 3. Verify page loads (may be slow but shouldn't hang)
# 4. Verify GrowSurf SDK eventually loads (check console)

# Test 5: Existing functionality
# 1. Login, view dashboard, add data
# 2. Verify NO console errors related to referral utilities
```

**Red Flags:**

- ❌ Page hangs on load (white screen)
- ❌ GrowSurf SDK never loads (window.growsurf undefined after 10 seconds)
- ❌ SessionStorage errors in console
- ❌ Referral context lost on refresh
- ❌ Existing app features broken

---

### Story 1.5: Stripe Checkout API (DAY 5-6)

**Landmines:**

1. **Trial period doesn't apply:**
   - **Cause:** `trial_period_days` not passed to Stripe OR price object has trial disabled
   - **What happens:** Users charged immediately instead of 7 days later
   - **How to avoid:**
     - ALWAYS test in Stripe test mode first
     - Check Stripe Dashboard → Subscriptions → Verify trial_end timestamp
     - Use test card 4242 4242 4242 4242 (never charged in test mode)
   - **If it happens:**
     - Refund subscription immediately in Stripe Dashboard
     - Fix checkout API logic
     - Verify `trial_period_days: 7` in session creation

2. **Backward compatibility breaks:**
   - **Cause:** Making `referralContext` or `trialPeriodDays` required parameters
   - **What happens:** Existing checkout calls fail (SubscriptionPage, Step4, UpgradeModal)
   - **How to avoid:**
     - Make new parameters OPTIONAL with defaults:
       ```typescript
       const { referralContext, trialPeriodDays = 0 } = body;
       ```
     - Test ALL existing checkout entry points after changes
   - **If it happens:**
     - Add default values to parameters
     - Test each entry point manually

3. **Metadata not saved:**
   - **Cause:** Typo in metadata keys OR metadata too large (> 500 chars per value)
   - **What happens:** Webhook can't identify referred signups, credits not issued
   - **How to avoid:**
     - Check Stripe Dashboard → Subscriptions → Metadata tab
     - Keep metadata values short
     - Test webhook logic relies on exact key names
   - **If it happens:**
     - Fix metadata keys in checkout API
     - Test again with new subscription
     - Cannot retroactively add metadata to old subscriptions

4. **Success URL redirects to non-existent page:**
   - **Cause:** Typo in `/affiliate-step-1` route OR route not created yet
   - **What happens:** User completes payment, gets 404 error, confused and frustrated
   - **How to avoid:**
     - Create affiliate onboarding pages BEFORE testing checkout
     - OR temporarily redirect to placeholder page with "Coming soon" message
   - **If it happens:**
     - Create affiliate onboarding pages immediately
     - Update success_url in checkout API

**Testing Checklist:**

```bash
# Test 1: Standard checkout (backward compatibility)
# 1. Go through standard onboarding (Steps 1-4)
# 2. Choose Player Mode Weekly
# 3. Complete checkout with test card: 4242 4242 4242 4242
# 4. Verify Stripe Dashboard:
#    - Subscription created
#    - NO trial period (trial_end should be null)
#    - Status: active
#    - Amount: $1.99

# Test 2: Referred checkout (trial period)
# 1. Navigate to /?ref=TEST123
# 2. Sign up and reach checkout
# 3. Complete checkout with test card
# 4. Verify Stripe Dashboard:
#    - Subscription created
#    - trial_end: 7 days from now
#    - Status: trialing
#    - Amount: $1.99 (will be charged after trial)
#    - Metadata:
#      * referred_by_code: TEST123
#      * is_referral_signup: true

# Test 3: All checkout entry points
# Test each of these:
# - SubscriptionPage → Checkout → Works
# - Onboarding Step 4 → Choose tier → Checkout → Works
# - UpgradeModal (from paywall) → Checkout → Works
# - PaywallModal → Checkout → Works

# Test 4: Tier selection for referred users
# 1. Navigate to /?ref=TEST123
# 2. Sign up
# 3. At Stripe checkout, verify:
#    - Both options visible: Weekly $1.99 and Annual $27
#    - Both show "7 days free" messaging
#    - Clear text: "First charge: [date]"
# 4. Choose Annual option
# 5. Complete checkout
# 6. Verify subscription in Stripe:
#    - Price ID matches annual price
#    - Trial period still applied

# Test 5: Cancel checkout
# 1. Start referred checkout
# 2. Click "Back" or close Stripe tab
# 3. Verify redirects to cancel_url (landing page for referred, Step 4 for standard)
```

**Red Flags:**

- ❌ Trial period not applying (trial_end is null in Stripe)
- ❌ User charged immediately in test mode
- ❌ Metadata missing from subscription
- ❌ Success URL redirects to 404
- ❌ Existing checkout flows broken
- ❌ Error in Vercel logs: "Missing priceId" or "Invalid metadata"

**Emergency Rollback:**

```bash
# If checkout API breaks production:

# 1. Revert checkout route file
cp app/api/checkout/route.ts.backup app/api/checkout/route.ts

# 2. Redeploy immediately
git add app/api/checkout/route.ts
git commit -m "Revert checkout API changes"
git push

# 3. Vercel auto-deploys, should fix within 2-3 minutes

# 4. Refund any affected subscriptions in Stripe Dashboard
```

---

### Story 1.9: Webhook Enhancement (DAY 11+)

**Landmines:**

1. **Testing with real 7-day wait:**
   - **Cause:** Creating test subscription and waiting 7 days to see if webhook fires
   - **What happens:** Extremely slow iteration, can't test for a week
   - **How to avoid:**
     - Use Stripe CLI to simulate webhook events:
       ```bash
       stripe trigger invoice.payment_succeeded
       ```
     - Or manually fire webhook in Stripe Dashboard → Webhooks → Send test event
   - **If it happens:**
     - Don't wait! Use Stripe CLI immediately

2. **Webhook fires multiple times (idempotency issue):**
   - **Cause:** Stripe retries webhook if response is slow OR webhook handler doesn't use idempotency
   - **What happens:** Referrer gets multiple credits, duplicate events logged
   - **How to avoid:**
     - Use Stripe's idempotency key from event: `event.request.idempotency_key`
     - Check if event already processed:
       ```typescript
       const existing = await supabase
         .from('referral_events')
         .select('id')
         .eq('event_data->stripe_event_id', event.id)
         .single();

       if (existing.data) {
         console.log('Event already processed, skipping');
         return NextResponse.json({ received: true });
       }
       ```
   - **If it happens:**
     - Add idempotency check
     - Manually remove duplicate credit issuances in Stripe Dashboard

3. **Self-referral not blocked:**
   - **Cause:** Only checking email match, not payment method fingerprint
   - **What happens:** Users create multiple accounts with different emails but same card, refer themselves
   - **How to avoid:**
     - Check BOTH email AND payment method fingerprint:
       ```typescript
       const refereePaymentMethod = subscription.default_payment_method;
       const referrerPaymentMethod = await getPaymentMethodForUser(referrerUserId);

       if (refereePaymentMethod.fingerprint === referrerPaymentMethod.fingerprint) {
         console.log('Self-referral detected: same payment method');
         // Log as 'self_referral_blocked'
         // Do NOT issue credit
         return;
       }
       ```
   - **If it happens:**
     - Manually void credit in Stripe Dashboard
     - Add fingerprint checking

4. **Credit issuance fails silently:**
   - **Cause:** Stripe API error (e.g., customer not found, coupon creation fails) but webhook returns 200 OK
   - **What happens:** Referrer never gets credit, no one notices
   - **How to avoid:**
     - ALWAYS log credit issuance to `referral_events` with status
     - If Stripe API fails, log as 'failed' and alert admin
     - Return 500 error so Stripe retries
   - **If it happens:**
     - Check `referral_events` table for 'failed' events
     - Manually issue credit in Stripe Dashboard
     - Fix webhook logic

**Testing Checklist:**

```bash
# Test 1: Simulate webhook locally
stripe listen --forward-to localhost:3000/api/stripe/webhook

# In another terminal:
stripe trigger invoice.payment_succeeded --override invoice.subscription.metadata.is_referral_signup=true --override invoice.subscription.metadata.referred_by_code=TEST123

# Verify in logs:
# - Webhook received
# - Referrer looked up by code
# - Credit issued (Stripe API call)
# - Event logged to referral_events

# Test 2: Idempotency
# Fire same webhook twice (copy event ID from first test)
# Verify:
# - Second call logged but skipped
# - Only ONE credit issued

# Test 3: Self-referral blocking
# Create test subscription with:
# - Referee email: user1@example.com
# - Referrer email: user1@example.com (same)
# Fire webhook
# Verify:
# - Credit NOT issued
# - Event logged as 'self_referral_blocked'

# Test 4: Payment method fingerprint
# Create two users with different emails but same test card
# Fire webhook
# Verify:
# - Credit NOT issued
# - Event logged as 'self_referral_blocked'

# Test 5: First payment detection
# Create subscription with trial
# Fire invoice.payment_succeeded with invoice_number=0 (first invoice)
# Verify: Credit issued
# Fire again with invoice_number=1 (second invoice)
# Verify: Credit NOT issued (only first payment triggers reward)
```

**Red Flags:**

- ❌ Webhook fires but credit not issued (check Stripe API logs)
- ❌ Multiple credits issued for same referral
- ❌ Self-referrals not blocked
- ❌ Credits issued for second/third payments (not just first)
- ❌ Webhook returns error (check Stripe Dashboard → Webhooks → Failed attempts)

---

## 🌍 Cross-Domain Attribution Pitfalls

### The Challenge

Referral context must persist from `cost-per-nut.com` (marketing landing) to `app.cost-per-nut.com` (application) OR from any external link to your app.

### Safari's Intelligent Tracking Prevention (ITP)

**Problem:** Safari blocks third-party cookies and aggressively clears first-party cookies for domains identified as "trackers."

**Impact:** Referral attribution may fail for 30-40% of users (Safari users).

**Solutions:**

1. **Use GrowSurf SDK (first-party cookies):**
   - GrowSurf sets cookies on your domain
   - More reliable than third-party cookies
   - Still subject to ITP but less aggressive

2. **URL parameter forwarding:**
   - Always append `?ref=XXX` to links
   - Re-append on every page load if detected
   - Example: Landing CTA should include `?ref=` param when navigating to signup

3. **Server-side attribution:**
   - Store referral code in session (backend)
   - Associate with user account on signup
   - Most reliable but requires session management

**Testing Checklist:**

```bash
# Test 1: Chrome (baseline)
# 1. Navigate to http://cost-per-nut.com/?ref=TEST123
# 2. Click "Try for Free" (navigates to app.cost-per-nut.com/signup)
# 3. Complete signup
# 4. Verify referral_context persists through signup

# Test 2: Safari (strictest)
# 1. Repeat test in Safari
# 2. Open Web Inspector → Storage → Cookies
# 3. Verify GrowSurf cookies set
# 4. Complete signup
# 5. Verify attribution works

# Test 3: Firefox (Enhanced Tracking Protection)
# 1. Repeat test in Firefox
# 2. Verify attribution works

# Test 4: Private/Incognito mode
# 1. Repeat test in Chrome Incognito
# 2. Verify attribution works (more restrictive cookie policies)

# Test 5: Cross-device (bonus)
# 1. Click referral link on mobile
# 2. Start signup on mobile
# 3. Continue signup on desktop (different device)
# 4. Attribution will likely FAIL (expected - no easy solution)
```

**If Attribution Fails:**

1. Check GrowSurf dashboard for campaign health
2. Verify GrowSurf SDK loaded (`window.growsurf` exists)
3. Check browser console for cookie errors
4. Check sessionStorage for referral_context
5. Check URL for `?ref=` param throughout signup flow

---

## 🔥 What If Things Go VERY Wrong?

### Scenario 1: Migration Breaks Production Database

**Symptoms:**
- Users can't login
- Dashboard shows no data
- Console errors: "relation does not exist" or "column does not exist"

**Immediate Actions:**

1. **Roll back deployment:**
```bash
# In Vercel dashboard:
# Go to Deployments
# Find last working deployment
# Click "..." → Promote to Production
# This reverts code changes immediately
```

2. **Check if rollback fixes issue:**
   - If yes: Migration was bad, but code rollback restored functionality
   - If no: Database is corrupted, proceed to Step 3

3. **Restore database backup:**
```bash
# In Supabase Dashboard:
# Go to Database → Backups
# Find "pre-referral-migration-YYYY-MM-DD"
# Click "Restore"
# WARNING: This will ERASE all data created since backup
# Confirm restoration

# Wait 5-10 minutes for restore to complete
# Test app immediately
```

4. **Notify users:**
   - If downtime > 15 minutes, post status update
   - If data lost, communicate timeline for recovery

5. **Post-mortem:**
   - Document exactly what broke
   - Test fix on local Supabase
   - Test fix on staging
   - Do NOT retry on production until 100% confident

---

### Scenario 2: Referral Credits Issued Incorrectly

**Symptoms:**
- Users report receiving credits they didn't earn
- Users report NOT receiving credits they should have earned
- Admin dashboard shows inflated referral numbers

**Immediate Actions:**

1. **Disable webhook processing:**
```bash
# In /app/api/stripe/webhook/route.ts:
export async function POST(request: NextRequest) {
  // EMERGENCY: Disable credit issuance
  return NextResponse.json({ received: true });
}

# Redeploy immediately
```

2. **Audit referral_events table:**
```sql
-- Find suspicious events
SELECT *
FROM referral_events
WHERE event_type = 'credit_issued'
AND created_at > '2025-10-12'  -- Since feature launched
ORDER BY created_at DESC;

-- Check for duplicate credits
SELECT referee_user_id, COUNT(*)
FROM referral_events
WHERE event_type = 'credit_issued'
GROUP BY referee_user_id
HAVING COUNT(*) > 1;
```

3. **Manually fix affected accounts:**
   - For users who received too many credits:
     - Go to Stripe Dashboard
     - Find customer → Coupons/Credits
     - Remove excess credits
   - For users who didn't receive credits:
     - Manually issue credit in Stripe Dashboard
     - Log to referral_events table

4. **Fix webhook logic:**
   - Identify root cause (check logs, test locally)
   - Fix and test extensively with Stripe CLI
   - Deploy fix with feature flag OFF
   - Monitor for 24 hours
   - Re-enable webhook processing

---

### Scenario 3: Feature Flag Doesn't Work

**Symptoms:**
- Set `ENABLE_REFERRAL_PROGRAM=false` but feature still active
- Referral banners showing to all users
- Affiliate flow accessible

**Root Cause:**
- Environment variable not deployed (Vercel cache issue)
- OR code doesn't check feature flag consistently

**Immediate Actions:**

1. **Verify environment variable in Vercel:**
```bash
# Go to Vercel Dashboard → Settings → Environment Variables
# Check ENABLE_REFERRAL_PROGRAM value
# If incorrect, update and force redeploy:
vercel --prod --force
```

2. **Add feature flag checks to critical paths:**
```typescript
// In every referral-related component:
const REFERRAL_ENABLED = import.meta.env.VITE_ENABLE_REFERRAL_PROGRAM === 'true' ||
                          process.env.NEXT_PUBLIC_ENABLE_REFERRAL_PROGRAM === 'true';

if (!REFERRAL_ENABLED) {
  return null; // Don't render referral features
}
```

3. **Deploy feature flag checks immediately:**
   - Wrap Landing page, Refer & Earn, Affiliate Onboarding in flag checks
   - If flag is false, return null or redirect to standard flow

---

## 📊 Monitoring & Health Checks

### Daily Health Checks (First 2 Weeks Post-Launch)

**Morning (9am):**
- Check Vercel logs for errors (filter for "referral", "growsurf", "checkout")
- Check Stripe Dashboard → Webhooks → Recent attempts (any failures?)
- Check Supabase logs for query errors
- Check `referral_events` table row count (should be increasing daily)

**Evening (6pm):**
- Check referral signup rate (how many new signups via referral today?)
- Check trial-to-paid conversion (any trials ending today? Did they convert?)
- Check for self-referral blocks (any suspicious patterns?)

### Weekly Metrics Review

- Total referrals: `SELECT COUNT(*) FROM users WHERE referred_by_code IS NOT NULL`
- Credits issued: `SELECT COUNT(*) FROM referral_events WHERE event_type = 'credit_issued'`
- Credits voided: `SELECT COUNT(*) FROM referral_events WHERE event_type = 'credit_voided'`
- Self-referrals blocked: `SELECT COUNT(*) FROM referral_events WHERE event_type = 'self_referral_blocked'`
- GrowSurf dashboard: Campaign performance, click-through rate, conversion rate

### Red Flags to Watch For

- ⚠️ Referral signup rate drops below 5% (may indicate attribution broken)
- ⚠️ Trial-to-paid conversion below 50% (may indicate poor onboarding experience)
- ⚠️ High self-referral block rate (may indicate abuse attempts)
- ⚠️ Webhook failure rate > 1% (may indicate backend issues)
- ⚠️ GrowSurf API errors in logs (may indicate SDK misconfiguration)

---

## 🚦 Go-Live Checklist

Before enabling `ENABLE_REFERRAL_PROGRAM=true` in production:

### Code Quality
- [ ] All stories completed and tested locally
- [ ] All stories tested on staging
- [ ] TypeScript errors: 0 (`npm run typecheck`)
- [ ] ESLint errors: 0 (`npm run lint`)
- [ ] No console.log() left in production code

### Database Safety
- [ ] Migration tested on local Supabase (reset 3+ times successfully)
- [ ] Migration tested on staging Supabase (48+ hours stable)
- [ ] Production backup created manually (name: pre-referral-migration-YYYY-MM-DD)
- [ ] Rollback procedure documented and tested

### Stripe Integration
- [ ] Test mode fully tested (10+ test subscriptions created)
- [ ] Webhook tested with Stripe CLI (simulate all event types)
- [ ] Credit issuance tested (verify in Stripe Dashboard)
- [ ] Self-referral blocking tested (email AND payment method)
- [ ] Production webhook endpoint configured in Stripe Dashboard
- [ ] Webhook secret added to Vercel environment variables

### GrowSurf Integration
- [ ] Production campaign created in GrowSurf
- [ ] API keys added to Vercel environment variables
- [ ] SDK loads without errors (test on production domain)
- [ ] Referral link generation tested (verify links work)

### Cross-Domain Testing
- [ ] Attribution tested on Chrome (desktop + mobile)
- [ ] Attribution tested on Safari (desktop + mobile)
- [ ] Attribution tested on Firefox
- [ ] Attribution tested in private/incognito mode

### Performance
- [ ] Lighthouse score ≥ 90 (landing page)
- [ ] Page load time < 2 seconds (with GrowSurf SDK)
- [ ] No memory leaks (Chrome DevTools Performance tab)
- [ ] Mobile responsive (test 375px, 768px, 1024px)

### Monitoring
- [ ] Vercel logging configured
- [ ] Supabase logging reviewed (no errors)
- [ ] Stripe Dashboard checked (no failed webhooks)
- [ ] GrowSurf Dashboard accessible and showing data

### Team Readiness
- [ ] Team trained on Refer & Earn page location
- [ ] Team trained on Admin Analytics dashboard
- [ ] Support team has referral program FAQ
- [ ] Rollback procedure documented and shared

### Legal/Compliance (Optional but Recommended)
- [ ] Terms of Service updated (mention referral program)
- [ ] Privacy Policy updated (mention GrowSurf integration)
- [ ] Referral program rules clearly stated on Refer & Earn page

---

## 🎯 Key Takeaways

1. **ALWAYS test migrations locally first** - Supabase doesn't have automatic rollbacks
2. **NEVER skip staging** - Production is not the place to discover bugs
3. **Feature flags are your friend** - Deploy with flags OFF, enable gradually
4. **Test after EVERY story** - Don't batch multiple stories before testing
5. **Cross-browser testing is CRITICAL** - Safari ITP will break attribution if not handled
6. **Stripe test mode is your sandbox** - Use it liberally, never test on production first
7. **Webhook testing with Stripe CLI** - Don't wait 7 days to test, simulate events
8. **Monitor daily post-launch** - First 2 weeks are critical for catching issues early
9. **Document everything** - Future you (or team members) will thank you
10. **When in doubt, rollback** - It's better to delay launch than break production

---

## 📚 Additional Resources

- **Supabase Local Development:** [https://supabase.com/docs/guides/cli/local-development](https://supabase.com/docs/guides/cli/local-development)
- **Supabase Branching (Staging):** [https://supabase.com/docs/guides/platform/branching](https://supabase.com/docs/guides/platform/branching)
- **Stripe CLI Webhook Testing:** [https://stripe.com/docs/stripe-cli/webhooks](https://stripe.com/docs/stripe-cli/webhooks)
- **Safari ITP Guide:** [https://webkit.org/blog/category/privacy/](https://webkit.org/blog/category/privacy/)
- **GrowSurf Documentation:** [https://docs.growsurf.com](https://docs.growsurf.com)

---

**Remember:** The landmines are numerous, but they're all avoidable with careful testing and gradual rollout. When in doubt, test locally first, then staging, then production with feature flags OFF. You've got this! 🚀
