# GrowSurf Simplified Implementation Plan
**Version:** 1.0 (Simplified)
**Date:** 2025-10-18
**Status:** Active Implementation Plan

---

## Overview

This is a **simplified version** of the full GrowSurf referral program PRD. Instead of building separate affiliate onboarding pages, we're reusing existing components and keeping the implementation minimal while still delivering core referral functionality.

---

## Simplified User Flows

### Flow 1: Referred User (New Simplified Flow)

```
/share?ref=XXX (Landing page with "1 week free" banner)
    ↓ Click "Get 1 Week Free"
/signup (Sign Up page - visible to all users)
    ↓ Create account
Stripe Checkout (7-day trial, Weekly plan pre-selected)
    ↓ Complete payment
/welcome-premium (Skip onboarding entirely)
    ↓ Click "Enter App"
Dashboard (Player Mode, 7-day trial active)
```

**Key Differences from Full PRD:**
- ✅ Uses single `/signup` page (not embedded in Step 3)
- ✅ Skips onboarding entirely (straight to `/welcome-premium`)
- ✅ Weekly plan pre-selected (no tier choice at checkout)
- ✅ No affiliate-specific onboarding pages (Stories 1.6 removed)

---

### Flow 2: Non-Referred User (Unchanged)

```
/ (Home page)
    ↓ Click "Try for Free"
/step-1 (Add Girl)
    ↓
/step-2 (Add Data)
    ↓
/step-3 (Sign Up - Create Account)
    ↓
/step-4 (Choose Tier: Boyfriend Mode FREE or Player Mode PAID)
    ↓
If Boyfriend Mode → /welcome → Dashboard (Free tier)
If Player Mode → Stripe Checkout → /welcome-premium → Dashboard (Paid tier)
```

**No changes** to existing onboarding flow. `/signup` page may be accessible but not promoted - most traffic goes to `/step-1`.

---

### Flow 3: Existing User Gets Referral Link

```
Dashboard (Logged in)
    ↓ Click "Refer & Earn" in sidebar
/refer (Refer & Earn page)
    ↓ View referral link
Copy link / Share via social buttons
```

---

## Implementation Timeline

### Phase 1: Tonight (Prep Work - 30 minutes)

**Goal:** Set up foundational tools and accounts without writing code.

1. ✅ **Finish GrowSurf Account Setup**
   - Campaign type: SaaS
   - Campaign name: "CPN Give 1 / Get 1"
   - Copy API keys (Publishable + Secret)

2. ✅ **Start Local Supabase**
   - Restart computer
   - Open Docker Desktop
   - Run `supabase start` in project directory
   - Verify Supabase Studio opens at `http://127.0.0.1:54323`

3. ✅ **Optional: Skim Landmines Doc** (10 min)
   - Read `docs/growsurf/landmines.md` sections on database safety

---

### Phase 2: Tomorrow Morning (Implementation - 5 hours)

**Goal:** Build and deploy core referral functionality.

#### Hour 1: Database Foundation (Story 1.1)

**Tasks:**
1. Create migration file: `supabase migration new add_referral_fields`
2. Add SQL to migration (see schema below)
3. Test migration on local Supabase: `supabase db reset`
4. If successful, apply to production: `supabase db push`

**Database Schema Changes:**

```sql
-- Add columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS growsurf_referral_code TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referred_by_code TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_credits_earned INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_credits_remaining INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_stats JSONB DEFAULT '{}'::jsonb;

-- Create referral_events table for audit log
CREATE TABLE IF NOT EXISTS public.referral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own referral events" ON public.referral_events
  FOR SELECT USING (
    auth.uid() = referrer_user_id OR auth.uid() = referee_user_id
  );
```

**Verification:**
- Open Supabase Studio: `http://127.0.0.1:54323`
- Check `users` table has new columns
- Check `referral_events` table exists
- Run test query: `SELECT * FROM users;`

---

#### Hour 2: Referral Detection + Landing Page (Stories 1.2-1.3)

**Tasks:**

1. **Create Referral Utilities** (`src/lib/referral/utils.ts`):
   - `detectReferralContext()` - Checks URL for `?ref=` param
   - `persistReferralContext()` - Saves to sessionStorage
   - `getReferralContext()` - Retrieves from sessionStorage
   - `clearReferralContext()` - Clears sessionStorage

