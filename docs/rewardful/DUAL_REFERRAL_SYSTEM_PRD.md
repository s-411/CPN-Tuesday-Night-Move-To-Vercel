# CPN Dual Referral System - Complete Implementation Plan
**Version:** 3.0 (Dual Campaign Architecture)
**Date:** 2025-10-18
**Status:** Ready for Implementation
**Platform:** Rewardful ($99/month Growth Plan)
**Author:** Product Requirements Document

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [Campaign Definitions](#campaign-definitions)
4. [User Flows](#user-flows)
5. [Current Implementation Status](#current-implementation-status)
6. [Implementation Phases](#implementation-phases)
7. [Database Schema](#database-schema)
8. [API Endpoints](#api-endpoints)
9. [Testing Plan](#testing-plan)
10. [Rollback Strategy](#rollback-strategy)
11. [Success Metrics](#success-metrics)

---

## Executive Summary

### The Problem
CPN needs two distinct referral programs:
1. **Influencer affiliates** who drive large volume and earn cash commissions
2. **Regular users** who casually refer friends and earn subscription credits

### The Solution
Implement a dual-campaign Rewardful integration:

**Campaign 1: Influencer Affiliate Program**
- Manual signup via Rewardful portal
- 50% cash commission on ALL payments forever
- Payouts via Wise/PayPal (manual)
- Referees get 3-day free trial

**Campaign 2: Refer-a-Friend Program**
- Automatic signup (every user becomes affiliate)
- "Give 1 week / Get 1 week" credit system
- NO cash payouts, only subscription time
- Referees get 7-day free trial

### Key Constraints
- Influencer referrals do NOT participate in friend credit system
- Users on free tier (Boyfriend Mode) cannot earn credits (no Stripe subscription to extend)
- Credits auto-apply by extending subscription end date
- Referrer earns credit only when referee's FIRST payment clears (prevents gaming)

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    REWARDFUL                             │
├──────────────────────┬──────────────────────────────────┤
│  Campaign 1          │  Campaign 2                      │
│  "Influencer"        │  "Refer-a-Friend"                │
│  ID: 09b73953...     │  ID: [TO BE CREATED]             │
│  Commission: 50%     │  Commission: $0                  │
└──────────────────────┴──────────────────────────────────┘
           │                         │
           ▼                         ▼
┌──────────────────────────────────────────────────────────┐
│              REFERRAL DETECTION LAYER                     │
│  - Rewardful SDK detects ?via=XXX param                 │
│  - Stores referral ID in cookie + sessionStorage        │
└──────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│                 SIGNUP FLOW ROUTER                        │
│  IF influencer referral → 3-day trial, track to Camp 1  │
│  IF friend referral → 7-day trial, track to Camp 2      │
│  IF organic → 7-day trial, auto-create affiliate        │
└──────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│              STRIPE CHECKOUT + WEBHOOKS                   │
│  - Create subscription with trial                        │
│  - Store metadata: campaign_id, referral_id, referrer_id│
│  - On first payment: trigger credit issuance (Camp 2)   │
└──────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│              CREDIT APPLICATION SYSTEM                    │
│  - Detect earned credits in database                    │
│  - Extend subscription_end_date by 7 days * credits     │
│  - Update credits_remaining counter                     │
│  - Show notification to user                            │
└──────────────────────────────────────────────────────────┘
```

---

## Campaign Definitions

### Campaign 1: Influencer Affiliate Program

**Campaign Settings in Rewardful:**
```yaml
Campaign Name: "CPN Influencer Program"
Campaign ID: 09b73953-9a70-4673-b97f-1e82983b4e3d
Campaign URL: https://app.cost-per-nut.com
Commission Type: Recurring percentage
Commission Rate: 50%
Commission Duration: Lifetime
Cookie Window: 60 days
Referee Reward: 3-day trial (handled in code, NOT Rewardful)
```

**How It Works:**

1. **Influencer Onboarding:**
   - Influencer goes to Rewardful portal (manual)
   - Creates account, gets approved
   - Receives referral token (e.g., `luke`)
   - Referral link: `https://app.cost-per-nut.com/?via=luke`

2. **When Someone Uses Influencer Link:**
   - Rewardful SDK detects `?via=luke`
   - Sets cookie with referral ID
   - User signs up → gets 3-day free trial
   - Stripe subscription created with metadata:
     ```json
     {
       "campaign_id": "09b73953-9a70-4673-b97f-1e82983b4e3d",
       "referral_id": "luke",
       "trial_days": 3,
       "is_influencer_referral": "true"
     }
     ```
   - User does NOT become auto-affiliate (manually created in Rewardful)
   - User does NOT earn credits from referring others

3. **Influencer Earning:**
   - When referee makes ANY payment (trial end, recurring, etc.)
   - Rewardful automatically tracks commission: 50% × payment amount
   - Influencer sees earnings in Rewardful dashboard
   - Admin manually pays out via Wise/PayPal monthly/quarterly

4. **Example Calculation:**
   ```
   Luke refers 100 users → 50 convert to paid ($1.99/week)
   Weekly commission: 50 × $1.99 × 50% = $49.75/week
   Annual commission: $49.75 × 52 = $2,587/year
   ```

---

### Campaign 2: Refer-a-Friend Program

**Campaign Settings in Rewardful:**
```yaml
Campaign Name: "CPN Refer-a-Friend"
Campaign ID: [TO BE CREATED]
Campaign URL: https://app.cost-per-nut.com/share
Commission Type: Custom reward (tracked in code)
Commission Rate: $0.00 (we handle rewards ourselves)
Commission Duration: N/A
Cookie Window: 30 days (shorter for friends)
Referee Reward: 7-day trial
Referrer Reward: 7 days subscription credit (handled in code)
```

**How It Works:**

1. **User Onboarding (Auto-Affiliate Creation):**
   - User signs up organically (no referral)
   - Our API automatically creates them as Rewardful affiliate
   - API call:
     ```typescript
     POST https://api.getrewardful.com/v1/affiliates
     {
       "email": "john@example.com",
       "campaign_id": "[CAMPAIGN_2_ID]",
       "state": "active",
       "token": "a1b2c3d4" // First 8 chars of Supabase UUID
     }
     ```
   - Rewardful returns affiliate ID + referral link
   - We save to database:
     ```sql
     UPDATE users SET
       rewardful_affiliate_id = 'aff_xyz',
       rewardful_referral_link = 'https://app.cost-per-nut.com/share?via=a1b2c3d4'
     WHERE id = 'user-uuid';
     ```

2. **When Friend Uses Referral Link:**
   - Friend clicks `https://app.cost-per-nut.com/share?via=a1b2c3d4`
   - Lands on `/share` page with yellow banner: "🎉 You're getting 1 week free!"
   - Clicks "Get 1 Week Free" → `/signup` page
   - Signs up → Rewardful SDK tracks conversion
   - Redirects to Stripe checkout with 7-day trial
   - Database update:
     ```sql
     UPDATE users SET
       referred_by_affiliate_id = 'a1b2c3d4'
     WHERE id = 'new-user-uuid';
     ```

3. **Credit Issuance (When Friend's First Payment Clears):**
   - Day 7: Trial ends, Stripe charges first payment
   - Stripe webhook: `invoice.payment_succeeded`
   - Check if this is first payment after trial:
     ```typescript
     if (subscription.status === 'active' &&
         invoice.billing_reason === 'subscription_cycle' &&
         subscription.metadata.is_referral_signup === 'true') {
       // This is the first post-trial payment
       const referrerId = subscription.metadata.referrer_id;

       // Award 7 days credit to referrer
       await supabase.from('users').update({
         referral_credits_earned: referrer.referral_credits_earned + 1,
         referral_credits_remaining: referrer.referral_credits_remaining + 1
       }).eq('id', referrerId);
     }
     ```

4. **Credit Application (Auto-Extend Subscription):**
   - When referrer's next billing cycle occurs
   - Stripe webhook: `invoice.created` (before charging)
   - Check if user has credits available:
     ```typescript
     if (user.referral_credits_remaining > 0) {
       // Extend subscription end date by 7 days
       const currentEnd = new Date(subscription.current_period_end);
       const newEnd = new Date(currentEnd.getTime() + 7 * 24 * 60 * 60 * 1000);

       await stripe.subscriptions.update(subscription.id, {
         trial_end: Math.floor(newEnd.getTime() / 1000)
       });

       // Decrement credits
       await supabase.from('users').update({
         referral_credits_remaining: user.referral_credits_remaining - 1
       }).eq('id', user.id);

       // Show notification
       await sendNotification(user.id, "You saved $1.99 this week!");
     }
     ```

5. **Example Calculation:**
   ```
   John refers 5 friends
   3 friends complete trial and become paying customers
   John earns: 3 × 7 days = 21 days free (3 weeks)
   Value: 3 × $1.99 = $5.97 saved
   ```

---

### Critical Distinction: Influencer vs Friend Referrals

| Aspect | Influencer Referral | Friend Referral |
|--------|---------------------|-----------------|
| **Referral Link** | `?via=luke` | `?via=a1b2c3d4` |
| **Campaign ID** | 09b73953-... | [CAMPAIGN_2_ID] |
| **Referee Trial** | 3 days | 7 days |
| **Referrer Reward** | 50% cash commission | 7 days subscription credit |
| **Referee Becomes Affiliate?** | NO | YES (auto-created) |
| **Payout Method** | Manual (Wise/PayPal) | Auto (subscription extension) |
| **Can Referee Earn Credits?** | NO | YES (if they refer others) |
| **Tracked in Rewardful?** | YES (commission) | YES (conversion only, $0 commission) |

---

## User Flows

### Flow 1: Influencer Refers Someone (Luke → Alice)

```
1. Luke signs up at Rewardful portal (manual)
   ↓
2. Luke gets link: https://app.cost-per-nut.com/?via=luke
   ↓
3. Alice clicks Luke's link
   ↓
4. Lands on /share with banner: "Get 3 days free" (less than friend referral)
   ↓
5. Alice clicks "Try for Free" → /signup
   ↓
6. Alice creates account
   ↓ [CRITICAL: Check if influencer referral]
7. System detects campaign_id = 09b73953... (Influencer campaign)
   ↓
8. Alice redirects to Stripe checkout (3-day trial, NOT 7)
   ↓
9. Alice completes checkout
   ↓
10. Stripe subscription created with metadata:
    {
      "campaign_id": "09b73953...",
      "referrer_affiliate_id": "luke",
      "is_influencer_referral": "true",
      "trial_days": 3
    }
   ↓
11. Alice goes to /welcome-premium → Dashboard (Player Mode, 3-day trial)
   ↓
12. Alice does NOT get auto-created as affiliate (she came via influencer)
   ↓
13. Day 3: Trial ends, Stripe charges $1.99
   ↓
14. Rewardful tracks commission: Luke earns $0.99 (50%)
   ↓
15. Luke sees commission in Rewardful dashboard
   ↓
16. Admin pays Luke manually via Wise/PayPal
```

**Database State After Flow:**
```sql
-- Alice's user record
{
  id: 'alice-uuid',
  email: 'alice@example.com',
  referred_by_affiliate_id: 'luke', -- Tracked for analytics
  rewardful_affiliate_id: NULL,     -- NOT auto-created (influencer referral)
  rewardful_referral_link: NULL,
  referral_credits_earned: 0,       -- Cannot earn credits
  referral_credits_remaining: 0
}

-- referral_events table
{
  referrer_user_id: NULL, -- Luke is not a CPN user, external influencer
  referee_user_id: 'alice-uuid',
  event_type: 'influencer_signup',
  rewardful_affiliate_id: 'luke',
  rewardful_referral_id: 'luke_referral_id',
  event_data: {
    campaign_id: '09b73953...',
    trial_days: 3,
    subscription_id: 'sub_xyz'
  }
}
```

---

### Flow 2: Regular User Refers Friend (John → Bob)

```
1. John signs up organically (no referral)
   ↓
2. John creates account → Our API auto-creates John as affiliate
   POST /api/referral/create-affiliate
   {
     "email": "john@example.com",
     "campaign_id": "[CAMPAIGN_2_ID]", // Friend campaign
     "token": "a1b2c3d4" // UUID prefix
   }
   ↓
3. Rewardful returns: affiliate_id + referral_link
   ↓
4. We save to database:
   UPDATE users SET
     rewardful_affiliate_id = 'aff_john',
     rewardful_referral_link = 'https://app.cost-per-nut.com/share?via=a1b2c3d4'
   WHERE id = 'john-uuid';
   ↓
5. John goes to /refer page → sees his link
   ↓
6. John copies link, shares with Bob
   ↓
7. Bob clicks: https://app.cost-per-nut.com/share?via=a1b2c3d4
   ↓
8. Lands on /share with banner: "🎉 You're getting 1 week free!"
   ↓
9. Bob clicks "Get 1 Week Free" → /signup
   ↓
10. Bob creates account
   ↓ [CRITICAL: Check if friend referral]
11. System detects campaign_id = [CAMPAIGN_2_ID] (Friend campaign)
   ↓
12. System creates Bob as affiliate (auto-creates for ALL users in Campaign 2)
   ↓
13. Bob redirects to Stripe checkout (7-day trial)
   ↓
14. Stripe subscription created with metadata:
    {
      "campaign_id": "[CAMPAIGN_2_ID]",
      "referrer_user_id": "john-uuid",
      "referrer_affiliate_id": "a1b2c3d4",
      "is_referral_signup": "true",
      "is_influencer_referral": "false",
      "trial_days": 7
    }
   ↓
15. Bob completes checkout
   ↓
16. Bob goes to /welcome-premium → Dashboard (Player Mode, 7-day trial)
   ↓
17. Database updated:
    UPDATE users SET
      referred_by_affiliate_id = 'a1b2c3d4'
    WHERE id = 'bob-uuid';
   ↓
18. Day 7: Trial ends, Stripe charges $1.99
   ↓
19. Stripe webhook: invoice.payment_succeeded
   ↓
20. Check: Is this first payment after trial?
    IF subscription.metadata.is_referral_signup === 'true' AND
       invoice.billing_reason === 'subscription_cycle'
    THEN:
      // Award credit to John
      UPDATE users SET
        referral_credits_earned = referral_credits_earned + 1,
        referral_credits_remaining = referral_credits_remaining + 1
      WHERE id = 'john-uuid';
   ↓
21. John now has 1 free week earned!
   ↓
22. Next billing cycle (John's subscription):
    Stripe webhook: invoice.upcoming
    ↓
23. Check: Does John have credits?
    IF user.referral_credits_remaining > 0:
      // Extend subscription by 7 days
      Stripe.subscriptions.update(sub_id, {
        trial_end: current_end + 7 days
      })
      ↓
      UPDATE users SET
        referral_credits_remaining = referral_credits_remaining - 1
      WHERE id = 'john-uuid';
   ↓
24. Notification: "You saved $1.99 this week!"
```

**Database State After Flow:**
```sql
-- John's user record (referrer)
{
  id: 'john-uuid',
  rewardful_affiliate_id: 'aff_john',
  rewardful_referral_link: 'https://app.cost-per-nut.com/share?via=a1b2c3d4',
  referral_credits_earned: 1,    -- Bob converted!
  referral_credits_remaining: 1  -- 1 week available
}

-- Bob's user record (referee)
{
  id: 'bob-uuid',
  referred_by_affiliate_id: 'a1b2c3d4', -- Came from John
  rewardful_affiliate_id: 'aff_bob',    -- Auto-created, can refer others
  rewardful_referral_link: 'https://app.cost-per-nut.com/share?via=b5c6d7e8',
  referral_credits_earned: 0,
  referral_credits_remaining: 0
}

-- referral_events table
[
  {
    event_type: 'signup',
    referrer_user_id: 'john-uuid',
    referee_user_id: 'bob-uuid',
    rewardful_referral_id: 'a1b2c3d4'
  },
  {
    event_type: 'first_payment',
    referrer_user_id: 'john-uuid',
    referee_user_id: 'bob-uuid',
    event_data: { invoice_id: 'in_xyz', amount: 199 }
  },
  {
    event_type: 'credit_issued',
    referrer_user_id: 'john-uuid',
    event_data: { weeks: 1, reason: 'bob_first_payment' }
  }
]
```

---

### Flow 3: Organic User Signup (No Referral)

```
1. User finds CPN via Google/social media
   ↓
2. Lands on / (home page) OR /step-1 (onboarding)
   ↓
3. Completes standard onboarding Steps 1-4
   ↓
4. Creates account in Step 3
   ↓
5. Our API auto-creates them as affiliate (Campaign 2)
   ↓
6. User chooses Boyfriend Mode (Free) OR Player Mode (Paid)
   ↓
7. If Player Mode → Stripe checkout (NO trial, standard flow)
   ↓
8. User lands in dashboard
   ↓
9. User can now go to /refer to see their link and refer friends
```

**Key Point:** Even organic users get auto-created as affiliates so they can participate in the friend referral program.

---

## Current Implementation Status

### ✅ Completed (Already Live)

1. **Database Migration** - `20251018060220_add_referral_fields.sql`
   - Added columns to users table: `rewardful_affiliate_id`, `rewardful_referral_link`, `referred_by_affiliate_id`, `referral_credits_earned`, `referral_credits_remaining`, `referral_stats`
   - Created `referral_events` table with RLS policies
   - Applied to local Supabase
   - **Status:** ✅ Tested, working

2. **Referral Detection Utilities** - `src/lib/referral/utils.ts`
   - `detectReferralContext()` - Detects Rewardful referral from SDK
   - `persistReferralContext()` - Saves to sessionStorage
   - `getReferralContext()` - Retrieves from sessionStorage
   - `clearReferralContext()` - Clears after conversion
   - `setReferralSignupInProgress()` - Prevents dashboard flash
   - `isReferralSignupInProgress()` - Checks signup state
   - `clearReferralSignupInProgress()` - Clears signup state
   - **Status:** ✅ Fully implemented

3. **Rewardful SDK Integration** - `src/lib/referral/rewardful.ts`
   - `initializeRewardful()` - Verifies SDK loaded
   - `trackConversion()` - Tracks conversion to Rewardful
   - `getReferralId()` - Gets current referral ID
   - **Status:** ✅ Implemented, needs Rewardful API key in index.html

4. **Landing Page** - `src/pages/Share.tsx`
   - Detects referral context on mount
   - Shows yellow banner when referred: "🎉 You were invited to CPN — Get 1 week free!"
   - CTA button changes: "Get 1 Week Free" vs "Try for Free"
   - **Status:** ✅ Built and tested

5. **SignUp Flow Enhancement** - `src/pages/SignUp.tsx`
   - Sets referral signup flag before signup
   - Creates affiliate for every new user (Campaign 2)
   - Tracks conversion if referred
   - Saves `referred_by_affiliate_id` to database
   - Redirects to `/activating-trial` for referred users
   - **Status:** ✅ Implemented, needs Campaign 2 ID

6. **ActivatingTrial Page** - `src/pages/ActivatingTrial.tsx`
   - Beautiful loading page with progress bar
   - Prevents dashboard flash during signup
   - Auto-redirects to Stripe checkout with 7-day trial
   - Clears referral signup flag
   - **Status:** ✅ Fully functional

7. **Stripe Checkout API** - `app/api/checkout/route.ts`
   - Accepts `isReferralSignup` parameter
   - Adds 7-day trial when `isReferralSignup: true`
   - Stores referral metadata in subscription
   - **Status:** ✅ Working for 7-day trial

8. **Stripe Webhook** - `api/stripe/webhook.ts`
   - Handles `checkout.session.completed` - adds "player-mode" KIT tag
   - Handles `customer.subscription.deleted` - adds "cancelled" KIT tag
   - **Status:** ✅ KIT tagging working, needs credit issuance logic

9. **App Routing** - `src/App.tsx`
   - Checks `isReferralSignupInProgress()` to prevent dashboard flash
   - Routes to `/activating-trial` for referred signups
   - **Status:** ✅ Dashboard flash eliminated

10. **Rewardful Campaign 1** - Influencer Program
    - Campaign ID: `09b73953-9a70-4673-b97f-1e82983b4e3d`
    - Test affiliate created: Luke (`?via=luke`)
    - Link: `https://app.cost-per-nut.com/?via=luke`
    - Commission: 50% recurring
    - **Status:** ✅ Created and configured

---

### 🚧 In Progress (Needs Completion)

1. **Campaign 2 Setup in Rewardful**
   - Need to create "Refer-a-Friend" campaign
   - Set commission to $0
   - Get campaign ID
   - **Status:** 🚧 Not started

2. **Affiliate Creation API** - `api/referral/create-affiliate.ts`
   - Exists but needs update to use Campaign 2 ID by default
   - Currently returns 404 in production (Vite vs Vercel issue fixed)
   - Needs environment variable: `REWARDFUL_CAMPAIGN_ID`
   - **Status:** 🚧 File exists, needs testing + env var

3. **Environment Variables**
   - Local `.env.local`: Missing Rewardful keys
   - Vercel production: Missing Rewardful keys
   - Supabase Edge Functions: Has KIT_API_KEY, needs Rewardful keys
   - **Status:** 🚧 Partially configured

4. **Influencer Flow (3-day trial)**
   - Need to detect Campaign 1 vs Campaign 2
   - Need to apply 3-day trial for influencer referrals (not 7)
   - **Status:** 🚧 Not implemented

5. **Credit Issuance Logic**
   - Webhook handler for first payment detection
   - Award 7 days to referrer when referee pays
   - **Status:** 🚧 Not implemented

6. **Credit Application Logic**
   - Detect user has credits
   - Extend subscription by 7 days
   - Decrement credits_remaining
   - **Status:** 🚧 Not implemented

7. **Refer & Earn Page** - `src/pages/ReferAndEarn.tsx`
   - Needs to be created
   - Show referral link + stats
   - Copy button + share buttons
   - **Status:** 🚧 Not started

---

### ❌ Not Started (Future Phases)

1. **Campaign Detection Logic**
   - Determine if referral is from Campaign 1 or 2
   - Route to correct trial duration
   - **Status:** ❌ Design needed

2. **Notification System**
   - "You earned 1 week free!" when credit issued
   - "You saved $1.99 this week!" when credit applied
   - **Status:** ❌ Not designed

3. **Admin Dashboard**
   - View all referrals
   - Manual credit adjustments
   - **Status:** ❌ Deferred (use Rewardful dashboard)

4. **Testing Suite**
   - E2E tests for both campaigns
   - Credit application tests
   - **Status:** ❌ Not started

---

## Implementation Phases

### Phase 1: Rewardful Setup & Environment (30 minutes)

**Goal:** Configure Rewardful campaigns and environment variables.

#### Task 1.1: Create Campaign 2 in Rewardful Dashboard

1. Log into Rewardful: https://app.getrewardful.com
2. Go to Campaigns → New Campaign
3. Settings:
   ```yaml
   Name: "CPN Refer-a-Friend"
   Type: Customer Referral Program
   Campaign URL: https://app.cost-per-nut.com/share
   Commission Type: Fixed Amount
   Commission Amount: $0.00
   Commission Duration: One-time
   Cookie Window: 30 days
   Status: Active
   ```
4. Save campaign
5. Copy **Campaign ID** (UUID format)

#### Task 1.2: Configure Environment Variables

**Local Development (`.env.local`):**
```bash
# Rewardful
NEXT_PUBLIC_REWARDFUL_API_KEY=rwf_pub_YOUR_PUBLIC_KEY
REWARDFUL_SECRET_KEY=rwf_sec_YOUR_SECRET_KEY
REWARDFUL_CAMPAIGN_ID_FRIEND=[CAMPAIGN_2_UUID]
REWARDFUL_CAMPAIGN_ID_INFLUENCER=09b73953-9a70-4673-b97f-1e82983b4e3d

# Referral Config
NEXT_PUBLIC_REFERRAL_TRIAL_DAYS_FRIEND=7
NEXT_PUBLIC_REFERRAL_TRIAL_DAYS_INFLUENCER=3
ENABLE_REFERRAL_PROGRAM=true
```

**Vercel Production:**
1. Go to Vercel Dashboard → CPN project → Settings → Environment Variables
2. Add the same variables as above
3. Redeploy after adding

**Supabase Edge Functions (if needed):**
```bash
supabase secrets set REWARDFUL_SECRET_KEY=rwf_sec_YOUR_SECRET_KEY
```

#### Task 1.3: Add Rewardful SDK to index.html

File: `/index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- ... existing head content ... -->

    <!-- Rewardful Tracking Script -->
    <script>
      (function(w,r){w._rwq=r;w[r]=w[r]||function(){(w[r].q=w[r].q||[]).push(arguments)}})(window,'rewardful');
    </script>
    <script async src='https://r.wdfl.co/rw.js' data-rewardful='rwf_pub_YOUR_PUBLIC_KEY'></script>

  </head>
  <body>
    <!-- ... -->
  </body>
</html>
```

**IMPORTANT:** Replace `rwf_pub_YOUR_PUBLIC_KEY` with actual public key from Rewardful.

**Verification:**
- Open browser console
- Type `window.Rewardful`
- Should see object (not undefined)

---

### Phase 2: Campaign Detection Logic (1 hour)

**Goal:** Detect which campaign a referral belongs to and route accordingly.

#### Task 2.1: Create Campaign Detection Utility

File: `src/lib/referral/campaign.ts`

```typescript
/**
 * Campaign Detection Utilities
 *
 * Determines which Rewardful campaign a referral belongs to
 * and returns appropriate configuration.
 */

export type CampaignType = 'influencer' | 'friend' | 'organic';

export interface CampaignConfig {
  type: CampaignType;
  campaignId: string | null;
  trialDays: number;
  autoCreateAffiliate: boolean;
  earnsCredits: boolean; // Can this user earn credits by referring?
}

const CAMPAIGN_ID_INFLUENCER = import.meta.env.VITE_REWARDFUL_CAMPAIGN_ID_INFLUENCER;
const CAMPAIGN_ID_FRIEND = import.meta.env.VITE_REWARDFUL_CAMPAIGN_ID_FRIEND;

/**
 * Determines campaign type from Rewardful referral ID
 *
 * Rewardful stores campaign info in the referral object, but we need to
 * query their API to get it. For now, we'll use a simpler heuristic:
 * - Manual affiliates (influencers) have readable tokens: "luke", "john-doe"
 * - Auto-generated affiliates (friends) have UUID prefixes: "a1b2c3d4"
 *
 * Future: Query Rewardful API to get campaign_id from referral_id
 */
export async function detectCampaign(referralId: string | null): Promise<CampaignConfig> {
  // No referral = organic signup
  if (!referralId) {
    return {
      type: 'organic',
      campaignId: CAMPAIGN_ID_FRIEND, // Create as friend affiliate
      trialDays: 0,
      autoCreateAffiliate: true,
      earnsCredits: true,
    };
  }

  // Heuristic: UUID-like tokens are friend referrals
  const isUuidLike = /^[a-f0-9]{8}$/.test(referralId);

  if (isUuidLike) {
    // Friend referral
    return {
      type: 'friend',
      campaignId: CAMPAIGN_ID_FRIEND,
      trialDays: 7,
      autoCreateAffiliate: true,
      earnsCredits: true,
    };
  } else {
    // Influencer referral (readable token like "luke")
    return {
      type: 'influencer',
      campaignId: CAMPAIGN_ID_INFLUENCER,
      trialDays: 3,
      autoCreateAffiliate: false, // Influencer manages their own affiliates
      earnsCredits: false, // Influencer referrals don't earn credits
    };
  }
}

/**
 * More robust version: Query Rewardful API
 *
 * Use this once we have backend API route set up
 */
export async function detectCampaignViaAPI(referralId: string): Promise<CampaignConfig> {
  try {
    const response = await fetch('/api/referral/detect-campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referralId }),
    });

    const data = await response.json();

    return data.config;
  } catch (error) {
    console.error('[Campaign] Failed to detect campaign:', error);
    // Fallback to heuristic
    return detectCampaign(referralId);
  }
}
```

#### Task 2.2: Update SignUp.tsx to Use Campaign Detection

File: `src/pages/SignUp.tsx`

```typescript
import { detectCampaign } from '../lib/referral/campaign';

// Inside handleSubmit, after account creation:

const handleSubmit = async (e: FormEvent) => {
  // ... existing validation ...

  setLoading(true);

  try {
    // Get referral context
    const referralContext = getReferralContext();
    const referralId = referralContext?.referralId || null;

    // Detect campaign
    const campaign = await detectCampaign(referralId);

    console.log('[SignUp] Detected campaign:', campaign);

    // Set signup flag if referred
    if (campaign.type !== 'organic') {
      setReferralSignupInProgress();
    }

    // Create Supabase account
    const { data, error: signUpError } = await signUp(email, password);
    if (signUpError || !data.user) {
      // ... error handling ...
      return;
    }

    // Create affiliate if needed
    if (campaign.autoCreateAffiliate) {
      const { data: { session } } = await supabase.auth.getSession();

      const affiliateResponse = await fetch('/api/referral/create-affiliate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          email: data.user.email,
          firstName: '',
          lastName: '',
          campaignId: campaign.campaignId, // Use detected campaign
        }),
      });

      if (affiliateResponse.ok) {
        const affiliateData = await affiliateResponse.json();

        // Save to database
        await supabase.from('users').update({
          rewardful_affiliate_id: affiliateData.affiliateId,
          rewardful_referral_link: affiliateData.referralLink,
        }).eq('id', data.user.id);
      }
    }

    // If referred, track conversion and redirect to checkout
    if (campaign.type !== 'organic') {
      trackConversion(data.user.email!);

      // Save referee data
      await supabase.from('users').update({
        referred_by_affiliate_id: referralId,
      }).eq('id', data.user.id);

      // Log event
      await supabase.from('referral_events').insert({
        referee_user_id: data.user.id,
        event_type: 'signup',
        rewardful_referral_id: referralId,
        event_data: {
          email: data.user.email,
          campaign_type: campaign.type,
          trial_days: campaign.trialDays,
        },
      });

      clearReferralContext();

      // Redirect with campaign info
      window.location.href = `/activating-trial?campaign=${campaign.type}&trial=${campaign.trialDays}`;
      return;
    }

    // Organic signup - normal flow
    setSuccess(true);
    setTimeout(() => onSuccess(), 2000);

  } catch (error) {
    console.error('[SignUp] Error:', error);
    setError('Signup failed');
    setLoading(false);
  }
};
```

#### Task 2.3: Update ActivatingTrial.tsx to Use Campaign Info

File: `src/pages/ActivatingTrial.tsx`

```typescript
export function ActivatingTrial() {
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Get campaign info from URL params
  const searchParams = new URLSearchParams(window.location.search);
  const campaignType = searchParams.get('campaign') || 'friend';
  const trialDays = parseInt(searchParams.get('trial') || '7');

  // ... existing useEffects ...

  useEffect(() => {
    const startCheckout = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const priceId = STRIPE_CONFIG.prices.playerModeWeekly;
        const { data: { session } } = await supabase.auth.getSession();

        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            priceId,
            planType: 'weekly',
            isReferralSignup: true,
            campaignType, // NEW: Pass campaign type
            trialDays,    // NEW: Pass trial days (3 or 7)
          }),
        });

        const data = await response.json();

        if (data.url) {
          setProgress(100);
          await new Promise(resolve => setTimeout(resolve, 300));
          window.location.href = data.url;
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to activate trial');
      }
    };

    startCheckout();
  }, [campaignType, trialDays]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-cpn-dark">
      <div className="card-cpn w-full max-w-md text-center">
        {/* ... existing UI ... */}

        <p className="text-cpn-yellow text-xl mb-6">
          Activating Your {trialDays}-Day Free Trial...
        </p>

        {/* ... rest of component ... */}

        <div className="mt-8 p-4 bg-cpn-yellow/10 border border-cpn-yellow/30 rounded-lg">
          <p className="text-sm text-cpn-yellow font-medium">
            💳 You will not be charged for {trialDays} days
          </p>
          <p className="text-xs text-cpn-gray mt-1">
            Cancel anytime during your free trial
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Verification:**
1. Navigate to `/share?via=luke` (influencer)
   - Banner shows "Get 3 days free"
   - Signup → ActivatingTrial shows "3-Day Free Trial"

2. Navigate to `/share?via=a1b2c3d4` (friend)
   - Banner shows "Get 1 week free"
   - Signup → ActivatingTrial shows "7-Day Free Trial"

---

### Phase 3: Update Stripe Checkout API (30 minutes)

**Goal:** Support both 3-day and 7-day trials based on campaign type.

#### Task 3.1: Modify Checkout API Route

File: `app/api/checkout/route.ts`

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      priceId,
      planType,
      isReferralSignup,
      campaignType = 'friend',  // NEW
      trialDays = 7              // NEW
    } = body;

    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.VITE_SUPABASE_ANON_KEY || '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get referral info from database
    const { data: userData } = await supabase
      .from('users')
      .select('referred_by_affiliate_id')
      .eq('id', user.id)
      .single();

    const origin = request.headers.get('origin') || 'https://app.cost-per-nut.com';

    // Build subscription data
    const subscriptionData: any = {
      metadata: {
        supabase_user_id: user.id,
        plan_type: planType,
        is_referral_signup: isReferralSignup ? 'true' : 'false',
        campaign_type: campaignType,
        referred_by_affiliate_id: userData?.referred_by_affiliate_id || '',
      },
    };

    // Add trial if referral signup
    if (isReferralSignup && trialDays > 0) {
      subscriptionData.trial_period_days = trialDays;
      console.log(`[Checkout] Adding ${trialDays}-day trial for ${campaignType} referral`);
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: user.email,
      client_reference_id: userData?.referred_by_affiliate_id, // For Rewardful tracking
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      subscription_data: subscriptionData,
      success_url: `${origin}/welcome-premium`,
      cancel_url: `${origin}/share`,
    });

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error('[Checkout] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
```

**Verification:**
1. Create test checkout with influencer referral:
   ```javascript
   POST /api/checkout
   {
     "priceId": "price_...",
     "planType": "weekly",
     "isReferralSignup": true,
     "campaignType": "influencer",
     "trialDays": 3
   }
   ```
   - Stripe session should have `trial_period_days: 3`

2. Create test checkout with friend referral:
   ```javascript
   POST /api/checkout
   {
     "priceId": "price_...",
     "planType": "weekly",
     "isReferralSignup": true,
     "campaignType": "friend",
     "trialDays": 7
   }
   ```
   - Stripe session should have `trial_period_days: 7`

---

### Phase 4: Credit Issuance System (2 hours)

**Goal:** Award 7 days credit to referrer when referee's first payment clears.

#### Task 4.1: Enhance Stripe Webhook Handler

File: `api/stripe/webhook.ts`

Add new case for `invoice.payment_succeeded`:

```typescript
// ... existing webhook handler code ...

switch (event.type) {
  // ... existing cases ...

  case 'invoice.payment_succeeded': {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = invoice.subscription as string;

    console.log('[Webhook] Invoice payment succeeded:', invoice.id);

    // Only process if this is a subscription invoice
    if (!subscriptionId) {
      console.log('[Webhook] Not a subscription invoice, skipping');
      break;
    }

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Check if this is first payment after trial (friend referral only)
    const isReferralSignup = subscription.metadata.is_referral_signup === 'true';
    const campaignType = subscription.metadata.campaign_type;
    const isFirstPayment = invoice.billing_reason === 'subscription_cycle';
    const hasHadTrial = subscription.trial_end !== null;

    console.log('[Webhook] Invoice context:', {
      isReferralSignup,
      campaignType,
      isFirstPayment,
      hasHadTrial,
      billing_reason: invoice.billing_reason,
    });

    // Only issue credits for friend referrals on first post-trial payment
    if (isReferralSignup &&
        campaignType === 'friend' &&
        isFirstPayment &&
        hasHadTrial) {

      console.log('[Webhook] First payment after trial - issuing credit');

      const referredByAffiliateId = subscription.metadata.referred_by_affiliate_id;
      const refereeUserId = subscription.metadata.supabase_user_id;

      if (!referredByAffiliateId) {
        console.warn('[Webhook] No referred_by_affiliate_id in metadata');
        break;
      }

      // Find referrer user by their affiliate ID
      const { data: referrer } = await supabase
        .from('users')
        .select('*')
        .eq('rewardful_affiliate_id', referredByAffiliateId)
        .maybeSingle();

      if (!referrer) {
        console.warn('[Webhook] Referrer not found:', referredByAffiliateId);
        break;
      }

      // Check if referrer has active subscription (Boyfriend Mode users can't earn credits)
      if (!referrer.stripe_subscription_id) {
        console.log('[Webhook] Referrer has no subscription, cannot earn credits');
        break;
      }

      // Check if we already issued credit for this conversion (idempotency)
      const { data: existingEvent } = await supabase
        .from('referral_events')
        .select('id')
        .eq('referrer_user_id', referrer.id)
        .eq('referee_user_id', refereeUserId)
        .eq('event_type', 'credit_issued')
        .maybeSingle();

      if (existingEvent) {
        console.log('[Webhook] Credit already issued, skipping');
        break;
      }

      // Award 1 week (7 days) credit to referrer
      const { error: updateError } = await supabase
        .from('users')
        .update({
          referral_credits_earned: referrer.referral_credits_earned + 1,
          referral_credits_remaining: referrer.referral_credits_remaining + 1,
        })
        .eq('id', referrer.id);

      if (updateError) {
        console.error('[Webhook] Failed to update referrer credits:', updateError);
        break;
      }

      // Log credit issuance event
      await supabase.from('referral_events').insert({
        referrer_user_id: referrer.id,
        referee_user_id: refereeUserId,
        event_type: 'credit_issued',
        event_data: {
          invoice_id: invoice.id,
          subscription_id: subscriptionId,
          amount_paid: invoice.amount_paid,
          weeks_awarded: 1,
        },
      });

      console.log(`[Webhook] Awarded 1 week credit to referrer ${referrer.id}`);

      // TODO: Send notification to referrer
      // await sendNotification(referrer.id, "You earned 1 week free!");
    }

    break;
  }

  // ... rest of webhook cases ...
}
```

**Verification:**
1. Complete friend referral flow end-to-end
2. Wait for trial to end (or manually trigger via Stripe Dashboard)
3. Stripe processes first payment
4. Check database:
   ```sql
   SELECT
     referral_credits_earned,
     referral_credits_remaining
   FROM users
   WHERE id = 'referrer-uuid';
   ```
   Should show `1` for both fields
5. Check `referral_events` table:
   ```sql
   SELECT * FROM referral_events
   WHERE event_type = 'credit_issued'
   ORDER BY created_at DESC
   LIMIT 1;
   ```
   Should show new credit_issued event

---

#### Task 4.2: Add Credit Application Logic (Next Billing Cycle)

File: `api/stripe/webhook.ts`

Add new case for `invoice.upcoming` (fires before billing):

```typescript
case 'invoice.upcoming': {
  const invoice = event.data.object as Stripe.Invoice;
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) break;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata.supabase_user_id;

  if (!userId) break;

  // Get user's credit balance
  const { data: user } = await supabase
    .from('users')
    .select('referral_credits_remaining')
    .eq('id', userId)
    .single();

  if (!user || user.referral_credits_remaining <= 0) {
    console.log('[Webhook] User has no credits to apply');
    break;
  }

  console.log(`[Webhook] User has ${user.referral_credits_remaining} credits, applying 1 week`);

  // Extend subscription by 7 days
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  const newPeriodEnd = new Date(currentPeriodEnd.getTime() + 7 * 24 * 60 * 60 * 1000);
  const newPeriodEndUnix = Math.floor(newPeriodEnd.getTime() / 1000);

  await stripe.subscriptions.update(subscriptionId, {
    trial_end: newPeriodEndUnix,
    proration_behavior: 'none', // Don't charge for extension
  });

  // Decrement credits
  await supabase
    .from('users')
    .update({
      referral_credits_remaining: user.referral_credits_remaining - 1,
    })
    .eq('id', userId);

  // Log credit usage
  await supabase.from('referral_events').insert({
    referrer_user_id: userId,
    event_type: 'credit_applied',
    event_data: {
      subscription_id: subscriptionId,
      weeks_applied: 1,
      new_period_end: newPeriodEnd.toISOString(),
    },
  });

  console.log(`[Webhook] Extended subscription by 7 days, ${user.referral_credits_remaining - 1} credits remaining`);

  // TODO: Send notification
  // await sendNotification(userId, "You saved $1.99 this week!");

  break;
}
```

**Note:** The `invoice.upcoming` event fires ~7 days before the next billing. This gives us time to apply credits before charging the user.

**Alternative Approach:** Use `customer.subscription.trial_will_end` event instead of modifying on `invoice.upcoming`. This is cleaner but requires setting trial mode explicitly.

**Verification:**
1. User with 1 credit earns their next billing cycle
2. 7 days before billing, `invoice.upcoming` webhook fires
3. Subscription extended by 7 days
4. User charged $0 instead of $1.99
5. Database shows `referral_credits_remaining: 0`
6. `referral_events` shows `credit_applied` event

---

### Phase 5: Refer & Earn Page (1.5 hours)

**Goal:** Create in-app page where users see their referral link and stats.

#### Task 5.1: Create API Route for Stats

File: `app/api/referral/stats/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.VITE_SUPABASE_ANON_KEY || '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's referral data
    const { data: userData } = await supabase
      .from('users')
      .select('rewardful_referral_link, referral_credits_earned, referral_credits_remaining')
      .eq('id', user.id)
      .single();

    // Get referral events
    const { data: events } = await supabase
      .from('referral_events')
      .select('*')
      .eq('referrer_user_id', user.id)
      .order('created_at', { ascending: false });

    // Calculate stats
    const signups = events?.filter(e => e.event_type === 'signup').length || 0;
    const conversions = events?.filter(e => e.event_type === 'credit_issued').length || 0;
    const totalClicks = 0; // TODO: Track clicks via Rewardful API or analytics

    return NextResponse.json({
      referralLink: userData?.rewardful_referral_link || '',
      stats: {
        totalClicks,
        totalSignups: signups,
        paidReferrals: conversions,
        creditsEarned: userData?.referral_credits_earned || 0,
        creditsRemaining: userData?.referral_credits_remaining || 0,
      },
      recentEvents: events?.slice(0, 10) || [],
    });

  } catch (error) {
    console.error('[Referral Stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral stats' },
      { status: 500 }
    );
  }
}
```

#### Task 5.2: Create Refer & Earn Page

File: `src/pages/ReferAndEarn.tsx`

```typescript
import { useEffect, useState } from 'react';
import { Copy, MessageCircle, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase/client';

interface ReferralStats {
  referralLink: string;
  stats: {
    totalClicks: number;
    totalSignups: number;
    paidReferrals: number;
    creditsEarned: number;
    creditsRemaining: number;
  };
}

export function ReferAndEarn() {
  const [data, setData] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/referral/stats', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (data?.referralLink) {
      navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareVia = (platform: 'sms' | 'whatsapp' | 'twitter') => {
    if (!data?.referralLink) return;

    const message = `Check out CPN - Cost Per Nut calculator! ${data.referralLink}`;

    const urls = {
      sms: `sms:?body=${encodeURIComponent(message)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
    };

    window.open(urls[platform], '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cpn-gray">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cpn-gray">Failed to load referral data</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-cpn-dark">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-cpn-yellow mb-2">
            Give 1 Week, Get 1 Week
          </h1>
          <p className="text-cpn-gray">
            Share CPN with friends. They get 1 week free, you get 1 week free when they subscribe.
          </p>
        </div>

        {/* Referral Link Card */}
        <div className="card-cpn mb-6">
          <label className="block text-sm text-cpn-gray mb-2">
            Your Referral Link
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={data.referralLink}
              readOnly
              className="input-cpn flex-1"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              onClick={copyLink}
              className="btn-cpn flex items-center gap-2"
            >
              <Copy size={18} />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => shareVia('sms')}
            className="flex-1 bg-cpn-dark-lighter hover:bg-cpn-dark-lighter/80 text-cpn-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <MessageCircle size={20} />
            SMS
          </button>
          <button
            onClick={() => shareVia('whatsapp')}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <Share2 size={20} />
            WhatsApp
          </button>
          <button
            onClick={() => shareVia('twitter')}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <Share2 size={20} />
            X (Twitter)
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card-cpn text-center">
            <p className="text-3xl font-bold text-cpn-yellow mb-1">
              {data.stats.totalSignups}
            </p>
            <p className="text-sm text-cpn-gray">Signups</p>
          </div>
          <div className="card-cpn text-center">
            <p className="text-3xl font-bold text-cpn-yellow mb-1">
              {data.stats.paidReferrals}
            </p>
            <p className="text-sm text-cpn-gray">Paid Referrals</p>
          </div>
          <div className="card-cpn text-center">
            <p className="text-3xl font-bold text-cpn-yellow mb-1">
              {data.stats.creditsEarned}
            </p>
            <p className="text-sm text-cpn-gray">Weeks Earned</p>
          </div>
          <div className="card-cpn text-center">
            <p className="text-3xl font-bold text-cpn-yellow mb-1">
              {data.stats.creditsRemaining}
            </p>
            <p className="text-sm text-cpn-gray">Weeks Remaining</p>
          </div>
        </div>

        {/* How It Works */}
        <div className="card-cpn">
          <h2 className="text-2xl font-bold mb-4">How It Works</h2>
          <ol className="space-y-3 text-cpn-gray">
            <li className="flex gap-3">
              <span className="text-cpn-yellow font-bold">1.</span>
              <span>Share your unique referral link with friends</span>
            </li>
            <li className="flex gap-3">
              <span className="text-cpn-yellow font-bold">2.</span>
              <span>They sign up and get 1 week free</span>
            </li>
            <li className="flex gap-3">
              <span className="text-cpn-yellow font-bold">3.</span>
              <span>When their trial ends and they become a paying customer, you get 1 week free</span>
            </li>
            <li className="flex gap-3">
              <span className="text-cpn-yellow font-bold">4.</span>
              <span>No limit on how many free weeks you can earn!</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
```

#### Task 5.3: Add to Navigation

File: `src/App.tsx`

```typescript
// Import
import { ReferAndEarn } from './pages/ReferAndEarn';

// In sidebar navigation (around line 440):
<div className={`sidebar-item ${activeView === 'refer' ? 'active' : ''}`}
     onClick={() => { setAddingDataForGirl(null); setActiveView('refer'); }}>
  <Share2 size={20} />
  <span>Refer & Earn</span>
</div>

// In view rendering section (around line 550):
{activeView === 'refer' && <ReferAndEarn />}
```

**Verification:**
1. Log into dashboard
2. Click "Refer & Earn" in sidebar
3. Page loads with:
   - Personal referral link
   - Copy button (click to test)
   - Share buttons (click to verify URLs)
   - Stats cards showing current values
   - "How It Works" section

---

### Phase 6: Testing & Deployment (2 hours)

**Goal:** Comprehensive testing of both campaign flows.

#### Test Suite 1: Influencer Referral Flow (Campaign 1)

**Test Case 1.1: Luke's Link → 3-Day Trial**
```
1. Navigate to: https://app.cost-per-nut.com/?via=luke
2. Verify: Yellow banner shows "Get 3 days free" (NOT 7)
3. Click "Try for Free"
4. Sign up with new email
5. Verify redirect to /activating-trial?campaign=influencer&trial=3
6. Verify: Page shows "3-Day Free Trial"
7. Complete Stripe checkout
8. Verify in Stripe Dashboard:
   - Subscription has trial_period_days: 3
   - Metadata contains:
     - campaign_type: "influencer"
     - referred_by_affiliate_id: "luke"
     - is_referral_signup: "true"
9. Verify in Database:
   - User has referred_by_affiliate_id: "luke"
   - User does NOT have rewardful_affiliate_id (not auto-created)
10. Verify in Rewardful Dashboard:
    - Conversion tracked to Luke
    - Commission pending: 50% × $1.99 = $0.99
11. Wait 3 days OR manually complete trial in Stripe
12. Verify: First payment of $1.99 processes
13. Verify in Rewardful: Commission status changes to "Approved"
14. Verify: NO credits awarded to any user (influencer campaign)
```

**Expected Result:** ✅ Influencer gets 50% commission, referee gets 3-day trial, NO auto-affiliate creation

---

**Test Case 1.2: Influencer Referee Cannot Earn Credits**
```
1. User from Test 1.1 (came via Luke) goes to /refer
2. Verify: Page shows message "You were referred by an influencer and cannot earn credits"
   OR: Page doesn't exist / access denied
3. Verify in database: User has rewardful_affiliate_id: NULL
```

**Expected Result:** ✅ Influencer referrals don't participate in friend credit system

---

#### Test Suite 2: Friend Referral Flow (Campaign 2)

**Test Case 2.1: John Signs Up Organically**
```
1. Navigate to: https://app.cost-per-nut.com (no referral)
2. Go through standard onboarding /step-1 → /step-4
3. Sign up with email: john@test.com
4. Verify: API call to /api/referral/create-affiliate succeeds
5. Verify in Database:
   - User has rewardful_affiliate_id: "aff_xxx"
   - User has rewardful_referral_link: "https://...?via=a1b2c3d4"
   - referred_by_affiliate_id: NULL (organic)
6. Verify in Rewardful Dashboard:
   - New affiliate created in Campaign 2
   - Token is UUID-like: "a1b2c3d4"
7. Go to /refer page
8. Verify: Referral link displayed correctly
9. Copy link
10. Verify: Link format is correct
```

**Expected Result:** ✅ Auto-affiliate creation works for organic signups

---

**Test Case 2.2: Bob Uses John's Link → 7-Day Trial**
```
1. Copy John's referral link from Test 2.1
2. Open in incognito window
3. Navigate to John's link: https://app.cost-per-nut.com/share?via=a1b2c3d4
4. Verify: Yellow banner shows "🎉 You're getting 1 week free!"
5. Click "Get 1 Week Free"
6. Sign up with email: bob@test.com
7. Verify redirect to /activating-trial?campaign=friend&trial=7
8. Verify: Page shows "7-Day Free Trial"
9. Complete Stripe checkout
10. Verify in Stripe Dashboard:
    - Subscription has trial_period_days: 7
    - Metadata contains:
      - campaign_type: "friend"
      - referrer_user_id: john-uuid
      - referred_by_affiliate_id: "a1b2c3d4"
      - is_referral_signup: "true"
11. Verify in Database:
    - Bob has referred_by_affiliate_id: "a1b2c3d4"
    - Bob has rewardful_affiliate_id: "aff_yyy" (auto-created)
    - Bob has his own rewardful_referral_link
12. Verify in referral_events table:
    - Event: type="signup", referrer_user_id=john-uuid, referee_user_id=bob-uuid
```

**Expected Result:** ✅ Friend referral gives 7-day trial, auto-creates affiliate for referee

---

**Test Case 2.3: Credit Issuance When Bob Converts**
```
1. Continue from Test 2.2
2. Wait 7 days OR manually complete Bob's trial in Stripe Dashboard:
   - Go to Stripe → Customers → Bob → Subscriptions
   - Click "..." → "End trial now"
3. Verify: Stripe charges Bob $1.99
4. Verify: Webhook invoice.payment_succeeded fires
5. Check webhook logs for:
   - "First payment after trial - issuing credit"
   - "Awarded 1 week credit to referrer [john-uuid]"
6. Verify in Database (John's record):
   - referral_credits_earned: 1
   - referral_credits_remaining: 1
7. Verify in referral_events table:
   - New event: type="credit_issued", referrer_user_id=john-uuid, referee_user_id=bob-uuid
8. Verify: John receives notification (if implemented)
```

**Expected Result:** ✅ John earns 1 week credit when Bob's first payment processes

---

**Test Case 2.4: Credit Application on John's Next Billing**
```
1. Continue from Test 2.3 (John has 1 credit)
2. Ensure John has an active subscription
3. Wait for John's next billing cycle OR trigger manually:
   - In Stripe Dashboard → Subscriptions → John
   - Click "..." → "Update subscription" → Change billing date to today
4. Verify: Webhook invoice.upcoming fires
5. Check webhook logs for:
   - "User has 1 credits, applying 1 week"
   - "Extended subscription by 7 days"
6. Verify in Stripe:
   - John's subscription period_end extended by 7 days
   - No charge processed
7. Verify in Database (John's record):
   - referral_credits_remaining: 0 (decremented)
8. Verify in referral_events table:
   - New event: type="credit_applied", referrer_user_id=john-uuid
```

**Expected Result:** ✅ John's subscription extended by 7 days, credit consumed

---

#### Test Suite 3: Edge Cases

**Test Case 3.1: Free Tier User Refers Friend**
```
1. User signs up, chooses Boyfriend Mode (Free)
2. Verify: User gets affiliate link
3. Friend signs up via their link
4. Friend completes trial and converts
5. Verify: NO credit issued to free tier user (no subscription to extend)
6. Check webhook logs for: "Referrer has no subscription, cannot earn credits"
```

**Expected Result:** ✅ Free tier users don't earn credits (no subscription)

---

**Test Case 3.2: User Refers Multiple Friends**
```
1. John refers 3 friends: Alice, Charlie, Diana
2. All 3 complete trials and convert
3. Verify in Database (John's record):
   - referral_credits_earned: 3
   - referral_credits_remaining: 3
4. Verify in referral_events:
   - 3 × credit_issued events
5. Over next 3 billing cycles, verify:
   - Credit 1 applied: creditsRemaining: 2
   - Credit 2 applied: creditsRemaining: 1
   - Credit 3 applied: creditsRemaining: 0
```

**Expected Result:** ✅ Multiple credits accumulate and apply sequentially

---

**Test Case 3.3: Duplicate Credit Issuance Prevention**
```
1. Complete Test 2.3 (Bob converts, John gets credit)
2. Manually trigger invoice.payment_succeeded webhook again with same data
3. Verify in webhook logs: "Credit already issued, skipping"
4. Verify in Database: John still has only 1 credit (not 2)
```

**Expected Result:** ✅ Idempotency check prevents duplicate credits

---

#### Deployment Checklist

**Pre-Deployment:**
- [ ] All environment variables set in Vercel
- [ ] Campaign 2 created in Rewardful
- [ ] Rewardful SDK added to index.html with public key
- [ ] Local testing complete (all test cases passed)
- [ ] Database migrations applied to production
- [ ] Stripe webhooks configured

**Deployment:**
1. Commit all changes:
   ```bash
   git add -A
   git commit -m "feat: Dual referral system implementation complete"
   git push origin HEAD
   ```

2. Deploy to Vercel:
   - Vercel auto-deploys from GitHub
   - Wait for build to complete
   - Check deployment logs for errors

3. Verify production environment:
   ```bash
   # Check environment variables
   vercel env ls

   # Verify Rewardful SDK loads
   # Open https://app.cost-per-nut.com
   # Console: window.Rewardful (should be object)
   ```

4. Run smoke tests in production:
   - Test Case 1.1 (Influencer flow)
   - Test Case 2.2 (Friend flow)
   - Test Case 2.3 (Credit issuance)

**Post-Deployment:**
- [ ] Monitor Vercel logs for errors
- [ ] Monitor Stripe webhook delivery (should be 100% success rate)
- [ ] Monitor Rewardful dashboard for conversions
- [ ] Check Supabase logs for database errors
- [ ] Create monitoring dashboard (optional)

---

## Database Schema

### Users Table Extensions

```sql
-- Existing columns (not modified)
id UUID PRIMARY KEY
email TEXT
stripe_customer_id TEXT
stripe_subscription_id TEXT
subscription_tier TEXT
...

-- NEW columns for referral system
rewardful_affiliate_id TEXT                  -- Rewardful affiliate ID (aff_xxx)
rewardful_referral_link TEXT                 -- Full referral link URL
referred_by_affiliate_id TEXT                -- Token of referrer (e.g., "luke" or "a1b2c3d4")
referral_credits_earned INTEGER DEFAULT 0    -- Total weeks earned (lifetime)
referral_credits_remaining INTEGER DEFAULT 0 -- Weeks available to use
referral_stats JSONB DEFAULT '{}'::jsonb    -- Extra metadata (optional)
```

**Example User Records:**

**Influencer (Luke):**
```json
{
  "id": "influencer-uuid",
  "email": "luke@example.com",
  "rewardful_affiliate_id": "aff_luke_123",
  "rewardful_referral_link": "https://app.cost-per-nut.com/?via=luke",
  "referred_by_affiliate_id": null,
  "referral_credits_earned": 0,
  "referral_credits_remaining": 0
}
```

**Regular User (John, organic signup):**
```json
{
  "id": "john-uuid",
  "email": "john@example.com",
  "rewardful_affiliate_id": "aff_abc123",
  "rewardful_referral_link": "https://app.cost-per-nut.com/share?via=a1b2c3d4",
  "referred_by_affiliate_id": null,
  "referral_credits_earned": 2,
  "referral_credits_remaining": 1
}
```

**Referred User (Bob, came via John):**
```json
{
  "id": "bob-uuid",
  "email": "bob@example.com",
  "rewardful_affiliate_id": "aff_xyz789",
  "rewardful_referral_link": "https://app.cost-per-nut.com/share?via=b5c6d7e8",
  "referred_by_affiliate_id": "a1b2c3d4",
  "referral_credits_earned": 0,
  "referral_credits_remaining": 0
}
```

---

### Referral Events Table

```sql
CREATE TABLE IF NOT EXISTS public.referral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,  -- 'signup', 'first_payment', 'credit_issued', 'credit_applied'
  event_data JSONB DEFAULT '{}'::jsonb,
  rewardful_affiliate_id TEXT,
  rewardful_referral_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referral_events_referrer
  ON public.referral_events(referrer_user_id);

CREATE INDEX IF NOT EXISTS idx_referral_events_referee
  ON public.referral_events(referee_user_id);

CREATE INDEX IF NOT EXISTS idx_referral_events_type
  ON public.referral_events(event_type);

-- RLS Policies
ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral events"
  ON public.referral_events
  FOR SELECT
  USING (
    auth.uid() = referrer_user_id OR
    auth.uid() = referee_user_id
  );

CREATE POLICY "Authenticated users can insert referral events"
  ON public.referral_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
```

**Event Type Definitions:**

- `signup`: Referee creates account
- `first_payment`: Referee's first payment after trial clears
- `credit_issued`: Referrer awarded credit
- `credit_applied`: Referrer's credit used to extend subscription
- `influencer_signup`: Signup via influencer campaign (for analytics)

**Example Events:**

```json
// Signup event
{
  "id": "event-1",
  "referrer_user_id": "john-uuid",
  "referee_user_id": "bob-uuid",
  "event_type": "signup",
  "rewardful_referral_id": "a1b2c3d4",
  "event_data": {
    "campaign_type": "friend",
    "trial_days": 7
  },
  "created_at": "2025-10-18T10:00:00Z"
}

// Credit issued event
{
  "id": "event-2",
  "referrer_user_id": "john-uuid",
  "referee_user_id": "bob-uuid",
  "event_type": "credit_issued",
  "event_data": {
    "invoice_id": "in_123",
    "weeks_awarded": 1,
    "amount_paid": 199
  },
  "created_at": "2025-10-25T10:00:00Z"
}

// Credit applied event
{
  "id": "event-3",
  "referrer_user_id": "john-uuid",
  "event_type": "credit_applied",
  "event_data": {
    "subscription_id": "sub_456",
    "weeks_applied": 1,
    "new_period_end": "2025-11-08T10:00:00Z"
  },
  "created_at": "2025-11-01T10:00:00Z"
}
```

---

## API Endpoints

### Existing Endpoints (Modified)

#### POST /api/checkout
**Modified to support dual campaigns**

**Request:**
```json
{
  "priceId": "price_xxx",
  "planType": "weekly",
  "isReferralSignup": true,
  "campaignType": "friend",  // NEW: "influencer" or "friend"
  "trialDays": 7             // NEW: 3 or 7
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/c/pay/..."
}
```

---

#### POST /api/stripe/webhook
**Enhanced with credit issuance logic**

**New Events Handled:**
- `invoice.payment_succeeded` - Issue credits on first post-trial payment
- `invoice.upcoming` - Apply credits before next billing

**No changes to request/response (Stripe webhook format)**

---

### New Endpoints

#### POST /api/referral/create-affiliate
**Creates Rewardful affiliate for new user**

**Request:**
```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "campaignId": "campaign-uuid"  // Optional, defaults to friend campaign
}
```

**Response:**
```json
{
  "success": true,
  "affiliateId": "aff_xyz123",
  "referralLink": "https://app.cost-per-nut.com/share?via=a1b2c3d4"
}
```

**Error Response:**
```json
{
  "warning": "Referral program not configured",
  "affiliateId": null,
  "referralLink": null
}
```

---

#### GET /api/referral/stats
**Fetches user's referral statistics**

**Headers:**
```
Authorization: Bearer {supabase_access_token}
```

**Response:**
```json
{
  "referralLink": "https://app.cost-per-nut.com/share?via=a1b2c3d4",
  "stats": {
    "totalClicks": 0,
    "totalSignups": 3,
    "paidReferrals": 2,
    "creditsEarned": 2,
    "creditsRemaining": 1
  },
  "recentEvents": [
    {
      "id": "event-uuid",
      "event_type": "credit_issued",
      "created_at": "2025-10-18T10:00:00Z",
      "event_data": { ... }
    }
  ]
}
```

---

#### POST /api/referral/detect-campaign (Future)
**Determines campaign type from referral ID**

**Request:**
```json
{
  "referralId": "luke"
}
```

**Response:**
```json
{
  "config": {
    "type": "influencer",
    "campaignId": "09b73953-...",
    "trialDays": 3,
    "autoCreateAffiliate": false,
    "earnsCredits": false
  }
}
```

---

## Rollback Strategy

### If Database Migration Fails

**Symptoms:**
- Supabase errors
- Missing columns
- RLS policy violations

**Rollback:**
```sql
-- Drop new table
DROP TABLE IF EXISTS public.referral_events CASCADE;

-- Remove new columns
ALTER TABLE public.users DROP COLUMN IF EXISTS rewardful_affiliate_id;
ALTER TABLE public.users DROP COLUMN IF EXISTS rewardful_referral_link;
ALTER TABLE public.users DROP COLUMN IF EXISTS referred_by_affiliate_id;
ALTER TABLE public.users DROP COLUMN IF EXISTS referral_credits_earned;
ALTER TABLE public.users DROP COLUMN IF EXISTS referral_credits_remaining;
ALTER TABLE public.users DROP COLUMN IF EXISTS referral_stats;
```

**Recovery:**
- Re-run migration with fixes
- No data loss (new columns, empty table)

---

### If Referral Flow Breaks Normal Signup

**Symptoms:**
- Organic signups fail
- Dashboard doesn't load
- Affiliate creation errors

**Immediate Fix:**
1. Set environment variable:
   ```bash
   ENABLE_REFERRAL_PROGRAM=false
   ```
2. Redeploy Vercel

**Code Rollback:**
```bash
git revert HEAD~1  # Revert last commit
git push origin HEAD
```

**Verify:**
- Normal signup works
- No referral detection
- Dashboard loads

---

### If Credit Issuance Breaks

**Symptoms:**
- Webhook errors
- Credits not issued
- Stripe subscription issues

**Immediate Fix:**
1. Comment out credit issuance logic in webhook.ts:
   ```typescript
   // case 'invoice.payment_succeeded': {
   //   // ... credit issuance code ...
   // }
   ```
2. Redeploy

**Manual Credit Issuance:**
```sql
-- Manually award credit
UPDATE users
SET
  referral_credits_earned = referral_credits_earned + 1,
  referral_credits_remaining = referral_credits_remaining + 1
WHERE id = 'user-uuid';

-- Log event
INSERT INTO referral_events (
  referrer_user_id,
  event_type,
  event_data
) VALUES (
  'user-uuid',
  'credit_issued',
  '{"manual": true, "reason": "webhook_failure"}'::jsonb
);
```

---

## Success Metrics

### Week 1 KPIs (MVP Validation)

**Technical Metrics:**
- [ ] Zero errors in Vercel logs related to referral system
- [ ] 100% Stripe webhook delivery rate
- [ ] 100% Rewardful API success rate
- [ ] No regressions in normal onboarding flow

**Acquisition Metrics:**
- [ ] At least 1 influencer referral conversion (Luke's campaign)
- [ ] At least 1 friend referral conversion (Campaign 2)
- [ ] Referral attribution accuracy: 100% (all referrals tracked correctly)

**Credit System:**
- [ ] At least 1 credit issued successfully
- [ ] At least 1 credit applied successfully
- [ ] Credits_earned = credits_issued (no leakage)

---

### Month 1 KPIs (Growth Phase)

**Acquisition:**
- **Target:** 20% of new signups via referrals
- **Metric:** `(referred_signups / total_signups) × 100`

**Conversion:**
- **Target:** 60% trial-to-paid conversion for referred users
- **Metric:** `(paid_referrals / total_referrals) × 100`

**Engagement:**
- **Target:** 30% of users visit /refer page
- **Metric:** `(users_visited_refer / total_active_users) × 100`

**Viral Coefficient:**
- **Target:** 0.3 (each user refers 0.3 users on average)
- **Metric:** `total_referrals / total_users`

---

### Influencer Campaign Specific (Campaign 1)

**Commission Tracking:**
- [ ] Rewardful dashboard shows accurate commissions
- [ ] Luke's commissions match actual conversions
- [ ] No double-counting or missing conversions

**Payout Process:**
- [ ] Manual payout via Wise/PayPal documented
- [ ] Influencer receives payment within agreed timeframe
- [ ] Payout amount matches 50% of revenue

---

### Friend Campaign Specific (Campaign 2)

**Credit Economics:**
- **Target:** Average user earns 1-2 weeks credit per month
- **Target:** 80% of earned credits get used (not wasted)
- **Metric:** `credits_applied / credits_earned × 100`

**Referral Quality:**
- **Target:** Referred users have same churn rate as organic (<5% monthly)
- **Metric:** Track churn by acquisition source

---

## Appendix A: Environment Variables Reference

### Required Variables

```bash
# ========================================
# REWARDFUL CONFIGURATION
# ========================================

# Public API key (safe to expose in client)
NEXT_PUBLIC_REWARDFUL_API_KEY=rwf_pub_...

# Secret API key (server-side only, NEVER expose)
REWARDFUL_SECRET_KEY=rwf_sec_...

# Campaign IDs
REWARDFUL_CAMPAIGN_ID_INFLUENCER=09b73953-9a70-4673-b97f-1e82983b4e3d
REWARDFUL_CAMPAIGN_ID_FRIEND=[UUID from Campaign 2]

# ========================================
# REFERRAL CONFIGURATION
# ========================================

# Trial durations (days)
NEXT_PUBLIC_REFERRAL_TRIAL_DAYS_FRIEND=7
NEXT_PUBLIC_REFERRAL_TRIAL_DAYS_INFLUENCER=3

# Feature flag
ENABLE_REFERRAL_PROGRAM=true

# ========================================
# STRIPE CONFIGURATION (existing)
# ========================================

STRIPE_SECRET_KEY=sk_test_... # or sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_...
VITE_STRIPE_PRICE_PLAYER_MODE_WEEKLY=price_...
VITE_STRIPE_PRICE_PLAYER_MODE_ANNUAL=price_...

# ========================================
# SUPABASE CONFIGURATION (existing)
# ========================================

VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# ========================================
# KIT.COM CONFIGURATION (existing)
# ========================================

KIT_API_KEY=your_kit_api_key
```

### Where to Set Them

**Local Development (`.env.local`):**
- Create file in project root
- Add all variables above
- Never commit to Git

**Vercel Production:**
1. Go to: https://vercel.com/your-team/cpn-live/settings/environment-variables
2. Add each variable
3. Select environments: Production, Preview, Development
4. Save and redeploy

**Supabase Edge Functions:**
```bash
supabase secrets set REWARDFUL_SECRET_KEY=rwf_sec_...
supabase secrets set KIT_API_KEY=your_key
```

---

## Appendix B: Troubleshooting Guide

### Issue: Rewardful SDK Not Loading

**Symptoms:**
- `window.Rewardful` is undefined
- No referral detection
- Console error: "rewardful is not defined"

**Solution:**
1. Check index.html has Rewardful script:
   ```html
   <script async src='https://r.wdfl.co/rw.js' data-rewardful='rwf_pub_...'></script>
   ```
2. Verify API key is correct
3. Check browser console for script loading errors
4. Verify no ad blockers blocking Rewardful domain

---

### Issue: Affiliate Creation Returns 404

**Symptoms:**
- POST /api/referral/create-affiliate returns 404
- "Failed to create affiliate" error

**Solution:**
1. Check file exists: `/api/referral/create-affiliate.ts` (NOT `/app/api/`)
2. Verify Vercel deployment includes the file
3. Check Vercel function logs for errors
4. Ensure environment variables set in Vercel

---

### Issue: Credits Not Issued

**Symptoms:**
- Referee converts, but referrer doesn't get credit
- `referral_credits_earned` stays at 0

**Debugging:**
1. Check Stripe webhook delivery:
   ```
   Stripe Dashboard → Developers → Webhooks → View logs
   ```
2. Check Vercel function logs for webhook execution
3. Verify webhook handler logs show "First payment after trial"
4. Check database for referral_events with type="credit_issued"
5. Manually issue credit if webhook failed (see Rollback section)

---

### Issue: Credits Not Applied

**Symptoms:**
- User has credits, but not applied on billing
- Charged full amount despite credits

**Debugging:**
1. Check if `invoice.upcoming` webhook firing
2. Verify user has `referral_credits_remaining > 0`
3. Check Stripe subscription for trial extensions
4. Verify webhook logs show "Extended subscription by 7 days"
5. Check database for event type="credit_applied"

---

### Issue: Dashboard Flash Persists

**Symptoms:**
- Referred users still see dashboard briefly before ActivatingTrial

**Solution:**
1. Verify `setReferralSignupInProgress()` called BEFORE signup
2. Check `isReferralSignupInProgress()` check in App.tsx (line 287)
3. Verify sessionStorage has `referral_signup_in_progress: "true"`
4. Clear browser cache and test again

---

### Issue: Wrong Trial Duration

**Symptoms:**
- Influencer referral gets 7 days instead of 3
- Friend referral gets 3 days instead of 7

**Solution:**
1. Check campaign detection logic in `detectCampaign()`
2. Verify heuristic: UUID-like = friend, readable = influencer
3. Check ActivatingTrial URL params: `?campaign=X&trial=Y`
4. Verify Stripe checkout metadata has correct `trial_days`

---

## Appendix C: Future Enhancements

### Phase 7: Notification System (4 hours)

**Goal:** Notify users when they earn/use credits

**Implementation:**
1. Create notification service (`src/lib/notifications.ts`)
2. Add notifications table to database
3. Show in-app toast/banner
4. Optional: Email notifications via KIT

**User Experience:**
- "🎉 You earned 1 week free! John just became a paying customer."
- "💰 You saved $1.99 this week! 2 free weeks remaining."

---

### Phase 8: Leaderboard Referral Integration (6 hours)

**Goal:** Embed referral codes in leaderboard invite links

**Implementation:**
```
Current: /join/ABC123
Enhanced: /join/ABC123?via=a1b2c3d4
```

**Flow:**
1. User creates leaderboard
2. System appends their referral code to invite link
3. Friend joins leaderboard + gets referred
4. Dual benefit: Social + financial incentive

---

### Phase 9: Admin Dashboard (8 hours)

**Goal:** Internal tool to view all referrals and manually adjust credits

**Features:**
- Table of all referral pairs
- Filter by campaign type
- Manual credit issuance
- Commission payout tracking
- Export to CSV for accounting

---

### Phase 10: A/B Testing Different Incentives (Ongoing)

**Experiments:**
- Give 2 weeks / Get 1 week
- Give $5 / Get $5 account credit
- Referrer gets 1 month free after 5 conversions
- Gamification: Badges for referring 10, 50, 100 users

**Metrics to Track:**
- Referral rate (% users who share)
- Conversion rate (% clicks → signups → paid)
- Viral coefficient
- Customer lifetime value by acquisition source

---

## Appendix D: Quick Reference Commands

### Local Development

```bash
# Start Supabase
supabase start

# Run migrations
supabase db reset

# Start dev server
npm run dev

# Build for production
npm run build
```

### Database Queries

```sql
-- View all referrals
SELECT
  r.email as referrer,
  e.email as referee,
  re.event_type,
  re.created_at
FROM referral_events re
JOIN users r ON r.id = re.referrer_user_id
JOIN users e ON e.id = re.referee_user_id
ORDER BY re.created_at DESC;

-- Check user's credits
SELECT
  email,
  referral_credits_earned,
  referral_credits_remaining
FROM users
WHERE referral_credits_earned > 0;

-- Recent credit issuances
SELECT * FROM referral_events
WHERE event_type = 'credit_issued'
ORDER BY created_at DESC
LIMIT 10;
```

### Stripe CLI Testing

```bash
# Forward webhooks to localhost
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test webhook
stripe trigger invoice.payment_succeeded
```

---

## Document Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-12 | PM Agent | Initial PRD (GrowSurf, deprecated) |
| 2.0 | 2025-10-18 | PM Agent | Rewardful migration (single campaign) |
| 3.0 | 2025-10-18 | PM Agent | Dual campaign architecture (influencer + friend) |

---

**END OF DOCUMENT**

This PRD should be comprehensive enough for any AI agent or developer to pick up tomorrow and continue implementation. Good luck with the build! 🚀
