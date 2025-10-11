# Referral Program Implementation Summary

**Project:** CPN "Give 1 Week / Get 1 Week" Referral Program
**Status:** Ready for Implementation
**Timeline:** 4-6 weeks (Phase I MVP)
**Last Updated:** 2025-10-12

---

## Executive Summary

This document summarizes the comprehensive plan to implement a GrowSurf-powered referral program for CPN. When complete, every user will have a unique referral link that gives friends 1 week free (7-day trial with card required) and earns the referrer 1 week of subscription credit after the friend's first successful payment.

### Key Benefits

- **Viral Growth Loop**: Turn satisfied users into advocates
- **Low-Friction Incentive**: No cash payouts, just subscription credits
- **Tier Choice at Checkout**: Referred users choose Weekly ($1.99) or Annual ($27), both with 7-day trial
- **Simplified Onboarding**: 3-step affiliate flow (vs standard 4-step) for faster time-to-value
- **Future Enhancement**: Phase II/III integrates referral mechanics into leaderboard invites for viral acceleration

### Core Components

1. **GrowSurf Integration**: Client-side SDK for referral tracking and link generation
2. **Landing Page**: Marketing entry point with referral detection and conditional "1 week free" banner
3. **Stripe Trial Support**: Modified checkout API to support 7-day trial periods with tier selection
4. **Affiliate Onboarding**: Simplified 3-step flow (Add Girl → Add Data → See Results → Enter App)
5. **Refer & Earn Page**: In-app hub for viewing personal referral link, stats, and sharing
6. **Webhook Enhancement**: Automatic credit issuance after referee's first payment (day 7)
7. **Admin Analytics**: Dashboard to monitor referral pairs, conversions, and program health

---

## Phase I Implementation (11 Stories)

### Story Breakdown

| Story | Title | Complexity | Dependencies | Est. Time |
|-------|-------|------------|--------------|-----------|
| 1.1 | Database Schema & GrowSurf Foundation | Medium | None | 1 day |
| 1.2 | Referral Context Detection & Utilities | Low | 1.1 | 0.5 day |
| 1.3 | Landing Page with Referral Detection | Medium | 1.2 | 1 day |
| 1.4 | Signup Modal Enhancement | Medium | 1.3 | 1 day |
| 1.5 | Stripe Checkout API Enhancement | Medium | 1.4 | 1.5 days |
| 1.6 | Affiliate Onboarding Flow (Steps 1-3) | Medium | 1.5 | 2 days |
| 1.7 | Refer & Earn In-App Page | Medium | 1.1, 1.4 | 2 days |
| 1.8 | Onboarding Nudge System | Low | 1.7 | 0.5 day |
| 1.9 | Webhook Enhancement for Credit Issuance | High | 1.5, 1.1 | 2 days |
| 1.10 | Admin Analytics Dashboard | Medium | 1.1, 1.9 | 1.5 days |
| 1.11 | End-to-End QA & Cross-Domain Testing | High | All | 3 days |

**Total Estimated Time:** ~16 days (3-4 weeks with buffer)

---

## Quick Start Implementation Guide

This guide walks you through implementing the referral program step-by-step. **CRITICAL:** Read [landmines.md](./landmines.md) FIRST before starting any implementation.

### Prerequisites

Before starting, ensure you have:

