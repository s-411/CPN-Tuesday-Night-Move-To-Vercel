# Rewardful Referral Program - Simplified Implementation Plan
**Version:** 2.0 (Updated for Rewardful)
**Date:** 2025-10-18
**Status:** Active Implementation Plan
**Platform:** Rewardful ($99/month Growth Plan)

---

## Overview

This implementation plan uses **Rewardful** instead of GrowSurf to deliver a complete referral program with both:
1. **Customer referral program** - Every user gets an automatic referral link (give-1-get-1)
2. **Influencer affiliate program** - Future-ready for manual influencer campaigns with cash commissions

We're keeping the implementation minimal while still delivering core referral functionality, and positioning ourselves to easily add influencer campaigns later.

---

## Why Rewardful Over GrowSurf

**Cost Savings:**
- Rewardful Growth: $99/month vs GrowSurf: $179/month
- Saves $960/year ($1,500 AUD)

**Better for Our Use Case:**
- ✅ Built-in affiliate payout system (PayPal/Wise)
- ✅ Supports multiple campaigns (customer + influencer)
- ✅ Recurring commission tracking (not just one-time)
- ✅ Tighter Stripe integration (two-way sync)
- ✅ Automated commission calculations
- ✅ Custom domain for affiliate portal

**What We're Getting:**
- Full customer referral program (automatic affiliate creation)
- Affiliate portal for future influencers
- Automated PayPal/Wise payouts
- Double-sided rewards (give-1-get-1)
- Custom domain: `affiliates.cost-per-nut.com` (optional)

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
- ✅ No affiliate-specific onboarding pages

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

### Phase 1: Setup (30-45 minutes)

**Goal:** Set up Rewardful account and foundational tools without writing code.

#### Task 1.1: Create Rewardful Account
1. Sign up at https://www.rewardful.com
2. Start 14-day free trial (no credit card required)
3. Connect Stripe account (click "Connect with Stripe")
   - Grant read-write permissions
   - Rewardful will auto-configure webhooks
4. Copy API keys:
   - Go to Company Settings → API Keys
   - Copy **Public API Key** (starts with `rwf_`)
   - Copy **Secret API Key** (keep this secure)

#### Task 1.2: Create First Campaign
1. Go to Campaigns → New Campaign
2. Campaign settings:
   - **Name:** "CPN Customer Referrals"
   - **Type:** Customer Referral Program
   - **Commission Type:** Custom Rewards (1 week free)
   - **Cookie Window:** 60 days
   - **Commission Duration:** One-time
3. Save campaign → Copy **Campaign ID** (UUID)

