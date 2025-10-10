# 🚀 Simple Setup Instructions - Everything is Ready!

## ✅ Your Environment Variables Are Configured!

I've created **`env.local.READY`** with all your values from `Variables.txt`.

---

## 📋 Step-by-Step Setup (5 minutes)

### Step 1: Rename the Environment File

```bash
cd /Users/steveharris/Downloads/cpn-bolt-fresh-STABLE-Ready-forTuesday-dev

# Rename the ready file to .env.local
mv env.local.READY .env.local
```

### Step 2: Update package.json

```bash
# Replace current package.json with Next.js version
cp package.nextjs.json package.json

# Install dependencies
npm install
```

### Step 3: Get Stripe Webhook Secret

Open a **NEW terminal window** and run:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

You'll see output like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

Copy that `whsec_xxxxx` value and add it to your `.env.local` file:

```bash
# Open .env.local in your editor and replace this line:
STRIPE_WEBHOOK_SECRET=whsec_REPLACE_WITH_OUTPUT_FROM_STRIPE_LISTEN

# With the actual value:
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Step 4: Start the Development Server

In your **original terminal** (not the stripe listen one), run:

```bash
npm run dev
```

Your app should now be running at `http://localhost:3000`!

---

## 🧪 Test Your Setup

### 1. Sign Up / Log In
- Go to `http://localhost:3000`
- Create a new account or log in
- Should work without errors

### 2. Test Stripe Checkout
- Click "Upgrade to Player Mode" or any premium feature
- You'll be redirected to Stripe Checkout
- Use test card: **4242 4242 4242 4242**
- Expiry: Any future date (e.g., 12/25)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

### 3. Check Webhook Fired
- After completing checkout, look at the terminal running `stripe listen`
- You should see: `checkout.session.completed` event
- Your subscription should now be active in the app!

---

## 🎯 What's Already Configured

✅ **Supabase** - Connected to your project (mgcmkwrtjpkxmjjixyiy)
✅ **Stripe TEST Mode** - Safe to test without real charges
✅ **Price IDs** - Weekly ($1.99) and Annual ($27) plans configured
✅ **All environment variables** - Pre-filled from your Variables.txt

---

## 📁 What I Did

### Created Files:
1. **`lib/env.ts`** - Type-safe environment variable access
2. **`lib/supabase/client.ts`** - Client-side Supabase
3. **`lib/supabase/server.ts`** - Server-side Supabase (3 different clients)
4. **`lib/supabase/types/database.ts`** - TypeScript types
5. **`app/api/checkout/route.ts`** - Stripe checkout endpoint
6. **`app/api/stripe/webhook/route.ts`** - Webhook handler
7. **`app/api/portal/route.ts`** - Customer portal endpoint
8. **`app/api/verify-subscription/route.ts`** - Subscription verification
9. **`env.local.READY`** - Your environment file (ready to use!)
10. **`next.config.js`** - Next.js configuration
11. **`package.nextjs.json`** - Updated dependencies

### Updated Files:
- `src/lib/stripe/config.ts` - Uses new env system
- `src/lib/stripe/validation.ts` - Updated variable names
- `src/contexts/AuthContext.tsx` - Uses new env
- `src/pages/SubscriptionPage.tsx` - Uses `/api/checkout`
- `src/pages/SubscriptionSuccess.tsx` - Uses `/api/verify-subscription`
- `src/components/UpgradeModal.tsx` - Uses `/api/checkout`
- `src/components/PaywallModal.tsx` - Uses `/api/checkout`
- `src/App.tsx` - Uses `/api/portal`

---

## ⚠️ Important Notes

### Stripe Webhook Secret
- **Required for webhooks to work!**
- Must run `stripe listen` in a separate terminal
- Copy the `whsec_xxxxx` value to `.env.local`
- Keep the `stripe listen` terminal running while testing

### Test Mode vs Live Mode
- Currently using **TEST mode** (safe!)
- Test cards don't charge real money
- When ready for production, see "Going Live" section below

### Keep Terminals Open
- **Terminal 1**: `npm run dev` (your app)
- **Terminal 2**: `stripe listen` (webhook forwarding)

---

## 🚀 Going Live (When Ready)

### Prerequisites
1. Deploy to Vercel
2. Have your production domain (e.g., `https://your-app.vercel.app`)

### Steps

#### 1. Update Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables

Add these (using **LIVE MODE** values from Variables.txt):

```bash
# Supabase (same for test and live)
NEXT_PUBLIC_SUPABASE_URL=https://mgcmkwrtjpkxmjjixyiy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe LIVE MODE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51O0BVAGLPZ8QyJKVGsTVJZYOCKZ6Sh494e2HMu4AFV5FtfgG6ws7wOCmWfQhp5hPog7UNz9t4NwGGj6M4JwhnZdB00KwMeUXJI
STRIPE_SECRET_KEY=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

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

#### 2. Get LIVE Mode Price IDs

⚠️ **IMPORTANT**: Your Variables.txt has PRODUCT IDs (prod_xxx) but you need PRICE IDs (price_xxx)!

1. Go to: https://dashboard.stripe.com/products
2. Switch to **LIVE MODE** (toggle in top right)
3. Click on "Player Mode - Weekly" product
4. Copy the **Price ID** (starts with `price_`)
5. Repeat for "Player Mode - Annual"

Add to Vercel:
```bash
NEXT_PUBLIC_STRIPE_PRICE_PLAYER_MODE_WEEKLY=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_PLAYER_MODE_ANNUAL=price_xxxxx
```

#### 3. Create Production Webhook

1. Go to: https://dashboard.stripe.com/webhooks
2. Switch to **LIVE MODE**
3. Click "Add endpoint"
4. Endpoint URL: `https://your-domain.vercel.app/api/stripe/webhook`
5. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
6. Click "Add endpoint"
7. Reveal the **Signing secret** (starts with `whsec_`)
8. Add to Vercel:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

#### 4. Deploy

```bash
vercel --prod
```

---

## 🆘 Troubleshooting

### "Missing environment variables"
→ Make sure you renamed `env.local.READY` to `.env.local`

### "Stripe webhook not firing"
→ Make sure `stripe listen` is running in a separate terminal
→ Make sure you copied the webhook secret to `.env.local`

### "Stripe is not configured"
→ Check that your price IDs start with `price_` (not `prod_`)

### Can't install dependencies
→ Make sure you ran: `cp package.nextjs.json package.json`

### TypeScript errors
→ Run: `npm install` to install all types

---

## 📚 Need More Details?

Check these comprehensive guides:
- **NEXTJS_MIGRATION_GUIDE.md** - Full migration guide
- **ENVIRONMENT_VARIABLES.md** - Env variable reference
- **MIGRATION_SUMMARY.md** - Technical overview
- **QUICK_START.md** - 5-minute quick start

---

## ✅ Quick Checklist

Before running:
- [ ] Renamed `env.local.READY` to `.env.local`
- [ ] Ran `cp package.nextjs.json package.json`
- [ ] Ran `npm install`
- [ ] Installed Stripe CLI
- [ ] Started `stripe listen` in separate terminal
- [ ] Copied webhook secret to `.env.local`

Then:
- [ ] Run `npm run dev`
- [ ] Test signup/login
- [ ] Test checkout with test card: 4242 4242 4242 4242
- [ ] Verify webhook fired in stripe listen terminal
- [ ] Check subscription updated in app

---

## 🎉 You're All Set!

Everything is configured and ready to go. Just follow the steps above and you'll be running in minutes!

Questions? All the code changes are complete - just run the commands and test! 🚀