- [x] Supabase CLI installed (`supabase --version`)
- [x] Local Supabase running (`supabase start`)
- [x] GrowSurf account created (sign up at [growsurf.com](https://growsurf.com))
- [x] Test Stripe account with test mode enabled
- [x] Development environment with both Vite and Vercel dev servers running
- [x] Read [landmines.md](./landmines.md) thoroughly

### Environment Setup

#### Step 1: Create GrowSurf Account

1. Sign up at [growsurf.com](https://growsurf.com)
2. Create a new campaign: "CPN Give 1 / Get 1 Referral Program"
3. Configure rewards:
   - **Participant reward**: 7-day free trial (handled by Stripe, not GrowSurf)
   - **Referrer reward**: 1-week credit (handled by Stripe webhook, tracked in GrowSurf)
4. Copy API keys:
   - Publishable Key (for client-side)
   - Secret Key (for server-side)

#### Step 2: Add Environment Variables

Add to your `.env.local`:

```bash
# GrowSurf
NEXT_PUBLIC_GROWSURF_API_KEY=gs_pk_xxxxxxxxxxxxxxxx
GROWSURF_SECRET_KEY=gs_sk_xxxxxxxxxxxxxxxx

# Referral Program Config
NEXT_PUBLIC_REFERRAL_TRIAL_DAYS=7
NEXT_PUBLIC_REFERRAL_CREDIT_WEEKS=1
ENABLE_REFERRAL_PROGRAM=false  # Start disabled for safety
```

Add to Vercel dashboard (for production deployment):
- Same variables as above
- Set `ENABLE_REFERRAL_PROGRAM=false` initially

#### Step 3: Create Local Testing Database

**CRITICAL:** Always test migrations locally first!

```bash
# Ensure local Supabase is running
supabase status

# If not running, start it
supabase start

# Verify you can access Studio
open http://127.0.0.1:54323
```

---

## Story-by-Story Implementation

### Story 1.1: Database Schema and GrowSurf Foundation

**Goal:** Extend database schema for referral tracking without breaking existing functionality.

**Testing Checkpoint:** After this story, verify all existing queries still work.

#### Steps:

1. **Create migration file:**

```bash
cd /Users/steveharris/Documents/GitHub/CPN-Live
supabase migration new add_referral_fields
```

This creates a file like: `supabase/migrations/YYYYMMDDHHMMSS_add_referral_fields.sql`

2. **Add migration SQL:**

Open the new migration file and add:

```sql
-- Add referral tracking columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS growsurf_referral_code TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referred_by_code TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_credits_earned INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_credits_remaining INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_stats JSONB DEFAULT '{}'::jsonb;

-- Create index for faster referral code lookups
CREATE INDEX IF NOT EXISTS idx_users_growsurf_referral_code ON public.users(growsurf_referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by_code ON public.users(referred_by_code);

-- Create referral_events table for audit log
CREATE TABLE IF NOT EXISTS public.referral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('signup', 'first_payment', 'credit_issued', 'credit_voided', 'self_referral_blocked')),
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for referral_events
CREATE INDEX IF NOT EXISTS idx_referral_events_referrer ON public.referral_events(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_events_referee ON public.referral_events(referee_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_events_type ON public.referral_events(event_type);
CREATE INDEX IF NOT EXISTS idx_referral_events_created ON public.referral_events(created_at DESC);

-- Enable RLS on referral_events
ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own referral events (as referrer or referee)
CREATE POLICY "Users can view own referral events" ON public.referral_events
  FOR SELECT
  USING (
    auth.uid() = referrer_user_id OR auth.uid() = referee_user_id
  );

-- Policy: Service role (backend) has full access for webhook processing
-- This is implicit - service role bypasses RLS

-- Add helpful comments
COMMENT ON COLUMN public.users.growsurf_referral_code IS 'User''s unique GrowSurf referral code (e.g., ABC123)';
COMMENT ON COLUMN public.users.referred_by_code IS 'GrowSurf code of the user who referred this user';
COMMENT ON COLUMN public.users.referral_credits_earned IS 'Total number of free weeks earned from referrals';
COMMENT ON COLUMN public.users.referral_credits_remaining IS 'Remaining free weeks that can be applied to future invoices';
COMMENT ON TABLE public.referral_events IS 'Audit log of all referral program events';
```

3. **Test migration locally:**

```bash
# Reset local database and apply all migrations
supabase db reset

# Verify migration applied successfully
# Check output for errors, especially in the referral_events table creation
```

4. **Verify existing functionality:**

```bash
# Start both dev servers
# Terminal 1:
npm run dev:api

# Terminal 2:
npm run dev

# Open http://localhost:5173
# Test:
# - Login with existing user
# - View dashboard (verify data loads)
# - Add new girl profile
# - Add data entry
# - View analytics

# All existing features should work unchanged
```

5. **Inspect new schema in Supabase Studio:**

```bash
open http://127.0.0.1:54323

# Navigate to Table Editor
# Verify:
# - users table has new columns (growsurf_referral_code, etc.)
# - referral_events table exists with correct schema
# - RLS policies are applied
```

**Success Criteria:**
- ✅ Migration runs without errors
- ✅ All existing user queries work (login, profile fetch, data entry)
- ✅ New columns appear in users table (all nullable)
- ✅ referral_events table created with RLS enabled
- ✅ No errors in console or backend logs

**Rollback If Needed:**

If migration fails or breaks existing functionality:

```bash
# Rollback by recreating the database
supabase db reset

# Remove the failed migration file
rm supabase/migrations/YYYYMMDDHHMMSS_add_referral_fields.sql

# Fix the migration SQL, then try again
```

---

### Story 1.2: Referral Context Detection and Utilities

**Goal:** Create utility functions to detect and persist referral context throughout the user journey.

**Testing Checkpoint:** Verify referral detection works with URL params.

#### Steps:

1. **Create utility files:**

Create `/src/lib/referral/utils.ts`:

```typescript
/**
 * Referral Context Utilities
 * Detects and persists referral attribution across the signup journey
 */

export interface ReferralContext {
  isReferred: boolean;
  referralCode: string | null;
  referredAt?: string; // ISO timestamp
}

const STORAGE_KEY = 'referral_context';

/**
 * Detects referral context from URL params, sessionStorage, or GrowSurf SDK
 */
export function detectReferralContext(): ReferralContext {
  // Check URL params first
  const urlParams = new URLSearchParams(window.location.search);
  const refParam = urlParams.get('ref');

  if (refParam) {
    return {
      isReferred: true,
      referralCode: refParam,
      referredAt: new Date().toISOString(),
    };
  }

  // Check sessionStorage
  const stored = getReferralContext();
  if (stored.isReferred) {
    return stored;
  }

  // Check GrowSurf SDK state (if initialized)
  if (typeof window !== 'undefined' && (window as any).growsurf) {
    const grsData = (window as any).growsurf.getReferralData?.();
    if (grsData?.referralCode) {
      return {
        isReferred: true,
        referralCode: grsData.referralCode,
        referredAt: new Date().toISOString(),
      };
    }
  }

  return { isReferred: false, referralCode: null };
}

/**
 * Persists referral context to sessionStorage
 */
export function persistReferralContext(code: string): void {
  const context: ReferralContext = {
    isReferred: true,
    referralCode: code,
    referredAt: new Date().toISOString(),
  };

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(context));
  } catch (error) {
    console.error('Failed to persist referral context:', error);
  }
}

/**
 * Retrieves stored referral context from sessionStorage
 */
export function getReferralContext(): ReferralContext {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to retrieve referral context:', error);
  }

  return { isReferred: false, referralCode: null };
}

/**
 * Clears referral context from sessionStorage
 */
export function clearReferralContext(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear referral context:', error);
  }
}
```

Create `/src/lib/referral/growsurf.ts`:

```typescript
/**
 * GrowSurf SDK Integration
 * Handles referral link generation and event tracking
 */

const GROWSURF_API_KEY = import.meta.env.NEXT_PUBLIC_GROWSURF_API_KEY ||
                         import.meta.env.VITE_GROWSURF_API_KEY || '';

/**
 * Initializes GrowSurf SDK (should be called once on app mount)
 */
export function initializeGrowSurf(): void {
  if (typeof window === 'undefined' || !GROWSURF_API_KEY) {
    console.warn('GrowSurf SDK not initialized: missing API key or running on server');
    return;
  }

  // GrowSurf SDK should be loaded via CDN in index.html
  // This just verifies it's ready
  if ((window as any).growsurf) {
    console.log('GrowSurf SDK initialized successfully');
  } else {
    console.warn('GrowSurf SDK not loaded - check index.html');
  }
}

/**
 * Generates a unique referral link for a user
 * Calls GrowSurf API to create participant and return link
 */
export async function generateReferralLink(
  userId: string,
  email: string
): Promise<string | null> {
  if (!GROWSURF_API_KEY) {
    console.error('GrowSurf API key not configured');
    return null;
  }

  try {
    const response = await fetch('https://api.growsurf.com/v2/participant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROWSURF_API_KEY}`,
      },
      body: JSON.stringify({
        email,
        referrerId: userId, // Use Supabase user ID as referrer ID
      }),
    });

    if (!response.ok) {
      throw new Error(`GrowSurf API error: ${response.status}`);
    }

    const data = await response.json();
    return data.referralLink || data.shareLink || null;
  } catch (error) {
    console.error('Failed to generate referral link:', error);
    return null;
  }
}