#### Task 1.3: Configure Campaign Settings
1. **Double-Sided Incentives:**
   - Toggle ON: "Use double-sided incentives"
   - Create Stripe coupon: "REFERRAL_WEEK_FREE"
   - Duration: Once
   - Duration in months: N/A (we'll handle via subscription credits)

2. **Campaign URL:**
   - Set to: `https://app.cost-per-nut.com/share`
   - This is where referral links will point

3. **Affiliate Portal:**
   - Customize logo, colors to match CPN branding
   - Portal URL: `cpn.getrewardful.com` (or custom domain later)

#### Task 1.4: Start Local Supabase
1. Restart computer
2. Open Docker Desktop
3. Run `supabase start` in project directory
4. Verify Supabase Studio opens at `http://127.0.0.1:54323`

---

### Phase 2: Implementation (5-6 hours)

**Goal:** Build and deploy core referral functionality.

---

#### Hour 1: Database Foundation

**Tasks:**
1. Create migration file: `supabase migration new add_referral_fields`
2. Add SQL to migration (see schema below)
3. Test migration on local Supabase: `supabase db reset`
4. If successful, apply to production: `supabase db push`

**Database Schema Changes:**

```sql
-- Add columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rewardful_affiliate_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rewardful_referral_link TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referred_by_affiliate_id TEXT;
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
  rewardful_affiliate_id TEXT,
  rewardful_referral_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own referral events" ON public.referral_events
  FOR SELECT USING (
    auth.uid() = referrer_user_id OR auth.uid() = referee_user_id
  );

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_referral_events_referrer ON public.referral_events(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_events_referee ON public.referral_events(referee_user_id);
CREATE INDEX IF NOT EXISTS idx_users_rewardful_affiliate_id ON public.users(rewardful_affiliate_id);
```

**Verification:**
- Open Supabase Studio: `http://127.0.0.1:54323`
- Check `users` table has new columns
- Check `referral_events` table exists
- Run test query: `SELECT * FROM users;`

---

#### Hour 2: Referral Detection + Landing Page

**Tasks:**

**2.1: Create Referral Utilities** (`src/lib/referral/utils.ts`):
```typescript
interface ReferralContext {
  isReferred: boolean;
  referralId: string | null; // Rewardful's unique referral ID (UUID)
  affiliateId: string | null; // Rewardful affiliate ID
  timestamp: number;
}

/**
 * Detects if current page load came from a referral link
 * Checks for Rewardful.referral in global scope
 */
export function detectReferralContext(): ReferralContext | null {
  // Check if Rewardful SDK loaded
  if (typeof window !== 'undefined' && (window as any).Rewardful) {
    const referralId = (window as any).Rewardful.referral;

    if (referralId) {
      return {
        isReferred: true,
        referralId,
        affiliateId: null, // Will be populated after conversion
        timestamp: Date.now(),
      };
    }
  }

  return null;
}

/**
 * Saves referral context to sessionStorage
 */
export function persistReferralContext(context: ReferralContext): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('referral_context', JSON.stringify(context));
  }
}

/**
 * Retrieves referral context from sessionStorage
 */
export function getReferralContext(): ReferralContext | null {
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('referral_context');
    return stored ? JSON.parse(stored) : null;
  }
  return null;
}

/**
 * Clears referral context from sessionStorage
 */
export function clearReferralContext(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('referral_context');
  }
}
```

**2.2: Create Rewardful Integration** (`src/lib/referral/rewardful.ts`):
```typescript
interface RewardfulConfig {
  apiKey: string;
}

/**
 * Initializes Rewardful SDK (should already be loaded via <head> script)
 * This function just verifies it's ready
 */
export function initializeRewardful(): boolean {
  if (typeof window !== 'undefined' && (window as any).rewardful) {
    console.log('Rewardful SDK loaded successfully');
    return true;
  }
  console.warn('Rewardful SDK not loaded');
  return false;
}

/**
 * Tracks a conversion in Rewardful
 * Call this after user signs up via referred link
 */
export function trackConversion(email: string): void {
  if (typeof window !== 'undefined' && (window as any).rewardful) {
    (window as any).rewardful('convert', { email });
    console.log('Rewardful conversion tracked for:', email);
  }
}

/**
 * Gets the current referral ID (if user came from referral link)
 */
export function getReferralId(): string | null {
  if (typeof window !== 'undefined' && (window as any).Rewardful) {
    return (window as any).Rewardful.referral || null;
  }
  return null;
}
```

**2.3: Add Rewardful SDK to HTML** (`index.html`):
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- ... existing head content ... -->

    <!-- Rewardful Tracking Script -->
    <script>
      (function(w,r){w._rwq=r;w[r]=w[r]||function(){(w[r].q=w[r].q||[]).push(arguments)}})(window,'rewardful');
    </script>
    <script async src='https://r.wdfl.co/rw.js' data-rewardful='YOUR_REWARDFUL_API_KEY'></script>

    <!-- ... rest of head ... -->
  </head>
  <body>
    <!-- ... -->
  </body>
</html>
```

**Important:** Replace `YOUR_REWARDFUL_API_KEY` with your actual Public API Key from Rewardful.

**2.4: Create Landing Page** (`src/pages/Share.tsx`):
```tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { detectReferralContext, persistReferralContext } from '../lib/referral/utils';
import './Share.css';

export default function Share() {
  const navigate = useNavigate();
  const [isReferred, setIsReferred] = useState(false);

  useEffect(() => {
    // Detect and persist referral context
    const context = detectReferralContext();
    if (context) {
      persistReferralContext(context);
      setIsReferred(true);
    }
  }, []);

  return (
    <div className="share-page">
      {/* Banner for referred users */}
      {isReferred && (
        <div className="referral-banner">
          🎉 You were invited to CPN — Get 1 week free!
        </div>
      )}

      {/* Hero Section */}
      <div className="hero-section">
        <h1>Track Every Interaction</h1>
        <p>Never forget a detail about the women in your life.</p>

        <button
          className="cta-button"
          onClick={() => navigate('/signup')}
        >
          {isReferred ? 'Get 1 Week Free' : 'Try for Free'}
        </button>
      </div>

      {/* Value Props */}
      <div className="features">
        {/* Add your existing marketing content */}
      </div>
    </div>
  );
}
```

**2.5: Update Routing** (`src/App.tsx`):
```typescript
// Add import
import Share from './pages/Share';

// In your routing section:
<Route path="/share" element={<Share />} />

// Add initialization in useEffect
useEffect(() => {
  initializeRewardful();
}, []);
```

**Verification:**
- Navigate to `http://localhost:5173/share?ref=TEST123`
- Banner displays "1 week free" message
- Click CTA → redirects to `/signup`
- Check sessionStorage: `sessionStorage.getItem('referral_context')`
- Should show referral data

---

#### Hour 3: Signup Enhancement + Affiliate Creation

**Tasks:**

**3.1: Remove `/signup` Redirect** (`src/App.tsx`):
```typescript
// Delete or comment out the redirect:
// useEffect(() => {
//   if (!user && pathname === '/signup') {
//     goTo('/step-1');
//   }
// }, [user, pathname]);
```

**3.2: Create API Route for Affiliate Creation** (`app/api/referral/create-affiliate/route.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, lastName } = await request.json();

    // Create affiliate in Rewardful
    const response = await fetch('https://api.getrewardful.com/v1/affiliates', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REWARDFUL_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        first_name: firstName,
        last_name: lastName,
        campaign_id: process.env.REWARDFUL_CAMPAIGN_ID,
        state: 'active',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.message }, { status: response.status });
    }

    const affiliate = await response.json();

    // Return affiliate data
    return NextResponse.json({
      affiliateId: affiliate.id,
      referralLink: affiliate.links[0]?.url || null, // First link from campaign
    });
  } catch (error) {
    console.error('Error creating affiliate:', error);
    return NextResponse.json({ error: 'Failed to create affiliate' }, { status: 500 });
  }
}
```

**3.3: Modify SignUp Component** (`src/pages/SignUp.tsx`):
```typescript
import { getReferralContext, clearReferralContext } from '../lib/referral/utils';
import { trackConversion } from '../lib/referral/rewardful';

// In your signup handler, after user account created:
const handleSignup = async (email: string, password: string) => {
  // ... existing signup logic ...

  // After successful account creation:
  const newUser = { id: userId, email, firstName, lastName };

  // 1. Create affiliate in Rewardful for this user
  const affiliateResponse = await fetch('/api/referral/create-affiliate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
    }),
  });

  const { affiliateId, referralLink } = await affiliateResponse.json();

  // 2. Save affiliate info to database
  await supabase
    .from('users')
    .update({
      rewardful_affiliate_id: affiliateId,
      rewardful_referral_link: referralLink,
    })
    .eq('id', newUser.id);

  // 3. Check if this user was referred
  const referralContext = getReferralContext();

  if (referralContext?.isReferred) {
    // Track conversion in Rewardful
    trackConversion(newUser.email);

    // Save referred-by data
    await supabase
      .from('users')
      .update({ referred_by_affiliate_id: referralContext.affiliateId })
      .eq('id', newUser.id);

    // Log event
    await supabase.from('referral_events').insert({
      referee_user_id: newUser.id,
      event_type: 'signup',
      rewardful_referral_id: referralContext.referralId,
      event_data: { email: newUser.email },
    });

    // Clear context and redirect to checkout
    clearReferralContext();
    window.location.href = '/api/checkout?ref=true';
  } else {
    // Normal flow
    navigate('/step-1');
  }
};
```

**Verification:**
- Navigate to `/share?ref=TEST123`
- Click "Get 1 Week Free" → lands on `/signup`
- Fill out signup form, create account
- Should redirect to Stripe checkout (not `/step-1`)
- Check database:
  - `rewardful_affiliate_id` populated
  - `rewardful_referral_link` populated
  - `referred_by_affiliate_id` populated (if referred)

---

#### Hour 4: Stripe Checkout with Trial

**Tasks:**

**4.1: Modify Checkout API** (`app/api/checkout/route.ts`):
```typescript
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isReferralSignup = searchParams.get('ref') === 'true';

  // Get user session
  const session = await getSession(request);
  const user = await getUserFromSession(session);

  // Get Rewardful referral ID from user's session/cookie
  let referralId = null;
  if (isReferralSignup) {
    // Rewardful stores this in cookies automatically
    referralId = request.cookies.get('rewardful.referral')?.value;
  }

  const stripeSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: user.email,
    client_reference_id: referralId, // CRITICAL: Pass to Stripe
    line_items: [{
      price: process.env.VITE_STRIPE_PRICE_PLAYER_MODE_WEEKLY,
      quantity: 1,
    }],
    subscription_data: {
      trial_period_days: isReferralSignup ? 7 : 0,
      metadata: {
        user_id: user.id,
        is_referral_signup: isReferralSignup.toString(),
        rewardful_referral_id: referralId || '',
      },
    },
    success_url: `${origin}/welcome-premium`,
    cancel_url: `${origin}/share`,
  });

  return NextResponse.json({ url: stripeSession.url });
}
```

**Important:** The `client_reference_id` is how Rewardful tracks conversions in Stripe. This is critical!

**4.2: Environment Variables** (`.env.local`):
```bash
# Rewardful
NEXT_PUBLIC_REWARDFUL_API_KEY=rwf_your_public_key_here
REWARDFUL_SECRET_KEY=rwf_your_secret_key_here
REWARDFUL_CAMPAIGN_ID=your_campaign_uuid_here

# Referral Config
NEXT_PUBLIC_REFERRAL_TRIAL_DAYS=7
NEXT_PUBLIC_REFERRAL_CREDIT_WEEKS=1
ENABLE_REFERRAL_PROGRAM=true

# Existing Stripe Variables (ensure these exist)
VITE_STRIPE_PRICE_PLAYER_MODE_WEEKLY=price_your_weekly_price_id
STRIPE_SECRET_KEY=sk_test_your_key_here
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
  - Metadata includes `rewardful_referral_id`
  - `client_reference_id` is set
- Check Rewardful Dashboard:
  - Conversion should appear
  - Commission status: Pending (until trial converts)

---

#### Hour 5: Refer & Earn Page

**Tasks:**

**5.1: Create API Route** (`app/api/referral/stats/route.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await getUserFromSession(session);

  // Fetch stats from database
  const { data: stats } = await supabase
    .from('referral_events')
    .select('*')
    .eq('referrer_user_id', user.id);

  // Fetch user's referral link from Rewardful
  let referralLink = user.rewardful_referral_link;

  // If not cached, fetch from Rewardful API
  if (!referralLink && user.rewardful_affiliate_id) {
    const response = await fetch(
      `https://api.getrewardful.com/v1/affiliates/${user.rewardful_affiliate_id}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.REWARDFUL_SECRET_KEY}`,
        },
      }
    );

    if (response.ok) {
      const affiliate = await response.json();
      referralLink = affiliate.links[0]?.url;
    }
  }

  // Return aggregated stats
  return NextResponse.json({
    totalClicks: stats?.filter(e => e.event_type === 'click').length || 0,
    paidReferrals: stats?.filter(e => e.event_type === 'payment').length || 0,
    creditsEarned: user.referral_credits_earned || 0,
    creditsRemaining: user.referral_credits_remaining || 0,
    referralLink: referralLink || `https://app.cost-per-nut.com/share`,
  });
}
```

**5.2: Create Refer & Earn Page** (`src/pages/ReferAndEarn.tsx`):
```tsx
import React, { useEffect, useState } from 'react';
import { Copy, Share2 } from 'lucide-react';
import './ReferAndEarn.css';

