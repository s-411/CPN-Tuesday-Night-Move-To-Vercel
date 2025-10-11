# Quick Start Implementation Guide
## CPN "Give 1 Week / Get 1 Week" Referral Program

**Timeline:** 11 working days (approx. 3 weeks with buffer)
**Target:** Complete Phase I MVP

---

## ⚠️ BEFORE YOU START

**READ THIS FIRST:** [landmines.md](./landmines.md)

**Critical Requirements:**
- ✅ Supabase CLI installed and tested
- ✅ Local Supabase running successfully
- ✅ GrowSurf account created
- ✅ Stripe test mode account ready
- ✅ You've read the landmines document

---

## Day-by-Day Implementation Plan

### Day 1: Database Foundation (Story 1.1)

**Goal:** Add referral tracking to database without breaking existing functionality.

**Morning (2-3 hours):**

1. **Create local testing checkpoint:**
```bash
# Start local Supabase
cd /Users/steveharris/Documents/GitHub/CPN-Live
supabase start

# Open Studio to verify current state
open http://127.0.0.1:54323

# Document current table structure (screenshot users table)
```

2. **Create migration:**
```bash
supabase migration new add_referral_fields
```

3. **Add migration SQL** (see full code in [summary.md](./summary.md#story-11-database-schema-and-growsurf-foundation))

4. **Test migration locally:**
```bash
# Apply migration
supabase db reset

# Watch for errors - if any, STOP and fix before proceeding
```

**Afternoon (2-3 hours):**

5. **Verify existing functionality:**
```bash
# Start dev servers
npm run dev:api  # Terminal 1
npm run dev      # Terminal 2

# Test in browser (http://localhost:5173):
# - Login with existing user
# - View dashboard
# - Add girl profile
# - Add data entry
# - View analytics

# CRITICAL: If ANYTHING breaks, rollback migration immediately
```

6. **Inspect new schema:**
```bash
# Open Supabase Studio
open http://127.0.0.1:54323

# Verify:
# - users table has 5 new columns (all NULL for existing users)
# - referral_events table exists
# - RLS policies applied (check Policies tab)
```

7. **Document success:**
   - Screenshot users table schema
   - Screenshot referral_events table
   - Note any issues in a journal

**End of Day 1 Checklist:**
- [ ] Migration applied successfully
- [ ] All existing features work
- [ ] New tables/columns visible in Studio
- [ ] No errors in console or logs
- [ ] Migration file committed to git

---

### Day 2: Referral Detection (Story 1.2)

**Goal:** Create utilities to detect and persist referral context.

**Morning (2-3 hours):**

1. **Create utility files:**
   - Create `/src/lib/referral/utils.ts` (see full code in summary.md)
   - Create `/src/lib/referral/growsurf.ts` (see full code in summary.md)

2. **Load GrowSurf SDK:**
   - Edit `/index.html` to add GrowSurf script tag
   - Replace `YOUR_CAMPAIGN_KEY` with actual key from GrowSurf dashboard

3. **Initialize in App.tsx:**
   - Add imports for referral utilities
   - Add initialization logic to useEffect

**Afternoon (1-2 hours):**

4. **Test referral detection:**
```bash
# Navigate to: http://localhost:5173/?ref=TEST123

# In browser console, verify:
console.log(sessionStorage.getItem('referral_context'))
# Should output: {"isReferred":true,"referralCode":"TEST123",...}

# Refresh page (without ?ref param)
# Verify context persists from sessionStorage

# Clear sessionStorage and refresh
# Verify no referral context
```

5. **Test GrowSurf SDK loading:**
```bash
# In browser console:
window.growsurf
# Should output: object with GrowSurf methods

# If undefined, check:
# - index.html script tag correct
# - Campaign key valid
# - No console errors
```

**End of Day 2 Checklist:**
- [ ] Utility files created
- [ ] GrowSurf SDK loads without errors
- [ ] Referral detection works with ?ref= param
- [ ] SessionStorage persistence works
- [ ] Existing app functionality unaffected

---

### Day 3: Landing Page (Story 1.3)

**Goal:** Create marketing landing page with referral detection.

**Full Day (6-8 hours):**

1. **Create Landing.tsx component** (see PRD for full code)

2. **Update App.tsx routing:**
```typescript
// Show Landing for unauthenticated users at root path
if (!user && pathname === '/') {
  return <Landing />;
}
```

3. **Style landing page:**
   - Use cpn-dark background
   - cpn-yellow for CTAs
   - National2Condensed for headings
   - Mobile-first responsive layout

4. **Test landing page:**
```bash
# Test standard flow:
# 1. Navigate to http://localhost:5173/
# 2. Verify "Get Started" CTA (no banner)
# 3. Click CTA → Should navigate to /step-1

# Test referral flow:
# 1. Navigate to http://localhost:5173/?ref=TEST123
# 2. Verify "Try for Free" CTA + yellow banner
# 3. Verify banner text: "You were invited to CPN — get 1 week free when you join today."
# 4. Click CTA → Should open signup modal

# Test authenticated users:
# 1. Login
# 2. Navigate to /
# 3. Should redirect to dashboard (not show Landing)
```

**End of Day 3 Checklist:**
- [ ] Landing page created and styled
- [ ] Routing logic works correctly
- [ ] Referral banner displays when ?ref= present
- [ ] CTAs navigate correctly
- [ ] Mobile responsive
- [ ] No console errors

---

### Day 4: Signup Modal Enhancement (Story 1.4)

**Goal:** Add referral banner to signup modal and handle post-signup routing.

**Morning (3-4 hours):**

1. **Modify SignUp.tsx:**
```typescript
// Add to imports
import { getReferralContext } from '../lib/referral/utils';
import { generateReferralLink } from '../lib/referral/growsurf';

// Add referral banner to modal (conditional rendering)
const referralContext = getReferralContext();

{referralContext.isReferred && (
  <div className="bg-cpn-yellow/10 border border-cpn-yellow/50 rounded-lg p-4 mb-4">
    <p className="text-cpn-yellow text-sm">
      ✓ You're signing up with an invite - 1 week free!
    </p>
  </div>
)}
```

2. **Update onSuccess handler:**
```typescript
const handleSignUp = async () => {
  // ... existing signup logic ...

  // After successful signup:
  const { user } = await signUp(email, password);

  // Generate user's own referral link
  const referralLink = await generateReferralLink(user.id, email);

  // Store referral code in database
  await supabase.from('users').update({
    growsurf_referral_code: extractCodeFromLink(referralLink),
    referred_by_code: referralContext.isReferred ? referralContext.referralCode : null
  }).eq('id', user.id);

  // Log signup event to referral_events
  if (referralContext.isReferred) {
    await supabase.from('referral_events').insert({
      referrer_user_id: /* lookup referrer by code */,
      referee_user_id: user.id,
      event_type: 'signup',
      event_data: { referral_code: referralContext.referralCode }
    });
  }

  // Redirect based on referral context
  if (referralContext.isReferred) {
    // Redirect to Stripe checkout with referral context
    window.location.href = '/checkout?referral=true';
  } else {
    // Standard flow: redirect to onboarding Step 1
    goTo('/step-1');
  }
};
```

**Afternoon (2-3 hours):**

3. **Test signup flow:**
```bash
# Test standard signup (no referral):
# 1. Navigate to / → Click "Get Started"
# 2. Fill signup form → Submit
# 3. Should redirect to /step-1
# 4. Verify user created in Supabase Studio
# 5. Verify growsurf_referral_code populated

# Test referred signup:
# 1. Navigate to /?ref=TEST123
# 2. Click "Try for Free" → Signup modal opens
# 3. Verify yellow banner displays
# 4. Fill signup form → Submit
# 5. Should redirect to checkout (Story 1.5 not done yet, so expect error)
# 6. Verify user created with referred_by_code = 'TEST123'
# 7. Verify referral_events table has 'signup' event
```

**End of Day 4 Checklist:**
- [ ] Signup modal shows banner when referred
- [ ] Referral link generated for new users
- [ ] Database updated with referral codes
- [ ] Signup event logged to referral_events
- [ ] Routing logic works (redirect to checkout for referred users)
- [ ] Standard signup flow unaffected

---

### Day 5-6: Stripe Checkout Enhancement (Story 1.5)

**Goal:** Add trial period support and referral metadata to Stripe checkout.

**Day 5 Morning (3-4 hours):**

1. **Backup existing checkout route:**
```bash
cp app/api/checkout/route.ts app/api/checkout/route.ts.backup
```

2. **Modify /app/api/checkout/route.ts:**

Add parameters and logic for trial periods:

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    priceId,
    planType,
    referralContext, // NEW: { isReferred: boolean, referredByCode: string }
    trialPeriodDays = 0 // NEW: defaults to 0 for non-referred
  } = body;

  // ... existing auth and customer creation logic ...

  // Determine success URL based on referral context
  const baseUrl = env.app.url;
  const successUrl = referralContext?.isReferred
    ? `${baseUrl}/affiliate-step-1`  // NEW: Redirect to affiliate onboarding
    : `${baseUrl}/welcome-premium`;   // Existing: Standard welcome page

  const cancelUrl = referralContext?.isReferred
    ? `${baseUrl}/`                   // NEW: Back to landing
    : `${baseUrl}/step-4`;            // Existing: Back to onboarding

  // Create Stripe Checkout Session with trial support
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      supabase_user_id: user.id,
      plan_type: planType,
      referred_by_code: referralContext?.referredByCode || null, // NEW
      is_referral_signup: referralContext?.isReferred || false,  // NEW
    },
    subscription_data: {
      trial_period_days: trialPeriodDays, // NEW: 7 for referred users
      metadata: {
        supabase_user_id: user.id,
        plan_type: planType,
        referred_by_code: referralContext?.referredByCode || null,
        is_referral_signup: referralContext?.isReferred || false,
      },
    },
  });

  return NextResponse.json({ url: session.url });
}
```

**Day 5 Afternoon (2-3 hours):**

3. **Update SignUp.tsx to call checkout with referral context:**

```typescript
const handlePostSignup = async () => {
  const referralContext = getReferralContext();

  if (referralContext.isReferred) {
    // Call checkout API with referral context
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        priceId: STRIPE_CONFIG.prices.playerModeWeekly, // Default to weekly
        planType: 'weekly',
        referralContext: {
          isReferred: true,
          referredByCode: referralContext.referralCode,
        },
        trialPeriodDays: 7, // 7-day free trial
      }),
    });

    const { url } = await response.json();
    window.location.href = url; // Redirect to Stripe checkout
  } else {
    // Standard flow
    goTo('/step-1');
  }
};
```

**Day 6 Full Day (6-8 hours):**

4. **Test Stripe checkout:**

```bash
# Test standard checkout (existing flow):
# 1. Go through standard onboarding (Steps 1-4)
# 2. Choose Player Mode Weekly
# 3. Click "Activate Player Mode"
# 4. Should redirect to Stripe checkout
# 5. Complete checkout with test card: 4242 4242 4242 4242
# 6. Verify subscription created in Stripe Dashboard (NO trial)
# 7. Verify success redirect to /welcome-premium

