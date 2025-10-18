# ⚠️ DEPRECATED - DO NOT USE ⚠️

**This PRD is outdated and based on GrowSurf, which we are NOT using.**

**👉 SEE INSTEAD:** `docs/rewardful/simplified-implementation-plan.md`

**Date Deprecated:** 2025-10-18
**Reason:** Switched from GrowSurf to Rewardful for better affiliate/influencer program support

---

# CPN Brownfield Enhancement PRD (DEPRECATED)
## "Give 1 Week / Get 1 Week" Referral Program

**Version:** 1.0
**Status:** ~~Draft~~ DEPRECATED
**Last Updated:** 2025-10-12
**Author:** John (PM Agent)

---

## Table of Contents

1. [Intro Project Analysis and Context](#1-intro-project-analysis-and-context)
2. [Requirements](#2-requirements)
3. [User Interface Enhancement Goals](#3-user-interface-enhancement-goals)
4. [Technical Constraints and Integration Requirements](#4-technical-constraints-and-integration-requirements)
5. [Epic and Story Structure](#5-epic-and-story-structure)
6. [Epic Details](#6-epic-details)
7. [Rollout Plan](#7-rollout-plan)
8. [Success Metrics](#8-success-metrics)

---

## 1. Intro Project Analysis and Context

### 1.1 Analysis Source

- **IDE-based fresh analysis** of existing project documentation and codebase
- Project files reviewed: README.md, START_HERE.md, WHATS_DONE.md, package.json, existing onboarding flow, Stripe integration

### 1.2 Current Project State

**CPN (Cost Per Nut) v2** is a mobile-first relationship metrics tracking application that helps users calculate and analyze relationship efficiency metrics.

- **Primary Purpose**: Track dating expenses, time spent, and outcomes ("nuts") across multiple profiles, calculating metrics like Cost per Nut, Time per Nut, Cost per Hour, Nuts per Hour, and an overall Efficiency Score.

- **Current Tech Stack**:
  - Frontend: React 18.3, TypeScript 5.5, Vite 5.4, Tailwind CSS 3.4
  - Backend: Supabase (PostgreSQL, Auth, Realtime)
  - Payments: Stripe (Checkout, Webhooks, Customer Portal)
  - Charts: Recharts 3.2
  - Icons: Lucide React

- **Current State**: MVP (Phase 1) is fully implemented with:
  - Profile management (unlimited for Player Mode, 1 for Boyfriend Mode)
  - Data entry and real-time calculations
  - Dashboard and analytics with visualizations
  - Stripe subscription tiers (Boyfriend Mode: Free, Player Mode: $1.99/week or $27/year)
  - Leaderboards with private groups and invite tokens
  - Share features and data export

- **Recent Migration**: Recently migrated from Vite to Next.js for Stripe API routes; environment variables and Supabase client have been updated

### 1.3 Available Documentation

**Documentation Status:**
- ✅ Tech Stack Documentation (package.json, setup guides)
- ✅ Source Tree/Architecture (inferred from file structure and README)
- ⚠️ Coding Standards (Partial - TypeScript strict mode, Tailwind design system documented)
- ✅ API Documentation (Stripe API routes documented)
- ✅ External API Documentation (Supabase and Stripe integration documented)
- ⚠️ UX/UI Guidelines (Partial - Design system documented in README)
- ✅ Technical Debt Documentation (Migration guides and troubleshooting docs available)

**Assessment**: Documentation is sufficient for this enhancement. The codebase is well-documented with migration guides and setup instructions. No additional documentation tasks needed.

### 1.4 Enhancement Scope Definition

**Enhancement Type:**
- ✅ **Integration with New Systems** (GrowSurf referral platform)
- ✅ **New Feature Addition** (Referral program functionality)
- ⚠️ **Moderate-to-Significant Impact** (New UI surfaces, cross-domain tracking, Stripe credit system integration)

**Enhancement Description:**

Add a "Give 1 Week / Get 1 Week" referral program powered by GrowSurf. Users will receive a unique referral link upon signup, and when friends sign up using that link, the friend gets their first week free and the referrer earns a 1-week credit after the friend's first successful payment. This requires:
- Cross-domain referral tracking (cost-per-nut.com → app.cost-per-nut.com)
- Prominent in-app UI surfaces (Refer & Earn page)
- Onboarding nudges
- Integration with Stripe's credit system
- Simplified affiliate onboarding flow (3 steps vs standard 4 steps)
- Tier selection at Stripe checkout (Weekly or Annual with 7-day trial)

**Impact Assessment:**
- **Moderate-to-Significant Impact**
  - New GrowSurf SDK integration (client-side tracking)
  - New Stripe trial period configuration
  - New UI surfaces (landing page banner, Refer & Earn page, affiliate onboarding, modals)
  - Cross-domain cookie/session handling for referral attribution
  - Webhook enhancements for credit issuance after first payment
  - Modified checkout flow with tier selection for referred users
  - New database schema extensions

### 1.5 Goals and Background Context

**Goals:**
- Auto-generate and display a unique referral link for every user immediately upon signup
- Apply "Give 1 / Get 1" incentive: friend's first week is free ($0 at checkout with card required), referrer earns 1-week credit after friend's first payment
- Preserve referral context seamlessly across domains (landing page → app signup/checkout)
- Provide a prominent, easy-to-use Refer & Earn page with copy/share actions and simple stats
- Allow referred users to choose between Player Mode Weekly or Annual at checkout (both with 7-day trial)
- Nudge users to share their link during onboarding (post-signup or post-payment)
- Track basic program analytics (clicks, conversions, credits issued) for loop validation
- (Phase II/III) Integrate referral mechanics into leaderboard invite links for viral acceleration

**Background Context:**

CPN currently has a subscription-based revenue model with Boyfriend Mode (Free), Player Mode Weekly ($1.99/week), and Player Mode Annual ($27/year) tiers. The app is experiencing steady growth, but user acquisition is primarily organic with limited viral loops.

The product team identified that users are naturally inclined to share their results and discuss dating efficiency with friends, but there's no formal mechanism to incentivize and track referrals. The existing leaderboard feature shows strong social sharing behavior, making it an ideal future integration point.

This referral program will leverage existing user behavior by providing a clear, simple incentive structure. The "Give 1 / Get 1" model is low-friction (no cash payouts, just subscription credits), aligns with the product's value proposition (helping users save money on dating), and fits naturally into the existing Stripe subscription infrastructure.

The program is designed to be MVP-first (Phase I) with future phases adding leaderboard integration and potentially email automation.

### 1.6 Change Log

| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Initial PRD Draft | 2025-10-12 | v1.0 | Brownfield PRD for Give 1/Get 1 referral program | John (PM Agent) |

---

## 2. Requirements

### 2.1 Functional Requirements

**FR1**: The system shall integrate GrowSurf SDK on the landing page to capture referral attribution via URL parameters (e.g., `?ref=XXXXX`) and persist attribution across domains using cookies/session storage.

**FR2**: The landing page shall display a conditional referral banner ("You were invited to CPN — get 1 week free when you join today.") when referral attribution is detected.

**FR3**: The signup modal shall display a conditional "1 week free" banner when referral context is present in the session.

**FR4**: Upon successful signup, referred users shall be immediately redirected to Stripe checkout (bypassing standard onboarding Steps 1-4).

**FR5**: The Stripe checkout API route shall support trial periods (7 days, card required, $0 charge on day 1, first charge on day 8).

**FR6**: The Stripe checkout page shall present both subscription options to referred users:
- Player Mode Weekly: $1.99/week (after trial)
- Player Mode Annual: $27/year (after trial, Save 74%)

**FR7**: The Stripe checkout page shall clearly display "First 7 days free" and "First charge: [date]" for referred users.

**FR8**: Post-checkout, referred users shall be redirected to a simplified 3-step affiliate onboarding flow (Add Girl → Add Data → See Results), skipping the standard Step 4 (tier selection).

**FR9**: After completing affiliate onboarding Step 3, users shall see a "Enter the App" CTA that provisions them as Player Mode subscribers (Weekly or Annual based on checkout choice) and lands them in the main app.

**FR10**: Every user shall automatically receive a unique GrowSurf referral link upon account creation, accessible via a new "Refer & Earn" page in the app.

**FR11**: The "Refer & Earn" page shall display:
- User's personal referral link
- Copy button
- Share buttons (SMS, WhatsApp, X, TikTok)
- Simple stats: clicks, paid referrals, free weeks earned, free weeks remaining
- "How it works" explainer with program rules

**FR12**: The system shall display a one-time onboarding nudge (modal/toast) post-payment encouraging users to share their referral link ("Invite friends—you both get 1 week free").

**FR13**: The Stripe webhook handler shall detect when a referee completes their **first successful payment** (day 7 after trial ends) and trigger a reward issuance to the referrer.

**FR14**: Upon referee's first payment, the system shall issue a 1-week subscription credit to the referrer via Stripe (coupon or subscription credit).

**FR15**: The system shall block self-referrals by detecting matching email addresses or payment methods between referrer and referee.

**FR16**: An admin analytics dashboard shall display referral pairs (referrer → referee), reward status (pending, issued, voided), and program metrics (total referrals, conversion rate, credits issued).

**FR17** (Phase II/III): Leaderboard invite links shall include referral attribution (`/join/:leaderboardToken?ref=:growSurfCode`), and the join page shall display a referral banner with dual CTAs ("Join Leaderboard" vs "Join with 1 Week Free").

**FR18** (Phase II/III): Users who join via enhanced leaderboard invite + referral flow shall be automatically added to the leaderboard after completing affiliate onboarding.

### 2.2 Non-Functional Requirements

**NFR1**: The referral attribution system shall maintain 99.5% accuracy across domains (cost-per-nut.com → app.cost-per-nut.com) on modern browsers (Chrome, Firefox, Safari, Edge).

**NFR2**: The GrowSurf SDK integration shall not increase landing page load time by more than 200ms (measured via Lighthouse).

**NFR3**: The Stripe checkout API route shall respond within 2 seconds under normal load conditions.

**NFR4**: The referral link generation process shall complete within 1 second of account creation.

**NFR5**: The "Refer & Earn" page shall load and display user stats within 1.5 seconds.

**NFR6**: The webhook handler for issuing referrer credits shall process events within 5 seconds of receipt and retry up to 3 times on failure.

**NFR7**: All referral-related UI components (banners, modals, nudges) shall be mobile-responsive and match the existing CPN design system (cpn-yellow, cpn-dark, National2Condensed font).

**NFR8**: The system shall log all referral events (link generated, signup via referral, checkout completed, credit issued) for audit and analytics purposes.

**NFR9**: The enhancement shall not break existing authentication, onboarding, or checkout flows for non-referred users.

**NFR10**: The codebase shall maintain TypeScript strict mode compliance and follow existing file organization patterns ([src/pages](src/pages), [src/components](src/components), [src/lib](src/lib)).

### 2.3 Compatibility Requirements

**CR1: Existing API Compatibility** - The modified `/app/api/checkout/route.ts` must remain backward-compatible with existing calls from SubscriptionPage, Step4, UpgradeModal, and PaywallModal components. New `referralContext` and `trialPeriodDays` parameters shall be optional.

**CR2: Database Schema Compatibility** - The `users` table must be extended to include GrowSurf-related fields (`growsurf_referral_code`, `referred_by_code`, `referral_credits_earned`, `referral_credits_remaining`) without breaking existing queries or RLS policies.

**CR3: UI/UX Consistency** - All new UI surfaces (landing page, affiliate onboarding, Refer & Earn page, referral banners) shall adhere to the existing CPN design system: cpn-yellow (#f2f661), cpn-dark (#1f1f1f), cpn-dark2 (#2a2a2a), National2Condensed headings, ESKlarheit body text, and pill-shaped buttons (100px border-radius).

**CR4: Integration Compatibility** - The GrowSurf SDK integration shall not conflict with existing Supabase Realtime subscriptions, Stripe webhook handlers, or analytics tracking.

---

## 3. User Interface Enhancement Goals

### 3.1 Integration with Existing UI

**Design System Adherence:**
All new UI surfaces will strictly follow the existing CPN design system:

- **Colors:**
  - Primary: cpn-yellow (#f2f661) for CTAs, active states, highlights
  - Backgrounds: cpn-dark (#1f1f1f) for main surfaces, cpn-dark2 (#2a2a2a) for cards/modals
  - Text: cpn-white (#ffffff) for primary, cpn-gray (#ababab) for secondary

- **Typography:**
  - Headings: National2Condensed (bold)
  - Body: ESKlarheit

- **Component Patterns:**
  - Buttons: `.btn-cpn` (yellow, pill-shaped, 100px border-radius)
  - Cards: `.card-cpn` (dark, gray border, consistent padding)
  - Inputs: `.input-cpn` (dark, gray border, yellow focus ring)
  - Modals: Existing `Modal.tsx` component with dark overlay

**Component Reuse Strategy:**
- **Signup Modal**: Extend existing [SignUp.tsx](src/pages/SignUp.tsx) with conditional referral banner
- **Onboarding Forms**: Reuse `GirlForm` and `DataEntryForm` from existing Steps 1-2
- **Onboarding Layout**: Reuse [OnboardingLayout.tsx](src/components/OnboardingLayout.tsx) for affiliate flow
- **Share Buttons**: Leverage existing share patterns from ShareCenter and ShareModal

### 3.2 Modified/New Screens and Views

**New Screens:**

1. **Landing Page (`/` or `/home`)**
   - Purpose: Marketing entry point with referral detection
   - Key Elements:
     - Conditional referral banner (when `?ref=` param detected)
     - Hero headline + value proposition
     - Primary CTA: "Get Started" (standard) or "Try for free" (referred users)
   - Responsive: Mobile-first, single-column on mobile

2. **Affiliate Onboarding Step 1 (`/affiliate-step-1`)**
   - Reuses `GirlForm` component, step indicator (1/3)
   - Banner: "Welcome! You're on Player Mode with 7 days free."

3. **Affiliate Onboarding Step 2 (`/affiliate-step-2`)**
   - Reuses `DataEntryForm` component, step indicator (2/3)

4. **Affiliate Onboarding Step 3 (`/affiliate-step-3`)**
   - Displays CPN results with big "Enter the App" CTA
   - NO tier selection (already chosen at checkout)

5. **Refer & Earn Page (`/refer`)**
   - Heading: "Give 1 Week, Get 1 Week"
   - Referral link display with copy button
   - Share buttons: SMS, WhatsApp, X, TikTok
   - Stats cards: Total Clicks, Paid Referrals, Free Weeks Earned/Remaining
   - "How it works" section with program rules

6. **Enhanced Leaderboard Join Page (`/join/:token?ref=:code`) - Phase II/III**
   - Referral banner + leaderboard preview
   - Dual CTAs: "Join with 1 Week Free" (primary) vs "Join Leaderboard" (secondary)

**Modified Screens:**

1. **Signup Modal (existing [SignUp.tsx](src/pages/SignUp.tsx))**
   - Add conditional banner when referral context detected
   - Post-signup redirect: Checkout (if referred) or Step 1 (if standard)

2. **Sidebar Navigation (existing [App.tsx](src/App.tsx))**
   - Add "Refer & Earn" nav item (Share2 icon)
   - Position: Between "Share" and "Settings"

### 3.3 UI Consistency Requirements

**UC1**: All referral banners use consistent styling:
- Background: `bg-cpn-yellow/10`
- Border: `border border-cpn-yellow/50`
- Text: `text-cpn-yellow` for emphasis
- Padding: `p-4` (mobile), `p-6` (desktop)

**UC2**: The "Refer & Earn" page matches existing in-app page hierarchy

**UC3**: Share buttons reuse icon styling from existing ShareCenter

**UC4**: Affiliate onboarding maintains identical layout to standard onboarding

**UC5**: Landing page uses cpn-dark background (not white)

**UC6**: All modals/toasts use existing Modal.tsx and Toast component patterns

---

## 4. Technical Constraints and Integration Requirements

### 4.1 Existing Technology Stack

**Languages:** TypeScript 5.5 (strict mode), JavaScript/JSX

**Frameworks & Libraries:**
- Frontend: React 18.3, Vite 5.4
- Styling: Tailwind CSS 3.4
- Icons: Lucide React
- Charts: Recharts 3.2

**Database & Backend:**
- Database: Supabase PostgreSQL with RLS
- Authentication: Supabase Auth
- Realtime: Supabase Realtime subscriptions
- API Routes: Next.js API routes in `/app/api/`

**External Dependencies:**
- Payments: Stripe (API version 2024-10-28.acacia)
- New: **GrowSurf SDK** (to be added)

**Infrastructure:**
- Hosting: Vercel
- Domains: `cost-per-nut.com` (landing) → `app.cost-per-nut.com` (app)

### 4.2 Integration Approach

**Database Integration Strategy:**

Schema Extensions:
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

**API Integration Strategy:**

GrowSurf Integration:
- Client-side SDK loaded via CDN
- Initialize on landing page load
- Generate referral links on signup via API call
- Track events: signup, first_payment, credit_issued

Stripe API Enhancements:
- Modify [/app/api/checkout/route.ts](app/api/checkout/route.ts) to support `trialPeriodDays` parameter
- Add referral metadata to subscriptions
- Use Stripe balance transactions or coupons for credit issuance

**Frontend Integration Strategy:**

- **Referral Detection**: Utility function `detectReferralContext()` in `/src/lib/referral/utils.ts`
- **State Management**: SessionStorage for referral context persistence
- **Conditional Redirects**: Modify SignUp.tsx onSuccess handler

### 4.3 Code Organization and Standards

**File Structure:**
```
/src
  /pages
    /affiliate
      Step1.tsx
      Step2.tsx
      Step3.tsx
    ReferAndEarn.tsx
    Landing.tsx
  /components
    /referral
      ReferralBanner.tsx
      ReferralLinkDisplay.tsx
      ReferralStatsCards.tsx
  /lib
    /referral
      utils.ts
      growsurf.ts
/app/api
  /checkout
    route.ts (modified)
  /stripe/webhook
    route.ts (enhanced)
  /referral/stats
    route.ts (new)
/supabase/migrations
  YYYYMMDDHHMMSS_add_referral_fields.sql
```

**Coding Standards:**
- TypeScript strict mode required
- Functional components with hooks
- Tailwind classes only (no inline styles)
- Try/catch with user-facing error messages

### 4.4 Deployment and Operations

**Build Process:** No changes to existing Vite build

**Deployment Strategy:**
1. Deploy database migration
2. Deploy API route changes
3. Deploy frontend changes
4. Enable GrowSurf SDK in production
5. Test end-to-end flow

**Configuration Management:**

New Environment Variables:
```bash
NEXT_PUBLIC_GROWSURF_API_KEY=your_api_key
GROWSURF_SECRET_KEY=your_secret_key
NEXT_PUBLIC_REFERRAL_TRIAL_DAYS=7
NEXT_PUBLIC_REFERRAL_CREDIT_WEEKS=1
ENABLE_REFERRAL_PROGRAM=true
```

### 4.5 Risk Assessment and Mitigation

**Technical Risks:**

1. **GrowSurf SDK conflicts** → Async loading, staging tests
2. **Safari ITP breaks attribution** → GrowSurf uses first-party cookies, extensive Safari testing
3. **Stripe trial misconfiguration** → Test mode validation, QA sign-off required
4. **Webhook race conditions** → Reuse existing retry patterns, idempotency keys

**Integration Risks:**

1. **Breaks non-referred flow** → Feature flag for instant rollback, regression testing
2. **Breaks existing checkout calls** → Optional parameters, backward compatibility
3. **RLS policy conflicts** → Test migration on staging first

**Mitigation Strategies:**
- Pre-deployment: Staging tests, test mode validation
- Post-deployment: Monitoring dashboards, feature flags, detailed logging
- Ongoing: Weekly analytics review

---

## 5. Epic and Story Structure

### 5.1 Epic Approach

**Single Epic: "Give 1 Week / Get 1 Week" Referral Program**

**Rationale:**

1. **Cohesive Feature**: All components work together to deliver one user-facing feature
2. **Shared Technical Foundation**: GrowSurf SDK, referral context, schema changes are foundational
3. **Brownfield Best Practice**: Single epic with sequenced stories minimizes disruption
4. **Clear Phase Boundaries**: Phase I vs Phase II/III captured in story prioritization
5. **Team Coordination**: Unified progress tracking and clear "definition of done"

---

## 6. Epic Details

### Epic 1: "Give 1 Week / Get 1 Week" Referral Program

**Epic Goal:** Enable CPN users to invite friends via unique referral links, automatically applying a 7-day free trial to new signups and issuing 1-week subscription credits to referrers after the friend's first successful payment.

**Integration Requirements:** This epic enhances existing authentication, onboarding, checkout, and subscription management without breaking current functionality for non-referred users.

---

## Phase I Stories (MVP - Core Referral Program)

### Story 1.1: Database Schema and GrowSurf Foundation

**As a** platform engineer,
**I want** to extend the database schema and integrate GrowSurf SDK,
**so that** we have the foundational infrastructure for referral tracking.

**Acceptance Criteria:**

1. Migration adds columns to `users` table: `growsurf_referral_code`, `referred_by_code`, `referral_credits_earned`, `referral_credits_remaining`, `referral_stats`
2. New `referral_events` table created with proper schema
3. RLS policies applied (users view own events, service role full access)
4. GrowSurf account created and configured
5. Environment variables added and documented

**Integration Verification:**
- Migration runs without errors
- Existing queries unaffected
- RLS policies tested
- GrowSurf test API calls succeed

**Dependencies:** None
**Complexity:** Medium

---

### Story 1.2: Referral Context Detection and Utilities

**As a** developer,
**I want** utility functions to detect and persist referral context,
**so that** the application can identify referred users throughout their signup journey.

**Acceptance Criteria:**

1. New file `/src/lib/referral/utils.ts` with functions: `detectReferralContext()`, `persistReferralContext()`, `clearReferralContext()`, `getReferralContext()`
2. New file `/src/lib/referral/growsurf.ts` with functions: `initializeGrowSurf()`, `generateReferralLink()`, `trackReferralEvent()`
3. GrowSurf SDK loaded in index.html via CDN
4. Referral detection runs on app initialization
5. TypeScript types defined for referral context

**Integration Verification:**
- Navigate to `/?ref=TEST123` → context persists
- GrowSurf SDK loads without blocking render
- Existing app functionality unaffected

**Dependencies:** Story 1.1
**Complexity:** Low

---

### Story 1.3: Landing Page with Referral Detection

**As a** visitor clicking a referral link,
**I want** to see a landing page with a "1 week free" banner,
**so that** I understand the incentive and am motivated to sign up.

**Acceptance Criteria:**

1. New file `/src/pages/Landing.tsx` with hero, conditional referral banner, CTA
2. Styling matches CPN design system
3. Routing configured: `/` renders Landing for unauthenticated users
4. Referral detection logic runs on mount
5. Mobile-responsive layout

**Integration Verification:**
- Navigate to `/` → "Get Started" CTA, no banner
- Navigate to `/?ref=TEST123` → Banner + "Try for Free" CTA
- Click "Try for Free" → Signup modal with referral context
- Authenticated users redirect to dashboard

**Dependencies:** Story 1.2
**Complexity:** Medium

---

### Story 1.4: Signup Modal Enhancement with Referral Banner

**As a** referred visitor,
**I want** to see a "1 week free" reminder in the signup modal,
**so that** I'm confident the offer is being applied.

**Acceptance Criteria:**

1. [SignUp.tsx](src/pages/SignUp.tsx) accepts optional `referralContext` prop
2. Conditional banner displayed when referred
3. Post-signup redirect: Checkout (if referred) or Step 1 (if standard)
4. Referral codes stored in database during signup
5. Signup event logged to `referral_events` table

**Integration Verification:**
- Non-referred signup → No banner, redirect to Step 1
- Referred signup → Banner displayed, redirect to checkout
- Database: New user has codes populated
- `referral_events` contains signup event

**Dependencies:** Story 1.3
**Complexity:** Medium

---

### Story 1.5: Stripe Checkout API Enhancement with Trial Support

**As a** referred user,
**I want** to see both subscription options with a 7-day free trial at checkout,
**so that** I can choose my preferred billing cycle while getting 1 week free.

**Acceptance Criteria:**

1. [/app/api/checkout/route.ts](app/api/checkout/route.ts) accepts `referralContext` and `trialPeriodDays` parameters
2. When referred: Set trial to 7 days, add metadata, success URL to affiliate onboarding
3. Stripe session includes trial period and referral metadata
4. Checkout displays both options with clear trial messaging
5. Non-referred users unaffected (backward compatibility)

**Integration Verification:**
- POST with `referralContext` → Session includes 7-day trial
- Stripe checkout shows "7 days free" and both options
- POST without referralContext → Standard flow
- Existing checkout calls remain functional
- Stripe Dashboard confirms trial subscription with metadata

**Dependencies:** Story 1.4
**Complexity:** Medium

---

### Story 1.6: Affiliate Onboarding Flow (Steps 1-3)

**As a** referred user who completed Stripe checkout,
**I want** a simplified 3-step onboarding to quickly enter the app,
**so that** I can start using CPN without redundant tier selection.

**Acceptance Criteria:**

1. Three new pages: `/src/pages/affiliate/Step1.tsx`, `Step2.tsx`, `Step3.tsx`
2. Step 1: Reuses GirlForm, banner, step indicator (1/3)
3. Step 2: Reuses DataEntryForm, step indicator (2/3)
4. Step 3: Displays results, "Enter the App" CTA, NO tier selection
5. Routing logic prevents standard users from accessing affiliate routes

**Integration Verification:**
- Complete checkout → Redirect to `/affiliate-step-1`
- Complete Steps 1-3 → Land in dashboard as Player Mode user
- Database: Profile and entry created
- Referral context cleared
- Non-referred users redirected to standard onboarding

**Dependencies:** Story 1.5
**Complexity:** Medium

---

### Story 1.7: Refer & Earn In-App Page

**As a** CPN user,
**I want** a dedicated page to view my referral link and stats,
**so that** I can easily share with friends and track my rewards.

**Acceptance Criteria:**

1. New page `/src/pages/ReferAndEarn.tsx` with complete layout
2. New API route `/app/api/referral/stats/route.ts`
3. Page fetches stats on mount with loading/error states
4. Copy button with toast notification
5. Share buttons with platform-specific URLs
6. Navigation item added to sidebar and mobile menu

**Integration Verification:**
- Navigate to `/refer` → Page loads with link and stats
- Copy button → Link copied, toast displayed
- Share buttons → URLs generated correctly
- Stats match database values
- Mobile responsive

**Dependencies:** Story 1.1, Story 1.4
**Complexity:** Medium

---

### Story 1.8: Onboarding Nudge System

**As a** new user who just completed payment,
**I want** a friendly reminder to share my referral link,
**so that** I'm aware of the referral program and incentivized to invite friends.

**Acceptance Criteria:**

1. New component `/src/components/referral/OnboardingNudge.tsx`
2. One-time display using localStorage flag
3. Trigger on first app entry after checkout
4. Mobile-responsive styling

**Integration Verification:**
- Complete payment → Nudge displays
- Click "Copy Link" → Modal closes, flag set
- Refresh → Nudge does NOT appear again
- Existing users do not see nudge

**Dependencies:** Story 1.7
**Complexity:** Low

---

### Story 1.9: Webhook Enhancement for Credit Issuance

**As a** referrer,
**I want** to automatically receive 1-week credits when my referred friend completes their first payment,
**so that** I'm rewarded for successful referrals without manual intervention.

**Acceptance Criteria:**

1. [/app/api/stripe/webhook/route.ts](app/api/stripe/webhook/route.ts) handles `invoice.payment_succeeded` for first payment after trial
2. Credit issuance logic (Stripe coupon or balance transaction)
3. Database updates (increment credits, log event)
4. GrowSurf event tracking
5. Error handling and retry logic
6. Self-referral prevention (email and payment method matching)
7. Optional notification to referrer

**Integration Verification:**
- Test webhook → Credit issued, database updated
- First payment detection accurate
- Self-referrals blocked
- Events logged to `referral_events`
- GrowSurf dashboard shows conversion
- Stripe shows credit applied
- Existing webhook handlers unaffected

**Dependencies:** Story 1.5, Story 1.1
**Complexity:** High

---

### Story 1.10: Admin Analytics Dashboard

**As an** admin,
**I want** a dashboard to view referral pairs, reward status, and program metrics,
**so that** I can monitor program health and troubleshoot issues.

**Acceptance Criteria:**

1. New page `/src/pages/admin/ReferralAnalytics.tsx` (admin-only)
2. Dashboard sections: Program Metrics, Referral Pairs table, Recent Events log
3. New API route `/app/api/admin/referral-analytics/route.ts`
4. Data visualization using Recharts
5. Export to CSV functionality

**Integration Verification:**
- Admin access → Dashboard loads with metrics
- Non-admin → "Access Denied"
- Metrics match database
- Tables display correct data
- Charts render
- CSV export works

**Dependencies:** Story 1.1, Story 1.9
**Complexity:** Medium

---

### Story 1.11: End-to-End QA and Cross-Domain Testing

**As a** QA engineer,
**I want** comprehensive test coverage for all referral flows,
**so that** we're confident the feature works correctly in production.

**Acceptance Criteria:**

1. Manual test plan executed (7 test cases covering all flows)
2. Cross-domain testing on all major browsers
3. Mobile testing (responsive layouts, share buttons)
4. Performance testing (load time, API response, webhook processing)
5. Regression testing (existing features unaffected)
6. Bug fixes and polish

**Integration Verification:**
- All test cases pass on staging
- Cross-domain attribution ≥99% success rate
- Performance benchmarks met
- No regressions
- QA sign-off obtained

**Dependencies:** All previous stories (1.1-1.10)
**Complexity:** High

---

## Phase II/III Stories (Leaderboard Referral Acceleration) - Future

### Story 2.1: Enhanced Leaderboard Invite Links

**As a** leaderboard creator,
**I want** my leaderboard invite links to automatically include my referral code,
**so that** friends joining my leaderboard are also incentivized with 1 week free.

**Acceptance Criteria:**
1. Invite link generation appends `?ref={userGrowSurfCode}`
2. Backend stores creator's referral code in leaderboard table
3. Backward compatibility with existing links

**Dependencies:** Phase I complete
**Complexity:** Low

---

### Story 2.2: Enhanced Leaderboard Join Page with Dual CTAs

**As a** friend invited to a leaderboard,
**I want** to see the referral offer alongside the leaderboard preview,
**so that** I'm motivated to join AND sign up with the trial.

**Acceptance Criteria:**
1. `/join/:token` page detects `?ref=` param
2. Displays referral banner with leaderboard preview
3. Dual CTAs: "Join with 1 Week Free" vs "Join Leaderboard"
4. Integrates with referral signup flow

**Dependencies:** Story 2.1
**Complexity:** Medium

---

### Story 2.3: Auto-Join Leaderboard Post-Affiliate-Onboarding

**As a** referred user who joined via leaderboard invite,
**I want** to automatically be added to the leaderboard after onboarding,
**so that** I don't have to manually rejoin.

**Acceptance Criteria:**
1. Affiliate Step 3 checks for pending leaderboard join
2. Auto-joins user to leaderboard
3. Error handling for join failures

**Dependencies:** Story 2.2, Story 1.6
**Complexity:** Low

---

### Story 2.4: Leaderboard Referral Analytics

**As an** admin,
**I want** to see which leaderboards drive the most referrals,
**so that** I can understand the ROI of the leaderboard referral feature.

**Acceptance Criteria:**
1. Admin dashboard enhanced with leaderboard metrics
2. Tracks invite clicks and conversions per leaderboard
3. "Top Leaderboards by Referrals" chart

**Dependencies:** Story 2.3, Story 1.10
**Complexity:** Low

---

## 7. Rollout Plan

### Phase I (MVP - 4-6 weeks)
- Landing page with referral detection
- Simplified affiliate signup + onboarding flow
- Stripe 7-day trial integration with tier selection (Weekly OR Annual)
- Refer & Earn page (basic stats)
- Webhook logic for issuing credits
- Onboarding nudge
- Admin analytics dashboard
- End-to-end QA

### Phase II/III (Future - 2-4 weeks after Phase I validation)
- Enhanced leaderboard invite links with referral attribution
- Enhanced join page with dual CTAs
- Auto-join leaderboard post-onboarding
- Leaderboard-specific referral analytics

### Out of Scope (Phase IV+)
- Kit.com email automation
- Public leaderboards (separate from private groups)
- Cash payouts
- Multiple incentive variants

---

## 8. Success Metrics

### Phase I KPIs

**Acquisition Metrics:**
- Referral signup conversion rate (referred visitors → paid subscribers): Target ≥15%
- Viral coefficient (avg. referrals per user): Target ≥0.3 in first month
- Referral link share rate (users who share link): Target ≥25%

**Engagement Metrics:**
- Time to first share (minutes after signup): Target <10 minutes
- Referral link clicks per user: Target ≥3
- Refer & Earn page visit rate: Target ≥40% of active users

**Revenue Metrics:**
- % of new subscriptions via referrals: Target ≥20% by month 3
- Trial-to-paid conversion rate for referred users: Target ≥60%
- Credit redemption rate: Track % of earned credits actually used

**Technical Metrics:**
- Cross-domain attribution accuracy: Target ≥99.5%
- Landing page load time: Target <2 seconds with GrowSurf SDK
- Webhook processing success rate: Target ≥99%

### Phase II/III KPIs

**Leaderboard Referral Metrics:**
- % of leaderboard invites that include referral attribution: Target ≥50%
- Conversion rate: leaderboard invite clicks → paid referrals: Target ≥20%
- Avg. leaderboard size for users who share with referral links: Target 2x vs standard

---

**End of PRD**

---

## Appendix A: User Flow Diagrams

### Standard Flow (No Referral)
```
Landing → "Get Started" → Step 1 (Add Girl) → Step 2 (Add Data) →
Step 3 (Create Account) → Step 4 (Choose Tier) →
  If Free: Enter app (Boyfriend Mode)
  If Premium: Stripe Checkout → Enter app (Player Mode)
```

### Affiliate Flow (With Referral)
```
Landing (?ref=XXX) → "Try for Free" (referral banner) →
Signup Modal (1 week free banner) → Stripe Checkout (7-day trial, choose Weekly/Annual) →
Affiliate Step 1 (Add Girl) → Affiliate Step 2 (Add Data) →
Affiliate Step 3 (See Results) → "Enter the App" → Dashboard (Player Mode)
```

### Credit Issuance Flow
```
Referee signs up (via referral) → Completes Stripe checkout (trial starts) →
Day 7: First payment succeeds → Webhook fires →
Referrer credit issued (1 week) → Database updated → GrowSurf notified
```

---

## Appendix B: Database Schema

### users table (extensions)
```sql
growsurf_referral_code TEXT
referred_by_code TEXT
referral_credits_earned INTEGER DEFAULT 0
referral_credits_remaining INTEGER DEFAULT 0
referral_stats JSONB DEFAULT '{}'::jsonb
```

### referral_events table (new)
```sql
id UUID PRIMARY KEY
referrer_user_id UUID (FK to auth.users)
referee_user_id UUID (FK to auth.users)
event_type TEXT
event_data JSONB
created_at TIMESTAMPTZ
```

---

## Appendix C: API Endpoints

### New Endpoints
- `POST /api/referral/stats` - Fetch user's referral stats
- `POST /api/admin/referral-analytics` - Fetch admin analytics data

### Modified Endpoints
- `POST /api/checkout` - Added `referralContext` and `trialPeriodDays` parameters
- `POST /api/stripe/webhook` - Enhanced to handle credit issuance

---

## Appendix D: Environment Variables

```bash
# GrowSurf
NEXT_PUBLIC_GROWSURF_API_KEY=your_api_key
GROWSURF_SECRET_KEY=your_secret_key

# Referral Config
NEXT_PUBLIC_REFERRAL_TRIAL_DAYS=7
NEXT_PUBLIC_REFERRAL_CREDIT_WEEKS=1
ENABLE_REFERRAL_PROGRAM=true
```