interface ReferralStats {
  totalClicks: number;
  paidReferrals: number;
  creditsEarned: number;
  creditsRemaining: number;
  referralLink: string;
}

export default function ReferAndEarn() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const response = await fetch('/api/referral/stats');
    const data = await response.json();
    setStats(data);
  };

  const copyLink = () => {
    if (stats?.referralLink) {
      navigator.clipboard.writeText(stats.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="refer-earn-page">
      <h1>Give 1 Week, Get 1 Week</h1>
      <p>Share CPN with friends and earn free weeks for every paid referral.</p>

      {/* Referral Link */}
      <div className="referral-link-section">
        <label>Your Referral Link:</label>
        <div className="link-container">
          <input
            type="text"
            value={stats.referralLink}
            readOnly
          />
          <button onClick={copyLink}>
            <Copy size={18} />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="share-buttons">
        <a
          href={`sms:?body=Check out CPN - ${stats.referralLink}`}
          className="share-btn sms"
        >
          SMS
        </a>
        <a
          href={`https://wa.me/?text=Check out CPN - ${stats.referralLink}`}
          className="share-btn whatsapp"
          target="_blank"
        >
          WhatsApp
        </a>
        <a
          href={`https://twitter.com/intent/tweet?text=Check out CPN&url=${stats.referralLink}`}
          className="share-btn twitter"
          target="_blank"
        >
          X (Twitter)
        </a>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats.totalClicks}</h3>
          <p>Link Clicks</p>
        </div>
        <div className="stat-card">
          <h3>{stats.paidReferrals}</h3>
          <p>Paid Referrals</p>
        </div>
        <div className="stat-card">
          <h3>{stats.creditsEarned}</h3>
          <p>Free Weeks Earned</p>
        </div>
        <div className="stat-card">
          <h3>{stats.creditsRemaining}</h3>
          <p>Free Weeks Remaining</p>
        </div>
      </div>

      {/* How It Works */}
      <div className="how-it-works">
        <h2>How It Works</h2>
        <ol>
          <li>Share your unique referral link with friends</li>
          <li>They get 1 week free when they sign up</li>
          <li>You get 1 week free when they become a paying customer</li>
          <li>No limit on free weeks you can earn!</li>
        </ol>
      </div>
    </div>
  );
}
```

**5.3: Add to Navigation** (`src/App.tsx`):
```tsx
// Import
import ReferAndEarn from './pages/ReferAndEarn';
import { Share2 } from 'lucide-react';