2. **Create GrowSurf Integration** (`src/lib/referral/growsurf.ts`):
   - `initializeGrowSurf()` - Loads GrowSurf SDK
   - `generateReferralLink()` - Creates unique link for user
   - `trackReferralEvent()` - Logs events to GrowSurf

3. **Add GrowSurf SDK to HTML** (`index.html`):
   ```html
   <script src="https://app.growsurf.com/growsurf.js" async defer></script>
   ```

4. **Create Landing Page** (`src/pages/Share.tsx`):
   - Conditional banner: "You were invited to CPN — get 1 week free!"
   - Hero section with value proposition
   - CTA button: "Get 1 Week Free" → redirects to `/signup`
   - Mobile-responsive, matches CPN design system

5. **Update Routing** (`src/App.tsx`):
   - Add route: `/share` → renders `Share.tsx`
   - Run referral detection on app initialization

**Verification:**
- Navigate to `http://localhost:5173/share?ref=TEST123`
- Banner displays "1 week free" message
- Click CTA → redirects to `/signup`
- Check sessionStorage: `sessionStorage.getItem('referral_context')`
- Should show: `{"isReferred":true,"referralCode":"TEST123",...}`

---

#### Hour 3: Signup Enhancement (Story 1.4)

**Tasks:**

1. **Remove `/signup` Redirect** (`src/App.tsx`):
   - Delete or comment out lines 152-157:
     ```typescript
     // REMOVE THIS:
     // useEffect(() => {
     //   if (!user && pathname === '/signup') {
     //     goTo('/step-1');
     //   }
     // }, [user, pathname]);
     ```

2. **Modify SignUp Component** (`src/pages/SignUp.tsx`):
   - Import: `import { getReferralContext, clearReferralContext } from '../lib/referral/utils';`
   - After successful signup:
     ```typescript
     const referralContext = getReferralContext();
     if (referralContext?.isReferred) {
       // Save referred_by_code to database
       await supabase
         .from('users')
         .update({ referred_by_code: referralContext.referralCode })
         .eq('id', newUser.id);

       // Redirect to Stripe checkout
       window.location.href = '/api/checkout?ref=true';
     } else {
       // Normal flow: redirect to step-1
       goTo('/step-1');
     }
     ```
   - Optional: Add "1 week free" banner when `isReferred` is true

**Verification:**
- Navigate to `/share?ref=TEST123`
- Click "Get 1 Week Free" → lands on `/signup`
- Fill out signup form, create account
- Should redirect to Stripe checkout (not `/step-1`)
- Check database: `referred_by_code` column populated with "TEST123"

---

#### Hour 4: Stripe Checkout with Trial (Story 1.5)

**Tasks:**

1. **Modify Checkout API** (`app/api/checkout/route.ts`):
   - Add parameters: `referralContext`, `trialPeriodDays`
   - Detect `?ref=true` query param from signup redirect
   - If referred:
     ```typescript
     const session = await stripe.checkout.sessions.create({
       mode: 'subscription',
       payment_method_types: ['card'],
       line_items: [{
         price: process.env.VITE_STRIPE_PRICE_PLAYER_MODE_WEEKLY, // Weekly plan
         quantity: 1,
       }],
       subscription_data: {
         trial_period_days: 7,
         metadata: {
           is_referral_signup: 'true',
           referred_by_code: referralContext.referralCode,
         },
       },
       success_url: `${origin}/welcome-premium`,
       cancel_url: `${origin}/share`,
       // ... rest of config
     });
     ```
   - Ensure backward compatibility for non-referred users

2. **Environment Variables** (`.env.local`):
   ```bash
   NEXT_PUBLIC_GROWSURF_API_KEY=your_growsurf_public_key
   GROWSURF_SECRET_KEY=your_growsurf_secret_key
   NEXT_PUBLIC_REFERRAL_TRIAL_DAYS=7
   ```

**Verification:**
- Complete referred signup flow
- Stripe checkout should show:
  - Player Mode Weekly: $1.99/week
  - "Your trial ends on [date 7 days from now]"
  - Total due today: $0.00
- Complete checkout with test card: `4242 4242 4242 4242`
- Check Stripe Dashboard:
  - Subscription created
  - Status: "trialing"
  - Trial end: 7 days from now
  - Metadata: `is_referral_signup: true`, `referred_by_code: TEST123`