/**
 * Tracks a referral event in GrowSurf
 */
export async function trackReferralEvent(
  eventType: string,
  data: Record<string, any>
): Promise<void> {
  if (!GROWSURF_API_KEY) {
    return;
  }

  try {
    await fetch('https://api.growsurf.com/v2/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROWSURF_API_KEY}`,
      },
      body: JSON.stringify({
        eventType,
        ...data,
      }),
    });
  } catch (error) {
    console.error('Failed to track GrowSurf event:', error);
  }
}
```

2. **Load GrowSurf SDK in HTML:**

Edit `/index.html` to add GrowSurf SDK:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/CPN fav.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cost per Nut</title>

    <!-- GrowSurf SDK -->
    <script src="https://app.growsurf.com/growsurf.js" async defer data-grsf-campaign="YOUR_CAMPAIGN_KEY"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Note:** Replace `YOUR_CAMPAIGN_KEY` with your actual GrowSurf campaign key from your dashboard.

3. **Initialize referral detection in App:**

Edit `/src/App.tsx` to detect referral context on mount:

```typescript
// Add to imports at top
import { detectReferralContext, persistReferralContext } from './lib/referral/utils';
import { initializeGrowSurf } from './lib/referral/growsurf';

// Add to AppContent component, inside the main useEffect
useEffect(() => {
  // Initialize GrowSurf SDK
  initializeGrowSurf();

  // Detect and persist referral context
  const referralContext = detectReferralContext();
  if (referralContext.isReferred && referralContext.referralCode) {
    persistReferralContext(referralContext.referralCode);
    console.log('Referral detected:', referralContext.referralCode);
  }
}, []);
```

4. **Test referral detection:**

```bash
# Ensure both dev servers are running
# Navigate to http://localhost:5173/?ref=TEST123