// In sidebar:
<div
  className={`sidebar-item ${activeView === 'refer' ? 'active' : ''}`}
  onClick={() => setActiveView('refer')}
>
  <Share2 size={20} />
  <span>Refer & Earn</span>
</div>

// In routing:
{activeView === 'refer' && <ReferAndEarn />}
```

**Verification:**
- Log in to dashboard
- Click "Refer & Earn" in sidebar
- Page loads with:
  - Personal referral link from Rewardful
  - Copy button (click to copy link)
  - Share buttons with platform-specific URLs
  - Stats cards (all zeros initially)
- Click copy button → link copied to clipboard
- Toast notification appears: "Link copied!"

---

#### Hour 6: Webhook Credit Issuance (Optional - Can defer)

**Why this matters:** When a referred user's trial ends and they make their first payment, the referrer should get 1 week credit.

**Tasks:**

**6.1: Create Webhook Handler** (`app/api/webhooks/rewardful/route.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('x-rewardful-signature');

  // Verify webhook signature (Rewardful provides this)
  // ... signature verification logic ...

  const event = JSON.parse(body);

  // Handle commission.created event
  if (event.type === 'commission.created') {
    const { affiliate_id, commission } = event.data;

    // Find referrer user
    const { data: referrer } = await supabase
      .from('users')
      .select('*')
      .eq('rewardful_affiliate_id', affiliate_id)
      .single();

    if (referrer) {
      // Issue 1 week credit
      await supabase
        .from('users')
        .update({
          referral_credits_earned: referrer.referral_credits_earned + 1,
          referral_credits_remaining: referrer.referral_credits_remaining + 1,
        })
        .eq('id', referrer.id);

      // Log event
      await supabase.from('referral_events').insert({
        referrer_user_id: referrer.id,
        event_type: 'credit_issued',
        event_data: { commission_id: commission.id, weeks: 1 },
      });
    }
  }

  return NextResponse.json({ received: true });
}
```

**6.2: Configure Webhook in Rewardful:**
1. Go to Rewardful Dashboard → Settings → Webhooks
2. Add webhook URL: `https://app.cost-per-nut.com/api/webhooks/rewardful`
3. Select events: `commission.created`, `commission.updated`
4. Save