# Test referred checkout (new flow):
# 1. Navigate to /?ref=TEST123
# 2. Sign up via referral link
# 3. Should redirect to Stripe checkout
# 4. Verify checkout page shows:
#    - "7 days free" messaging
#    - Both options: Weekly $1.99 and Annual $27
#    - "First charge: [date 7 days from now]"
# 5. Choose Player Mode Weekly
# 6. Complete checkout with test card
# 7. Verify subscription in Stripe Dashboard:
#    - trial_end set to 7 days from now
#    - metadata contains: referred_by_code, is_referral_signup: true
# 8. Verify success redirect to /affiliate-step-1 (won't exist yet, expect 404)
```

5. **Test backward compatibility:**

Test all existing checkout entry points:
- SubscriptionPage → Stripe checkout → Works
- Step4 (onboarding) → Stripe checkout → Works
- UpgradeModal → Stripe checkout → Works
- PaywallModal → Stripe checkout → Works

**End of Day 5-6 Checklist:**
- [ ] Checkout API supports trial periods
- [ ] Checkout API accepts referral context
- [ ] Trial period applies correctly for referred users
- [ ] Metadata saved to Stripe subscription
- [ ] Success/cancel URLs correct for both flows
- [ ] Backward compatibility maintained
- [ ] Stripe Dashboard shows trial subscriptions correctly

---

### Day 7-8: Affiliate Onboarding (Story 1.6)

**Goal:** Create simplified 3-step onboarding for referred users.

**Day 7 Full Day (6-8 hours):**

1. **Create affiliate onboarding pages:**

Create `/src/pages/affiliate/Step1.tsx`:
```typescript
// Similar to standard Step1.tsx but:
// - Step indicator shows (1/3) instead of (1/4)
// - Banner at top: "Welcome! You're on Player Mode with 7 days free."
// - Reuses GirlForm component
// - Navigates to /affiliate-step-2 on submit
```

Create `/src/pages/affiliate/Step2.tsx`:
```typescript
// Similar to standard Step2.tsx but:
// - Step indicator shows (2/3)
// - Reuses DataEntryForm component
// - Navigates to /affiliate-step-3 on submit
```

Create `/src/pages/affiliate/Step3.tsx`:
```typescript
// Similar to standard Step4.tsx but:
// - Step indicator shows (3/3)
// - Displays CPN results (metrics)
// - NO tier selection cards
// - Big "Enter the App" CTA button
// - Small text: "Your Player Mode trial is active. First charge: [date]"
// - On "Enter the App": commitOnboardingToSupabase() → navigate to /dashboard
```

2. **Update App.tsx routing:**

```typescript
// Add routes for affiliate onboarding
if (pathname === '/affiliate-step-1' && user) {
  return <AffiliateStep1 />;
}
if (pathname === '/affiliate-step-2' && user) {
  return <AffiliateStep2 />;
}
if (pathname === '/affiliate-step-3' && user) {
  return <AffiliateStep3 />;
}
```

**Day 8 Full Day (6-8 hours):**

3. **Style and polish affiliate flow:**
   - Ensure consistent design system usage
   - Add loading states
   - Add error handling
   - Mobile responsive testing

4. **Test complete referred user flow:**

```bash
# End-to-end referred user flow:
# 1. Navigate to /?ref=TEST123
# 2. Click "Try for Free"
# 3. Fill signup form → Submit
# 4. Redirects to Stripe checkout
# 5. Choose Player Mode Weekly
# 6. Complete checkout with test card (4242 4242 4242 4242)
# 7. Redirects to /affiliate-step-1
# 8. Fill girl profile form → Continue
# 9. Redirects to /affiliate-step-2
# 10. Fill data entry form → Continue
# 11. Redirects to /affiliate-step-3
# 12. See CPN results displayed
# 13. Click "Enter the App"
# 14. Redirects to /dashboard
# 15. Verify:
#     - User is logged in
#     - Girl profile exists in database
#     - Data entry exists in database
#     - User has Player Mode subscription (check profile)
#     - Dashboard displays correctly
```

**End of Day 7-8 Checklist:**
- [ ] Affiliate Step 1 created and working
- [ ] Affiliate Step 2 created and working
- [ ] Affiliate Step 3 created and working
- [ ] Routing logic correct
- [ ] Data persists across steps
- [ ] "Enter the App" provisions user correctly
- [ ] Complete flow tested end-to-end
- [ ] Mobile responsive

---

### Day 9-10: Refer & Earn Page (Story 1.7)

**Goal:** Create in-app page for users to view and share their referral link.

**Day 9 Morning (3-4 hours):**

1. **Create ReferAndEarn.tsx page** (see PRD for full code structure)

2. **Create API route for stats:**

Create `/app/api/referral/stats/route.ts`:
```typescript
export async function GET(request: NextRequest) {
  // Get authenticated user
  const supabase = createRouteHandlerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch user's referral data
  const { data: userData } = await supabase
    .from('users')
    .select('growsurf_referral_code, referral_credits_earned, referral_credits_remaining')
    .eq('id', user.id)
    .single();

  // Fetch referral events for this user
  const { data: events } = await supabase
    .from('referral_events')
    .select('*')
    .eq('referrer_user_id', user.id);

  // Count paid referrals
  const paidReferrals = events?.filter(e => e.event_type === 'first_payment').length || 0;

  // TODO: Fetch click stats from GrowSurf API (requires server-side call with secret key)
  const clicks = 0; // Placeholder

  return NextResponse.json({
    referralLink: `https://cost-per-nut.com/?ref=${userData.growsurf_referral_code}`,
    clicks,
    paidReferrals,
    creditsEarned: userData.referral_credits_earned,
    creditsRemaining: userData.referral_credits_remaining,
  });
}
```

**Day 9 Afternoon (3-4 hours):**

3. **Add navigation:**

Update `App.tsx` sidebar:
```typescript
<div className={`sidebar-item ${activeView === 'refer' ? 'active' : ''}`}
     onClick={() => setActiveView('refer')}>
  <Share2 size={20} />
  <span>Refer & Earn</span>