- After checkout, redirects to `/welcome-premium`

---

#### Hour 5: Refer & Earn Page (Story 1.7)

**Tasks:**

1. **Create API Route** (`app/api/referral/stats/route.ts`):
   ```typescript
   export async function GET(request: NextRequest) {
     const session = await getSession(request);
     if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

     const user = await getUserFromSession(session);

     // Fetch stats from database
     const { data: stats } = await supabase
       .from('referral_events')
       .select('*')
       .eq('referrer_user_id', user.id);

     // Return aggregated stats
     return NextResponse.json({
       totalClicks: stats?.filter(e => e.event_type === 'click').length || 0,
       paidReferrals: stats?.filter(e => e.event_type === 'payment').length || 0,
       creditsEarned: user.referral_credits_earned || 0,
       creditsRemaining: user.referral_credits_remaining || 0,
       referralLink: `https://app.cost-per-nut.com/share?ref=${user.growsurf_referral_code}`,
     });
   }
   ```

2. **Create Refer & Earn Page** (`src/pages/ReferAndEarn.tsx`):
   - Heading: "Give 1 Week, Get 1 Week"
   - Referral link display with copy button
   - Share buttons: SMS, WhatsApp, X, TikTok
   - Stats cards:
     - Total Clicks
     - Paid Referrals
     - Free Weeks Earned
     - Free Weeks Remaining
   - "How it works" section with program rules

3. **Add to Navigation** (`src/App.tsx`):
   - Add sidebar item:
     ```tsx
     <div className={`sidebar-item ${activeView === 'refer' ? 'active' : ''}`}
          onClick={() => setActiveView('refer')}>
       <Share2 size={20} />
       <span>Refer & Earn</span>
     </div>
     ```
   - Add routing:
     ```typescript
     {activeView === 'refer' && <ReferAndEarn />}
     ```

**Verification:**
- Log in to dashboard
- Click "Refer & Earn" in sidebar
- Page loads with:
  - Personal referral link: `https://app.cost-per-nut.com/share?ref=ABC123`
  - Copy button (click to copy link)
  - Share buttons with platform-specific URLs
  - Stats cards (all zeros initially)
- Click copy button → link copied to clipboard
- Toast notification appears: "Link copied!"

---

## What We're Skipping (For Later)

### Story 1.6: Affiliate Onboarding Pages
**Why skipped:** Referred users skip onboarding entirely and go straight to `/welcome-premium`. No need for separate affiliate pages.

### Story 1.8: Onboarding Nudge
**Why skipped:** Nice-to-have, not critical for MVP. Can add later as polish.

### Story 1.9: Webhook Credit Issuance
**Why skipped:** No users yet, so no credits to issue. Will implement when we have real paying referred users.

### Story 1.10: Admin Analytics Dashboard
**Why skipped:** Not urgent for launch. Can manually check database for now.

---

## Environment Variables Required

Add these to `.env.local` (development) and Vercel (production):

```bash
# GrowSurf
NEXT_PUBLIC_GROWSURF_API_KEY=grsf_your_public_key_here
GROWSURF_SECRET_KEY=grsf_your_secret_key_here

# Referral Config
NEXT_PUBLIC_REFERRAL_TRIAL_DAYS=7
NEXT_PUBLIC_REFERRAL_CREDIT_WEEKS=1
ENABLE_REFERRAL_PROGRAM=true

# Existing Stripe Variables (ensure these exist)
VITE_STRIPE_PRICE_PLAYER_MODE_WEEKLY=price_your_weekly_price_id
STRIPE_SECRET_KEY=sk_test_your_key_here
```

---

## Testing Checklist

### End-to-End Referred User Flow
- [ ] Navigate to `/share?ref=TEST123`
- [ ] See "1 week free" banner
- [ ] Click "Get 1 Week Free" → lands on `/signup`
- [ ] Fill signup form → create account
- [ ] Redirects to Stripe checkout
- [ ] See 7-day trial messaging
- [ ] Complete checkout with test card `4242 4242 4242 4242`
- [ ] Redirects to `/welcome-premium`
- [ ] Click "Enter App" → lands in dashboard as Player Mode
- [ ] Verify in Stripe Dashboard: subscription exists with 7-day trial