**Note:** Can defer this to Phase 2 if time is tight. Credits can be issued manually initially.

---

## What We're Skipping (For Later)

### Influencer Affiliate Campaign Setup
**Why skipped:** Not needed for launch. Easy to add later using Rewardful's built-in features.
**How to add later:**
1. Create second campaign: "CPN Influencer Program"
2. Set commission: 50% of weekly revenue ($0.99 per referral)
3. Manually add influencers via Rewardful dashboard
4. They get login at `cpn.getrewardful.com` to track stats

### Custom Domain for Affiliate Portal
**Why skipped:** Not critical for MVP. Can add later.
**How to add later:**
1. Create CNAME: `affiliates.cost-per-nut.com` → `domains.rewardful.com`
2. Configure in Rewardful settings
3. Auto SSL included

### Onboarding Nudge
**Why skipped:** Nice-to-have, not critical for MVP.

### Admin Analytics Dashboard
**Why skipped:** Rewardful dashboard provides this out-of-the-box.

---

## Environment Variables Required

Add these to `.env.local` (development) and Vercel (production):

```bash
# Rewardful
NEXT_PUBLIC_REWARDFUL_API_KEY=rwf_pub_your_public_key_here
REWARDFUL_SECRET_KEY=rwf_sec_your_secret_key_here
REWARDFUL_CAMPAIGN_ID=uuid_of_your_campaign

# Referral Config
NEXT_PUBLIC_REFERRAL_TRIAL_DAYS=7
NEXT_PUBLIC_REFERRAL_CREDIT_WEEKS=1
ENABLE_REFERRAL_PROGRAM=true

# Existing Stripe Variables (ensure these exist)
VITE_STRIPE_PRICE_PLAYER_MODE_WEEKLY=price_your_weekly_price_id
STRIPE_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

---

## Testing Checklist

### End-to-End Referred User Flow
- [ ] Navigate to `/share?ref=TESTLINK`
- [ ] See "1 week free" banner
- [ ] Click "Get 1 Week Free" → lands on `/signup`
- [ ] Fill signup form → create account
- [ ] Verify affiliate created in Rewardful dashboard
- [ ] Redirects to Stripe checkout
- [ ] See 7-day trial messaging
- [ ] Complete checkout with test card `4242 4242 4242 4242`
- [ ] Redirects to `/welcome-premium`
- [ ] Click "Enter App" → lands in dashboard as Player Mode
- [ ] Verify in Stripe Dashboard: subscription exists with 7-day trial
- [ ] Verify in Rewardful Dashboard: conversion tracked

### End-to-End Non-Referred User Flow (Regression Test)
- [ ] Navigate to `/` (home page)
- [ ] Click "Try for Free" → lands on `/step-1`
- [ ] Complete Steps 1-2-3-4
- [ ] Choose Boyfriend Mode → lands in dashboard (Free tier)
- [ ] OR choose Player Mode → Stripe checkout → dashboard (Paid tier)
- [ ] Verify affiliate created in Rewardful for this user too

### Refer & Earn Page
- [ ] Log in to dashboard
- [ ] Click "Refer & Earn" → page loads
- [ ] See personal referral link from Rewardful
- [ ] Click copy button → link copied
- [ ] Click share buttons → proper URLs generated
- [ ] Stats display correctly (zeros initially)

### Database Verification
- [ ] Open Supabase Studio
- [ ] Check `users` table has new referral columns
- [ ] Check `referral_events` table exists and logs events
- [ ] Verify referred user has `referred_by_affiliate_id` populated
- [ ] Verify all users have `rewardful_affiliate_id` populated

### Rewardful Dashboard Verification
- [ ] Log into Rewardful dashboard
- [ ] Check Affiliates tab: new users appear
- [ ] Check Conversions tab: referred signups tracked
- [ ] Check Commissions tab: pending commissions for referrers

---

## Rollback Plan (If Things Break)

### Database Rollback
If migration breaks production:
```sql
-- Drop new table
DROP TABLE IF EXISTS public.referral_events;