</div>
```

Update `MobileMenu.tsx` similarly.

4. **Test Refer & Earn page:**
```bash
# Login as user
# Click "Refer & Earn" in sidebar
# Verify:
# - Page loads without errors
# - Referral link displays (format: https://cost-per-nut.com/?ref=ABC123)
# - Copy button works (check clipboard)
# - Share buttons generate correct URLs
# - Stats display (should be 0 for new user)
```

**Day 10 Full Day (6-8 hours):**

5. **Implement share button functionality:**
   - SMS: `sms:?body=Check out CPN! ${link}`
   - WhatsApp: `https://wa.me/?text=${encodeURIComponent(message)}`
   - X (Twitter): `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`
   - TikTok: Copy link (platform-specific share dialogs not widely supported)

6. **Polish UI:**
   - Add loading states while fetching stats
   - Add error handling for API failures
   - Add empty states if no referrals yet
   - Add "How it works" section with program rules
   - Mobile responsive testing

**End of Day 9-10 Checklist:**
- [ ] Refer & Earn page created
- [ ] API route for stats working
- [ ] Navigation added to sidebar/mobile menu
- [ ] Referral link displays correctly
- [ ] Copy button works
- [ ] Share buttons functional
- [ ] Stats display correctly
- [ ] Mobile responsive
- [ ] Error handling in place