# Open browser console
# You should see: "Referral detected: TEST123"

# Verify sessionStorage:
# In console: sessionStorage.getItem('referral_context')
# Should return: {"isReferred":true,"referralCode":"TEST123","referredAt":"..."}

# Refresh the page (without ?ref param)
# Referral context should persist from sessionStorage
```

**Success Criteria:**
- ✅ GrowSurf SDK loads without errors
- ✅ Referral detection works with `?ref=` URL param
- ✅ Referral context persists in sessionStorage
- ✅ No errors in console
- ✅ Existing app functionality unaffected

---

### Story 1.3: Landing Page with Referral Detection

**Goal:** Create a marketing landing page that detects referral links and displays a "1 week free" banner.

**Testing Checkpoint:** Verify landing page displays correct CTA based on referral context.

#### Implementation:

1. Create `/src/pages/Landing.tsx` (see full PRD for complete code)
2. Update routing in `App.tsx` to show Landing for unauthenticated users
3. Test:
   - Visit `/` → Should see "Get Started" CTA (no banner)
   - Visit `/?ref=TEST123` → Should see "Try for Free" CTA + yellow referral banner
   - Click CTA → Should open signup modal

---

### Story 1.4-1.11: Continue Implementation

See the [full PRD](../referral-prd.md) for detailed implementation steps for remaining stories.

**Key Testing Checkpoints:**

- **After Story 1.5 (Checkout API):** Test backward compatibility with existing checkout calls
- **After Story 1.6 (Affiliate Onboarding):** Test complete referred user flow end-to-end
- **After Story 1.9 (Webhook):** Test with Stripe CLI webhook forwarding (don't wait 7 days!)
- **Story 1.11 (QA):** Full regression testing on all browsers

---

## Testing Strategy

### Local Development Testing

**Phase 1: Unit Testing**
- Test each utility function individually
- Test API routes with Postman/curl
- Test database queries in Supabase Studio

**Phase 2: Integration Testing**
- Test complete user flows (referred and non-referred)
- Test cross-domain attribution (if using separate domains locally)
- Test webhook processing with Stripe CLI

**Phase 3: Regression Testing**
- Verify all existing features still work
- Test with existing user accounts
- Test subscription management and payments

### Staging Deployment Testing

**Use Supabase Preview Environment:**

```bash
# Create a preview branch for staging
supabase branches create staging-referral-program

# Deploy to staging environment (Vercel preview deploy)
vercel --prod=false

