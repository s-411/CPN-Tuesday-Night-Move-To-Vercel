# Next.js Migration Guide - Complete Reference

## 📋 Table of Contents

1. [Environment Variables Setup](#environment-variables-setup)
2. [Supabase Integration](#supabase-integration)
3. [Stripe Integration](#stripe-integration)
4. [Vercel Deployment](#vercel-deployment)
5. [Testing Guide](#testing-guide)
6. [Migration Checklist](#migration-checklist)

---

## 🔐 Environment Variables Setup

### Required Environment Variables

Copy `env.local.template` to `.env.local` and fill in your values:

```bash
cp env.local.template .env.local
```

### Client-Side Variables (NEXT_PUBLIC_*)
These are exposed to the browser and embedded at build time:

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Stripe Dashboard → Developers → API Keys |
| `NEXT_PUBLIC_STRIPE_PRICE_PLAYER_MODE_WEEKLY` | Weekly plan price ID | Stripe Dashboard → Products |
| `NEXT_PUBLIC_STRIPE_PRICE_PLAYER_MODE_ANNUAL` | Annual plan price ID | Stripe Dashboard → Products |
| `NEXT_PUBLIC_APP_URL` | Your app's URL | Development: `http://localhost:3000`<br>Production: Your domain |
| `NEXT_PUBLIC_ENABLE_ANONYMOUS_ONBOARDING` | Enable anonymous mode | `true` or `false` (optional) |

### Server-Only Variables
These are NEVER exposed to the browser:

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key ⚠️ SECRET | Supabase Dashboard → Settings → API |
| `STRIPE_SECRET_KEY` | Stripe secret key ⚠️ SECRET | Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | See [Webhook Setup](#stripe-webhook-setup) |

### Migration Mapping (Vite → Next.js)

| Old (Vite) | New (Next.js) |
|------------|---------------|
| `VITE_SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL` |
| `VITE_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| `VITE_STRIPE_PRICE_PLAYER_MODE_WEEKLY` | `NEXT_PUBLIC_STRIPE_PRICE_PLAYER_MODE_WEEKLY` |
| `VITE_STRIPE_PRICE_PLAYER_MODE_ANNUAL` | `NEXT_PUBLIC_STRIPE_PRICE_PLAYER_MODE_ANNUAL` |
| `VITE_APP_URL` | `NEXT_PUBLIC_APP_URL` |
| N/A | `SUPABASE_SERVICE_ROLE_KEY` (new) |
| N/A | `STRIPE_SECRET_KEY` (new) |
| N/A | `STRIPE_WEBHOOK_SECRET` (new) |

---

## 🗄️ Supabase Integration

### Database Schema

The database schema is already defined in `supabase/migrations/`. Run migrations:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push
```

### Database Tables

1. **users** - User profiles with subscription data
2. **girls** - Profile records (free tier: 1 active, player tier: 50 active)
3. **data_entries** - Transaction/encounter records
4. **user_settings** - User preferences (JSONB)

### Row Level Security (RLS)

All tables have RLS enabled. Users can only access their own data:
- ✅ RLS policies automatically created via migrations
- ✅ Users see only their own girls/data_entries
- ✅ Service role key bypasses RLS (use carefully!)

### Supabase Client Usage

#### Client-Side (Browser)
```typescript
import { supabase } from '@/lib/supabase/client';

// Use in client components
const { data, error } = await supabase
  .from('girls')
  .select('*')
  .eq('user_id', userId);
```

#### Server-Side (API Routes/Server Components)
```typescript
import { createServerClient, createServerAdminClient } from '@/lib/supabase/server';

// Respects user session (RLS applies)
const supabase = await createServerClient();

// Bypasses RLS (admin operations only!)
const adminSupabase = createServerAdminClient();
```

### Supabase Environment Keys

Get from: https://supabase.com/dashboard/project/_/settings/api

- **Project URL**: `https://xxxxx.supabase.co`
- **anon public key**: Safe for browser, respects RLS
- **service_role key**: ⚠️ SERVER-ONLY, bypasses RLS

---

## 💳 Stripe Integration

### Stripe Products Setup

1. **Create Products in Stripe Dashboard**
   - Go to: https://dashboard.stripe.com/test/products
   - Create "Player Mode - Weekly" ($1.99/week)
   - Create "Player Mode - Annual" ($27/year)
   - Copy Price IDs (format: `price_xxxxx`)

2. **Add Price IDs to .env.local**
   ```bash
   NEXT_PUBLIC_STRIPE_PRICE_PLAYER_MODE_WEEKLY=price_xxxxx
   NEXT_PUBLIC_STRIPE_PRICE_PLAYER_MODE_ANNUAL=price_xxxxx
   ```

### Stripe Webhook Setup

#### Local Development

1. **Install Stripe CLI**
   ```bash
   brew install stripe/stripe-cli/stripe
   # or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe**
   ```bash
   stripe login
   ```

3. **Forward Webhooks to Local Server**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. **Copy Webhook Secret**
   - The CLI will output: `whsec_xxxxx`
   - Add to `.env.local`:
     ```bash
     STRIPE_WEBHOOK_SECRET=whsec_xxxxx
     ```

#### Production (Vercel)

1. **Get Your Vercel Domain**
   - Example: `https://your-app.vercel.app`

2. **Add Webhook in Stripe Dashboard**
   - Go to: https://dashboard.stripe.com/test/webhooks
   - Click "Add endpoint"
   - URL: `https://your-app.vercel.app/api/stripe/webhook`
   - Events to send:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`

3. **Copy Webhook Signing Secret**
   - After creating the endpoint, reveal the signing secret
   - Add to Vercel environment variables: `STRIPE_WEBHOOK_SECRET=whsec_xxxxx`

### Stripe API Routes

All Stripe endpoints are now Next.js API routes (replaces Supabase Edge Functions):

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/checkout` | POST | Create checkout session |
| `/api/stripe/webhook` | POST | Process Stripe webhooks |
| `/api/portal` | POST | Create customer portal session |
| `/api/verify-subscription` | GET | Verify checkout completion |

### Stripe Environment Variables

| Variable | Type | Description |
|----------|------|-------------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public | Used in browser for Stripe.js |
| `STRIPE_SECRET_KEY` | Secret | Server-side API calls |
| `STRIPE_WEBHOOK_SECRET` | Secret | Verify webhook signatures |

---

## 🚀 Vercel Deployment

### Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

### Step 2: Link Your Project

```bash
vercel link
```

### Step 3: Set Environment Variables in Vercel

#### Option A: Vercel Dashboard

1. Go to: https://vercel.com/your-username/your-project
2. Settings → Environment Variables
3. Add all variables from `.env.local`
4. Set environments: Production, Preview, Development

#### Option B: Vercel CLI

```bash
# Set for all environments
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add NEXT_PUBLIC_STRIPE_PRICE_PLAYER_MODE_WEEKLY
vercel env add NEXT_PUBLIC_STRIPE_PRICE_PLAYER_MODE_ANNUAL
vercel env add NEXT_PUBLIC_APP_URL
```

### Step 4: Pull Environment Variables Locally

```bash
vercel env pull .env.local
```

### Step 5: Deploy

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

### Important Vercel Notes

⚠️ **Environment Variable Changes Require Redeployment**
- Changing `NEXT_PUBLIC_*` vars requires rebuilding the app
- Server-only vars also require redeployment on Vercel
- Use `vercel --prod` to redeploy after env changes

🔒 **Security**
- Never commit `.env.local` to git
- Use Vercel's environment variable encryption
- Rotate keys if accidentally exposed

📦 **Build Configuration**
- Vercel auto-detects Next.js projects
- Build command: `next build`
- Output directory: `.next`
- No additional config needed

---

## ✅ Testing Guide

### 1. Local Development Setup

```bash
# Install dependencies
npm install

# Copy and fill environment variables
cp env.local.template .env.local
# Edit .env.local with your actual values

# Run development server
npm run dev
```

### 2. Test Supabase Connection

#### Client-Side Test
```typescript
// In a client component
import { supabase } from '@/lib/supabase/client';

const testConnection = async () => {
  const { data, error } = await supabase.from('users').select('count');
  console.log('Supabase connection:', error ? 'Failed' : 'Success');
};
```

#### Server-Side Test
```typescript
// In an API route or server component
import { createServerClient } from '@/lib/supabase/server';

const supabase = await createServerClient();
const { data, error } = await supabase.from('users').select('count');
console.log('Supabase server connection:', error ? 'Failed' : 'Success');
```

### 3. Test Stripe Checkout Flow

1. **Start Local Webhook Listener**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

2. **Test Checkout**
   - Click "Upgrade to Player Mode" in your app
   - Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

3. **Verify Webhook Events**
   - Check terminal running `stripe listen`
   - Should see: `checkout.session.completed`
   - Check Supabase users table for updated subscription

4. **Test Customer Portal**
   - Click "Manage Subscription" in settings
   - Should redirect to Stripe Customer Portal
   - Test canceling/updating subscription

### 4. Test Production Webhooks

1. **Create Test Webhook Event**
   ```bash
   stripe trigger checkout.session.completed
   ```

2. **Monitor Webhook Delivery**
   - Stripe Dashboard → Webhooks → Your endpoint
   - Check recent deliveries and responses

3. **Check Logs**
   - Vercel Dashboard → Your Project → Logs
   - Filter by `/api/stripe/webhook`

### 5. TypeScript/ESLint Checks

```bash
# Type checking
npm run typecheck

# Linting
npm run lint
```

---

## 📝 Migration Checklist

### Phase 1: Environment Setup
- [ ] Copy `env.local.template` to `.env.local`
- [ ] Add Supabase URL and keys
- [ ] Add Stripe publishable key and price IDs
- [ ] Add Stripe secret key (server-only)
- [ ] Set `NEXT_PUBLIC_APP_URL` to `http://localhost:3000`
- [ ] Verify all env vars in `lib/env.ts` are set

### Phase 2: Supabase Setup
- [ ] Link Supabase project: `supabase link`
- [ ] Run migrations: `supabase db push`
- [ ] Verify tables created in Supabase Dashboard
- [ ] Test RLS policies with a test user
- [ ] Confirm service role key is server-only

### Phase 3: Stripe Setup
- [ ] Create weekly product in Stripe Dashboard
- [ ] Create annual product in Stripe Dashboard
- [ ] Copy price IDs to `.env.local`
- [ ] Install Stripe CLI
- [ ] Run `stripe listen` for local webhooks
- [ ] Add webhook secret to `.env.local`
- [ ] Test checkout with test card

### Phase 4: Code Migration
- [x] Created `lib/env.ts` for env access
- [x] Created `lib/supabase/client.ts` (client-side)
- [x] Created `lib/supabase/server.ts` (server-side)
- [x] Created `lib/supabase/types/database.ts`
- [x] Migrated all `import.meta.env` → `process.env` or `env.*`
- [x] Created `/api/checkout` route
- [x] Created `/api/stripe/webhook` route
- [x] Created `/api/portal` route
- [x] Created `/api/verify-subscription` route
- [x] Updated all Supabase function calls to use API routes

### Phase 5: Local Testing
- [ ] Run `npm run dev`
- [ ] Test user registration/login
- [ ] Test creating a profile (should hit free tier limit)
- [ ] Test subscription checkout
- [ ] Verify webhook fires and updates user
- [ ] Test customer portal
- [ ] Test subscription cancellation
- [ ] Run `npm run typecheck` - no errors
- [ ] Run `npm run lint` - no critical errors

### Phase 6: Vercel Deployment
- [ ] Install Vercel CLI: `npm i -g vercel`
- [ ] Link project: `vercel link`
- [ ] Set all environment variables in Vercel Dashboard
- [ ] Set `NEXT_PUBLIC_APP_URL` to Vercel domain
- [ ] Deploy to preview: `vercel`
- [ ] Test preview deployment
- [ ] Deploy to production: `vercel --prod`

### Phase 7: Production Stripe Setup
- [ ] Add production webhook in Stripe Dashboard
- [ ] Webhook URL: `https://your-domain.vercel.app/api/stripe/webhook`
- [ ] Select events: checkout.session.completed, customer.subscription.updated, etc.
- [ ] Copy production webhook secret to Vercel env vars
- [ ] Test production webhook with `stripe trigger`
- [ ] Monitor webhook deliveries in Stripe Dashboard

### Phase 8: Final Verification
- [ ] Test full user journey in production
- [ ] Verify subscription creates Stripe customer
- [ ] Verify webhook updates Supabase correctly
- [ ] Test edge cases (failed payments, cancellations)
- [ ] Check Vercel logs for errors
- [ ] Set up error monitoring (optional: Sentry, LogRocket)
- [ ] Document any custom configurations
- [ ] Update team on new deployment process

---

## 🆘 Troubleshooting

### Environment Variables Not Loading
```bash
# Verify env vars are set
npm run dev
# Check console for validation errors from lib/env.ts
```

### Supabase Connection Errors
- Verify URL and anon key in Supabase Dashboard
- Check RLS policies allow your operations
- Use service role key for admin operations (server-only!)

### Stripe Webhook Not Firing
- Ensure `stripe listen` is running locally
- Check webhook signature verification
- Verify webhook secret matches CLI output
- In production, check Stripe Dashboard → Webhooks → Deliveries

### TypeScript Errors
```bash
# Regenerate types from Supabase
supabase gen types typescript --project-id YOUR_PROJECT_REF > lib/supabase/types/database.ts
```

### Vercel Build Failures
- Check environment variables are set for all environments
- Verify all required deps in package.json
- Check Vercel build logs for specific errors
- Ensure `NEXT_PUBLIC_*` vars are set before build

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Next.js Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Stripe Next.js Integration](https://stripe.com/docs/payments/checkout/nextjs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## 🎉 Migration Complete!

You've successfully migrated from Vite to Next.js with Supabase and Stripe integration on Vercel!

### Next Steps:
1. Set up monitoring and analytics
2. Configure custom domain in Vercel
3. Enable Vercel Analytics
4. Set up error tracking (Sentry)
5. Configure email notifications for failed webhooks
6. Plan for production Stripe keys migration

### Support:
- Check the codebase for inline documentation
- Review API route implementations in `/app/api/`
- Examine environment access patterns in `lib/env.ts`
- Reference Supabase client patterns in `lib/supabase/`

Good luck with your deployment! 🚀

