# Production Launch Guide - CPN v2

## ✅ Code Changes Completed

All environment variables have been standardized to use `VITE_*` prefix (Vite-native):

### Files Updated:
- ✅ `/api/checkout.ts` - Stripe checkout session creation
- ✅ `/api/portal.ts` - Stripe billing portal
- ✅ `/api/stripe/webhook.ts` - Stripe webhook handler
- ✅ `/api/verify-subscription.ts` - Subscription verification
- ✅ Removed `next.config.js` (not needed for Vite)
- ✅ Updated `.gitignore` to protect sensitive files

### Build Status:
✅ Production build succeeds with no errors

---

## 🎯 Next Steps: New Stripe Account Setup

### Step 1: Gather Stripe Credentials

Log into your **NEW Stripe account** and collect these 5 values:

#### 1. Live Publishable Key
- Go to: https://dashboard.stripe.com/apikeys
- **Switch to LIVE mode** (toggle in top-right)
- Copy: **Publishable key** (starts with `pk_live_...`)

#### 2. Live Secret Key
- Same location as above
- Click **Reveal live key** on the **Secret key**
- Copy: Starts with `sk_live_...`
- ⚠️ **NEVER commit this to git**

#### 3. Weekly Price ID
- Go to: https://dashboard.stripe.com/products
- **Switch to LIVE mode**
- Create product: "Player Mode Weekly"
  - Recurring pricing
  - $1.99 per week
  - Save product
- Copy the **Price ID** (starts with `price_...`)

#### 4. Annual Price ID
- Same as above, but create: "Player Mode Annual"
  - Recurring pricing
  - $27 per year
  - Save product
- Copy the **Price ID** (starts with `price_...`)

#### 5. Webhook Signing Secret (After deployment)
- Go to: https://dashboard.stripe.com/webhooks
- **Switch to LIVE mode**
- Click **Add endpoint**
- Endpoint URL: `https://your-domain.vercel.app/api/stripe/webhook`
- Select these events:
  - ✅ `checkout.session.completed`
  - ✅ `customer.subscription.updated`
  - ✅ `customer.subscription.deleted`
  - ✅ `invoice.payment_failed`
- Click **Add endpoint**
- Copy the **Signing secret** (starts with `whsec_...`)

---

### Step 2: Configure Vercel Environment Variables

Go to: **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

Add these variables for **Production environment ONLY**:

| Variable Name | Value | Source |
|--------------|-------|--------|
| `VITE_SUPABASE_URL` | `https://mgcmkwrtjpkxmjjixyiy.supabase.co` | Existing |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Existing |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Existing |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Step 1.1 |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Step 1.2 |
| `VITE_STRIPE_PRICE_PLAYER_MODE_WEEKLY` | `price_...` | Step 1.3 |
| `VITE_STRIPE_PRICE_PLAYER_MODE_ANNUAL` | `price_...` | Step 1.4 |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Step 1.5 |
| `VITE_APP_URL` | `https://your-domain.vercel.app` | Your domain |

**Important Notes:**
- ✅ Check **Production** environment only
- ❌ Leave **Preview** and **Development** unchecked (they should use test keys)
- Delete any old `NEXT_PUBLIC_*` variables if they exist
- Vercel will auto-redeploy after you save environment variables

---

### Step 3: Deploy to Production

```bash
# Remove sensitive files from git (if they were committed)
git rm --cached .env.local VERCEL_ENV_VARS.txt Variables.txt env.local.READY env.local.template 2>/dev/null || true

# Commit the standardized environment variable changes
git add .
git commit -m "Standardize environment variables to VITE_* prefix and prepare for production"

# Push to trigger Vercel deployment
git push origin main
```

Wait for Vercel to deploy (check Vercel dashboard).

---

### Step 4: Complete Webhook Setup

**After deployment completes:**

1. Go to your **NEW Stripe account**: https://dashboard.stripe.com/webhooks
2. Switch to **LIVE mode**
3. Follow Step 1.5 above to create the webhook
4. Copy the webhook signing secret (`whsec_...`)
5. Add it to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`
6. Vercel will auto-redeploy

---

### Step 5: Test Production

1. Visit your production URL
2. Sign up for a new account
3. Complete onboarding
4. Try to upgrade to Player Mode
5. Use Stripe test card in **LIVE mode**:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
6. Verify:
   - Payment succeeds
   - You're redirected to welcome page
   - Subscription shows "Player Mode" in settings
   - Webhook events appear in Stripe Dashboard → Webhooks

---

## 🔒 Security Checklist

- ✅ `.env.local` added to `.gitignore`
- ✅ `VERCEL_ENV_VARS.txt` added to `.gitignore`
- ✅ `Variables.txt` added to `.gitignore`
- ⚠️ **Important**: If these files were previously committed, they're in git history
  - Check with: `git log --all --full-history -- .env.local`
  - If found, consider rotating Supabase and Stripe keys

---

## 📋 Environment Variable Reference

### Frontend (Client-side, prefixed with VITE_)
```bash
VITE_SUPABASE_URL              # Supabase project URL
VITE_SUPABASE_ANON_KEY         # Supabase anonymous key
VITE_STRIPE_PUBLISHABLE_KEY    # Stripe publishable key
VITE_STRIPE_PRICE_PLAYER_MODE_WEEKLY   # Weekly price ID
VITE_STRIPE_PRICE_PLAYER_MODE_ANNUAL   # Annual price ID
VITE_APP_URL                   # Your app's URL (optional)
```

### Backend (Server-side, no prefix needed)
```bash
SUPABASE_SERVICE_ROLE_KEY      # Supabase admin key
STRIPE_SECRET_KEY              # Stripe secret key
STRIPE_WEBHOOK_SECRET          # Stripe webhook signing secret
```

---

## ⚠️ Common Issues

### "Missing required env var: VITE_SUPABASE_URL"
- Environment variable not set in Vercel
- Check: Vercel → Settings → Environment Variables → Production

### "Webhook signature verification failed"
- Wrong webhook secret
- Webhook pointing to wrong URL
- Check: Stripe Dashboard → Webhooks → Your endpoint

### "No Stripe customer found"
- User hasn't created a subscription yet
- They're trying to access billing portal without an active subscription

---

## 🚀 You're Ready!

Once all environment variables are set in Vercel and the webhook is configured, your app is **live and ready to accept real payments**.

Remember:
- Test with a real transaction first
- Monitor Stripe Dashboard for webhook events
- Check Vercel function logs for any errors
- Keep your Stripe secret keys secure

Good luck with your launch! 🎉