### End-to-End Non-Referred User Flow (Regression Test)
- [ ] Navigate to `/` (home page)
- [ ] Click "Try for Free" → lands on `/step-1`
- [ ] Complete Steps 1-2-3-4
- [ ] Choose Boyfriend Mode → lands in dashboard (Free tier)
- [ ] OR choose Player Mode → Stripe checkout → dashboard (Paid tier)

### Refer & Earn Page
- [ ] Log in to dashboard
- [ ] Click "Refer & Earn" → page loads
- [ ] See personal referral link
- [ ] Click copy button → link copied
- [ ] Click share buttons → proper URLs generated

### Database Verification
- [ ] Open Supabase Studio
- [ ] Check `users` table has new referral columns
- [ ] Check `referral_events` table exists and logs events
- [ ] Verify referred user has `referred_by_code` populated

---

## Rollback Plan (If Things Break)

### Database Rollback
If migration breaks production:
```sql
-- Drop new table
DROP TABLE IF EXISTS public.referral_events;

-- Remove new columns
ALTER TABLE public.users DROP COLUMN IF EXISTS growsurf_referral_code;
ALTER TABLE public.users DROP COLUMN IF EXISTS referred_by_code;
ALTER TABLE public.users DROP COLUMN IF EXISTS referral_credits_earned;
ALTER TABLE public.users DROP COLUMN IF EXISTS referral_credits_remaining;
ALTER TABLE public.users DROP COLUMN IF EXISTS referral_stats;
```

### Code Rollback
If referral flow breaks normal signup:
1. Re-add `/signup` redirect in `App.tsx` (lines 152-157)
2. Remove referral detection from `SignUp.tsx`
3. Revert Stripe checkout API changes
4. Git revert to last working commit

---

## Success Metrics (Week 1)

**Acquisition:**
- [ ] At least 1 referred signup completes (proof of concept)
- [ ] Referral attribution works (referred_by_code saved correctly)
- [ ] Trial period applies correctly (7 days, $0 charge on day 1)

**Technical:**
- [ ] No errors in Vercel logs related to referral flow
- [ ] No regressions in normal onboarding flow
- [ ] Stripe subscriptions created with correct metadata

**Engagement:**
- [ ] Existing users visit Refer & Earn page
- [ ] At least 1 referral link copied and shared

---

## Future Enhancements (Post-Launch)

### Story 1.9: Webhook Credit Issuance (2-3 hours)
**When:** After you have 5+ referred users who completed trials
**What:** Detect when referee's trial ends and first payment succeeds → issue 1-week credit to referrer

### Story 1.10: Admin Analytics Dashboard (2-3 hours)
**When:** After you have 10+ referrals
**What:** Dashboard to view referral pairs, conversion rates, credit issuance status

### Story 1.8: Onboarding Nudge (1 hour)
**When:** After core flow is validated
**What:** Post-payment modal encouraging users to share their referral link

### Phase II/III: Leaderboard Referral Integration (4-6 hours)
**When:** After Phase I validated for 2+ weeks
**What:** Append referral codes to leaderboard invite links for viral acceleration

---

## Notes and Decisions

**Decision 1: Skip Affiliate Onboarding**
- Original PRD had separate 3-step affiliate onboarding
- Simplified: Referred users skip onboarding entirely → `/welcome-premium`
- Rationale: Faster conversion, less code duplication

**Decision 2: Single Signup Page**
- Original PRD embedded signup in onboarding Step 3
- Simplified: `/signup` is accessible to all users
- Rationale: Cleaner routing, easier to maintain

**Decision 3: Weekly Plan Only**
- Original PRD offered tier selection at checkout for referred users
- Simplified: Weekly plan ($1.99/week) pre-selected
- Rationale: Simpler UX, lower barrier to entry

**Decision 4: No Immediate Webhook**
- Original PRD implemented webhook in Phase I
- Simplified: Defer webhook until real users exist
- Rationale: No users yet, can test manually first

---

## Contact and Support

**GrowSurf Documentation:** https://docs.growsurf.com
**Stripe Trial Periods:** https://stripe.com/docs/billing/subscriptions/trials
**Supabase Local Development:** https://supabase.com/docs/guides/cli/local-development

---

**End of Simplified Implementation Plan**
