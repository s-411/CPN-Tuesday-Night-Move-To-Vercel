# 🚀 Quick Start Guide - Vite to Next.js Migration

## ⚡ TL;DR - Get Running in 5 Minutes

```bash
# 1. Copy environment template
cp env.local.template .env.local

# 2. Edit .env.local with your actual keys (see below)

# 3. Install dependencies (update package.json first - see below)
npm install

# 4. Start Stripe webhook listener (separate terminal)
stripe listen --forward-to localhost:3000/api/stripe/webhook

# 5. Run development server
npm run dev
```

## 🔑 Critical Environment Variables

**Copy these from your current setup:**

### From Supabase Dashboard (Settings → API)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### From Stripe Dashboard (Developers → API Keys)
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_SECRET_KEY=sk_test_51...
```

### From Stripe Products
```bash
NEXT_PUBLIC_STRIPE_PRICE_PLAYER_MODE_WEEKLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_PLAYER_MODE_ANNUAL=price_...
```

### From Stripe CLI (when you run `stripe listen`)
```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Your App URL
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📦 Update package.json

**Replace your current `package.json` with the contents of `package.nextjs.json`:**

```bash
cp package.nextjs.json package.json
npm install
```

## 🔄 What Changed - At a Glance

### Environment Variables
| Before (Vite) | After (Next.js) |
|--------------|----------------|
| `VITE_SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL` |
| `VITE_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| *(none)* | `SUPABASE_SERVICE_ROLE_KEY` ⚠️ NEW |
| *(none)* | `STRIPE_SECRET_KEY` ⚠️ NEW |
| *(none)* | `STRIPE_WEBHOOK_SECRET` ⚠️ NEW |

### API Endpoints (Client Code)
| Before | After |
|--------|-------|
| `${VITE_SUPABASE_URL}/functions/v1/stripe-checkout` | `/api/checkout` |
| `${VITE_SUPABASE_URL}/functions/v1/create-portal-session` | `/api/portal` |
| `${VITE_SUPABASE_URL}/functions/v1/verify-subscription` | `/api/verify-subscription` |

### Code Access Patterns
| Before | After |
|--------|-------|
| `import.meta.env.VITE_SUPABASE_URL` | `import { env } from '@/lib/env'; env.supabase.url` |
| `import.meta.env.DEV` | `process.env.NODE_ENV === 'development'` |

## 📁 New Files Created

```
lib/
├── env.ts                           # ✨ Environment configuration
└── supabase/
    ├── server.ts                    # ✨ Server-side Supabase clients
    └── types/
        └── database.ts              # Moved from src/lib/types/

app/api/                             # ✨ All NEW API routes
├── checkout/route.ts                # Replaces stripe-checkout function
├── portal/route.ts                  # Replaces create-portal-session function
├── verify-subscription/route.ts     # Replaces verify-subscription function
└── stripe/
    └── webhook/route.ts             # Replaces stripe-webhook function

Configuration:
├── next.config.js                   # ✨ Next.js config
├── package.nextjs.json              # ✨ Updated dependencies
└── env.local.template               # ✨ Environment template

Documentation:
├── NEXTJS_MIGRATION_GUIDE.md        # ✨ Comprehensive guide
├── ENVIRONMENT_VARIABLES.md          # ✨ Env reference
├── MIGRATION_SUMMARY.md             # ✨ Technical summary
└── QUICK_START.md                   # ✨ This file
```

## ✅ Pre-Flight Checklist

Before running the app:

- [ ] Supabase project exists and migrations are applied
- [ ] Stripe products created (weekly $1.99, annual $27)
- [ ] `.env.local` filled with all required values
- [ ] `package.json` updated to Next.js version
- [ ] Dependencies installed (`npm install`)
- [ ] Stripe CLI installed (`brew install stripe/stripe-cli/stripe`)

## 🧪 Test Your Setup

### 1. Check Environment Variables
```bash
npm run dev
# Look for "❌ Missing required environment variables" in console
# If you see this, fill in missing values in .env.local
```

### 2. Test Supabase Connection
Visit your app and try to sign up/log in. Check browser console for errors.

### 3. Test Stripe Checkout
1. In separate terminal: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
2. In app: Click "Upgrade to Player Mode"
3. Use test card: `4242 4242 4242 4242`
4. Check terminal for webhook events
5. Verify subscription in Supabase users table

## 🚢 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Set environment variables (use Vercel Dashboard)
# Go to: vercel.com → your-project → Settings → Environment Variables

# Deploy preview
vercel

# Deploy production
vercel --prod
```

**After deployment:**
1. Update `NEXT_PUBLIC_APP_URL` to your Vercel domain
2. Create production webhook in Stripe Dashboard
3. Add production webhook secret to Vercel env vars

## 📚 Full Documentation

- **NEXTJS_MIGRATION_GUIDE.md** - Complete step-by-step guide
- **ENVIRONMENT_VARIABLES.md** - Quick env variable reference
- **MIGRATION_SUMMARY.md** - Technical overview of changes

## 🆘 Common Issues

### "Missing Supabase environment variables"
→ Check that both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env.local`

### "Stripe is not configured"
→ Verify price IDs start with `price_` (not `price_REPLACE_ME`)

### Webhook not firing
→ Make sure `stripe listen` is running and webhook secret is in `.env.local`

### TypeScript errors
→ Run `npm install` to ensure all types are installed

### Build fails on Vercel
→ Check that ALL env vars are set in Vercel Dashboard for all environments (Dev, Preview, Production)

## 🎯 Success Criteria

You're ready for production when:
- ✅ Local dev server runs without errors
- ✅ User signup/login works
- ✅ Stripe checkout completes successfully
- ✅ Webhook fires and updates Supabase user
- ✅ Customer portal accessible
- ✅ TypeScript compiles without errors
- ✅ Preview deployment works on Vercel
- ✅ Production webhook configured in Stripe

## 💪 You're Ready!

All code changes are complete. Just fill in your environment variables and test!

**Need help?** Check the comprehensive guides:
- Start with: `NEXTJS_MIGRATION_GUIDE.md`
- Quick env reference: `ENVIRONMENT_VARIABLES.md`
- Technical details: `MIGRATION_SUMMARY.md`

Good luck! 🚀