---

### Day 11: Final Stories & QA Prep

**Morning (Story 1.8 - Onboarding Nudge):**

1. Create simple modal component for onboarding nudge
2. Add logic to show once post-payment
3. Test localStorage flag works

**Afternoon (Stories 1.9-1.10 Setup):**

4. **Webhook Enhancement (Story 1.9) - SETUP ONLY:**
   - Modify `/app/api/stripe/webhook/route.ts` to handle `invoice.payment_succeeded`
   - Add logic to detect first payment after trial
   - Add credit issuance logic (Stripe coupon or balance transaction)
   - **DO NOT TEST YET** (requires 7-day wait or Stripe CLI simulation)

5. **Admin Analytics (Story 1.10) - BASIC SETUP:**
   - Create placeholder admin page
   - Create API route for analytics
   - **SKIP FULL IMPLEMENTATION** - can be completed later

---

## Testing Phases

### Phase 1: Local Testing (Throughout Implementation)

Test after each story completion:
- Unit tests for utilities
- Integration tests for API routes
- Manual browser testing

### Phase 2: Staging Deployment (After Day 11)

```bash
# Create Supabase preview branch
supabase branches create staging-referral-program

# Deploy to Vercel staging
vercel --prod=false

# Test complete flows on staging
# Test with real GrowSurf account (separate campaign)
# Test with Stripe test mode
```