# Run full test suite on staging
# Test with real GrowSurf account (separate campaign for staging)
# Test with Stripe test mode
```

**Critical Staging Tests:**
- Cross-browser testing (Chrome, Firefox, Safari, Edge)
- Cross-device testing (desktop, mobile, tablet)
- Cross-domain attribution testing
- Performance testing (Lighthouse scores)

### Production Deployment Checklist

- [ ] All stories completed and tested locally
- [ ] Staging deployment tested successfully
- [ ] Feature flag set to `ENABLE_REFERRAL_PROGRAM=false` in production
- [ ] Database migration tested on Supabase staging project
- [ ] GrowSurf production campaign configured
- [ ] Stripe production webhook configured
- [ ] Rollback procedure documented and tested
- [ ] Monitoring dashboards configured
- [ ] Team trained on admin analytics dashboard
- [ ] QA sign-off obtained

---

## Rollout Strategy

### Week 1: Foundation (Stories 1.1-1.2)
- Database migration
- Referral detection utilities
- Local testing only

### Week 2: User-Facing Features (Stories 1.3-1.6)
- Landing page
- Signup enhancements
- Stripe checkout modifications
- Affiliate onboarding
- Deploy to staging for QA

### Week 3: In-App Features (Stories 1.7-1.8)
- Refer & Earn page
- Onboarding nudge
- Staging testing

### Week 4: Backend & Admin (Stories 1.9-1.10)
- Webhook enhancement
- Admin analytics
- Integration testing

### Week 5: QA & Launch Prep (Story 1.11)
- End-to-end testing
- Cross-browser/device testing
- Performance testing
- Bug fixes

### Week 6: Production Launch
- Deploy to production with feature flag OFF
- Enable for internal users first (5-10 beta testers)
- Monitor for 24-48 hours
- Gradual rollout (10% → 50% → 100%)

---

## Success Metrics

### Week 1 Metrics (Post-Launch)
- Referral link share rate: Target ≥20% of active users
- Cross-domain attribution accuracy: Target ≥99%
- No increase in error rates or page load times

### Month 1 Metrics
- Referrals per user: Target ≥0.3
- Referral signup conversion rate: Target ≥15%
- Trial-to-paid conversion (referred users): Target ≥60%

### Month 3 Metrics
- % of new subscriptions via referrals: Target ≥20%
- Viral coefficient: Target ≥0.5
- Referrer credit redemption rate: Target ≥80%

---

## Troubleshooting Common Issues

### Issue: Referral context not persisting across domains

**Solution:**
- Verify GrowSurf SDK is loaded on both domains
- Check browser console for cookie/CORS errors
- Test with Safari (most restrictive ITP policies)

### Issue: Stripe trial not applying at checkout

**Solution:**
- Verify `trialPeriodDays` parameter is being passed to checkout API
- Check Stripe Dashboard for trial period configuration on price objects
- Test with Stripe CLI to see exact session parameters

### Issue: Webhook not issuing credits

**Solution:**
- Check webhook logs in Stripe Dashboard
- Verify `is_referral_signup` metadata is present on subscription
- Test with Stripe CLI webhook forwarding: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Check `referral_events` table for event logs

### Issue: Self-referral not blocked

**Solution:**
- Verify email matching logic in webhook handler
- Check Stripe payment method fingerprint matching
- Review `referral_events` logs for blocked attempts

---

## Next Steps

1. **Read [landmines.md](./landmines.md) thoroughly** before starting implementation
2. **Set up prerequisites**: GrowSurf account, local Supabase, environment variables
3. **Start with Story 1.1**: Database migration (test locally first!)
4. **Test after each story**: Don't batch multiple stories before testing
5. **Document any deviations**: Update this doc if you encounter issues or change approach

---

## Additional Resources

- **Full PRD:** [../referral-prd.md](../referral-prd.md)
- **Landmines & Safety:** [./landmines.md](./landmines.md)
- **Quick Start Guide:** [./quick-start-guide.md](./quick-start-guide.md)
- **GrowSurf Documentation:** [https://docs.growsurf.com](https://docs.growsurf.com)
- **Stripe Trial Subscriptions:** [https://stripe.com/docs/billing/subscriptions/trials](https://stripe.com/docs/billing/subscriptions/trials)
- **Supabase Migrations:** [https://supabase.com/docs/guides/cli/local-development](https://supabase.com/docs/guides/cli/local-development)

---

**Questions or Issues?** Review the landmines document or consult the full PRD for detailed specifications.