-- Remove new columns
ALTER TABLE public.users DROP COLUMN IF EXISTS rewardful_affiliate_id;
ALTER TABLE public.users DROP COLUMN IF EXISTS rewardful_referral_link;
ALTER TABLE public.users DROP COLUMN IF EXISTS referred_by_affiliate_id;
ALTER TABLE public.users DROP COLUMN IF EXISTS referral_credits_earned;
ALTER TABLE public.users DROP COLUMN IF EXISTS referral_credits_remaining;
ALTER TABLE public.users DROP COLUMN IF EXISTS referral_stats;
```

### Code Rollback
If referral flow breaks normal signup:
1. Re-add `/signup` redirect in `App.tsx`
2. Remove referral detection from `SignUp.tsx`
3. Remove Rewardful script from `index.html`
4. Revert Stripe checkout API changes
5. Git revert to last working commit

---

## Success Metrics (Week 1)

**Acquisition:**
- [ ] At least 1 referred signup completes (proof of concept)
- [ ] Referral attribution works (tracked in Rewardful)
- [ ] Trial period applies correctly (7 days, $0 charge on day 1)

**Technical:**
- [ ] No errors in Vercel logs related to referral flow
- [ ] No regressions in normal onboarding flow
- [ ] Stripe subscriptions created with correct metadata
- [ ] Rewardful conversions tracked accurately

**Engagement:**
- [ ] Existing users visit Refer & Earn page
- [ ] At least 1 referral link copied and shared

---

## Future Enhancements (Post-Launch)

### Phase 2: Influencer Affiliate Program (2-3 hours)
**When:** After 2+ weeks of successful customer referrals
**What:**
1. Create second campaign in Rewardful: "Influencer Program"
2. Set commission: 50% recurring ($0.99 per week per referred customer)
3. Manually recruit 3-5 dating influencers
4. Send them invite links to Rewardful affiliate portal
5. They track stats and payouts in their dashboard

### Phase 3: Leaderboard Referral Integration (4-6 hours)
**When:** After Phase I validated for 2+ weeks
**What:** Append referral codes to leaderboard invite links
```
https://app.cost-per-nut.com/share?ref=steve123&group=nba-finals
```

### Phase 4: Custom Domain for Affiliate Portal (30 min)
**When:** After you have 5+ active influencers
**What:**
1. Add CNAME: `affiliates.cost-per-nut.com`
2. Configure in Rewardful settings
3. Influencers login at branded URL

---

## Key Differences: Rewardful vs GrowSurf

| Feature | Rewardful | GrowSurf |
|---------|-----------|----------|
| **Pricing** | $99/month | $179/month |
| **Auto Affiliate Creation** | ✅ Via API | ✅ Via API |
| **Affiliate Payouts** | ✅ Built-in (PayPal/Wise) | ❌ Manual only |
| **Recurring Commissions** | ✅ Yes | ❌ One-time only |
| **Multiple Campaigns** | ✅ Unlimited | ✅ Unlimited |
| **Custom Domain Portal** | ✅ Yes (Growth plan) | ✅ Yes (included) |
| **Double-Sided Rewards** | ✅ Yes | ✅ Yes |
| **Stripe Integration** | ✅ Two-way sync | ⚠️ One-way |
| **Influencer Programs** | ✅ Perfect for it | ❌ Not designed for this |

---

## Contact and Support

**Rewardful Documentation:** https://developers.rewardful.com
**Rewardful Help Center:** https://help.rewardful.com
**Stripe Trial Periods:** https://stripe.com/docs/billing/subscriptions/trials
**Supabase Local Development:** https://supabase.com/docs/guides/cli/local-development

---

## Notes and Decisions

**Decision 1: Rewardful Growth Plan ($99)**
- Needed for multiple campaigns (customer + future influencer)
- Custom domain capability
- Worth the extra $50 vs Starter for future-proofing

**Decision 2: Auto-Create Affiliates for All Users**
- Every user gets a referral link automatically
- Stored in database for quick access
- Enables seamless "Refer & Earn" page

**Decision 3: Use Rewardful Portal for Future Influencers**
- Don't build custom influencer dashboard
- Let them use Rewardful's built-in portal
- Saves 10+ hours of dev time

**Decision 4: Defer Webhook Initially**
- Can issue credits manually for first few referrals
- Add webhook handler in Phase 2
- Reduces complexity for MVP

---

**End of Rewardful Implementation Plan**