### Phase 3: Production Deployment (Week 3-4)

See [summary.md](./summary.md#rollout-strategy) for detailed rollout plan.

---

## Daily Testing Checklist

Use this checklist every day to ensure nothing breaks:

- [ ] Dev servers start without errors (`npm run dev:api` + `npm run dev`)
- [ ] Login works with existing user
- [ ] Dashboard loads with data
- [ ] Add girl profile works
- [ ] Add data entry works
- [ ] No console errors
- [ ] No TypeScript errors (`npm run typecheck`)

---

## Emergency Rollback Procedures

### If Migration Breaks Production:

```bash
# Immediately rollback database
supabase db reset --linked

# If that fails, manually drop new columns:
# Connect to production DB via Studio
# Run SQL:
ALTER TABLE users DROP COLUMN IF EXISTS growsurf_referral_code;
ALTER TABLE users DROP COLUMN IF EXISTS referred_by_code;
-- etc for all new columns
DROP TABLE IF EXISTS referral_events;
```

### If Feature Breaks App:

```bash
# Set feature flag to false
# In Vercel dashboard:
ENABLE_REFERRAL_PROGRAM=false

# Redeploy immediately
```

---

## Success Criteria

By end of 11 days, you should have:

- [x] All database migrations tested and applied
- [x] Complete referred user flow working end-to-end
- [x] Standard (non-referred) flow still working
- [x] Refer & Earn page functional
- [x] No regressions in existing features
- [x] Ready for staging deployment

---

## Next Steps After Day 11

1. **Complete Story 1.9 (Webhook Testing):**
   - Use Stripe CLI to simulate webhook events
   - Test credit issuance logic
   - Test self-referral blocking

2. **Complete Story 1.10 (Admin Analytics):**
   - Finish admin dashboard
   - Add charts and visualizations
   - Test with sample data

3. **Story 1.11 (Full QA):**
   - Cross-browser testing
   - Cross-device testing
   - Performance testing
   - Regression testing

4. **Deploy to Staging:**
   - Test on staging environment
   - Get QA sign-off
   - Document any issues

5. **Production Launch:**
   - Deploy with feature flag OFF
   - Enable for beta users
   - Monitor metrics
   - Gradual rollout

---

## Resources

- **Full PRD:** [../referral-prd.md](../referral-prd.md)
- **Landmines:** [./landmines.md](./landmines.md)
- **Summary:** [./summary.md](./summary.md)
- **GrowSurf Docs:** [https://docs.growsurf.com](https://docs.growsurf.com)
- **Stripe Trials:** [https://stripe.com/docs/billing/subscriptions/trials](https://stripe.com/docs/billing/subscriptions/trials)
- **Supabase CLI:** [https://supabase.com/docs/guides/cli](https://supabase.com/docs/guides/cli)

---

**Remember:** Test after EVERY story. Don't batch multiple stories before testing. Read [landmines.md](./landmines.md) before starting each story.
