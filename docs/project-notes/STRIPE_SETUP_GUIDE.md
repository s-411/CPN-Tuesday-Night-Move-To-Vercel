# Stripe Setup Guide - Fixing "Missing priceId or planType" Error

This guide will help you resolve the subscription errors you're experiencing and get your Stripe integration working properly.

## 🔴 The Problem

When users attempt to activate "Player" mode after account creation, they encounter:
- Error: "Missing priceId or planType"
- Two 400 errors from Supabase auth
- One 400 error from stripe-checkout function

**Root Cause:** Missing Stripe environment variables in your `.env` file.

## ✅ The Solution

Follow these steps to configure Stripe and resolve the errors:

### Step 1: Set Up Your Stripe Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Sign up or log in to your account
3. **Start in Test Mode** (toggle in the top right corner)

### Step 2: Get Your Stripe API Keys

1. In Stripe Dashboard, go to **Developers** → **API keys**
2. Find your **Publishable key** (starts with `pk_test_`)
3. Click "Reveal test key" and copy it
4. Keep this tab open - you'll need it in Step 4

### Step 3: Create Subscription Products

#### Create Weekly Plan:
1. In Stripe Dashboard, go to **Products** → **Add product**
2. Fill in the details:
   - **Name:** Player Mode Weekly
   - **Description:** Weekly subscription to CPN Player Mode
   - **Pricing model:** Recurring
   - **Price:** $1.99 USD
   - **Billing period:** Weekly
3. Click **Save product**
4. Copy the **Price ID** (starts with `price_`) - you'll need this in Step 4

#### Create Annual Plan:
1. Click **Add product** again
2. Fill in the details:
   - **Name:** Player Mode Annual
   - **Description:** Annual subscription to CPN Player Mode
   - **Pricing model:** Recurring
   - **Price:** $27.00 USD
   - **Billing period:** Yearly
3. Click **Save product**
4. Copy the **Price ID** (starts with `price_`) - you'll need this in Step 4

### Step 4: Update Your .env File

1. Open the `.env` file in your project root
2. Replace the placeholder values with your actual Stripe keys:

```env
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Replace these with your actual Stripe values:
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_PUBLISHABLE_KEY
VITE_STRIPE_PRICE_PLAYER_MODE_WEEKLY=price_YOUR_WEEKLY_PRICE_ID
VITE_STRIPE_PRICE_PLAYER_MODE_ANNUAL=price_YOUR_ANNUAL_PRICE_ID
```

3. Save the file

### Step 5: Restart Your Development Server

1. Stop your current dev server (Ctrl+C)
2. Start it again with `npm run dev`
3. Check the console for the message: **✓ Stripe Configuration Valid**

### Step 6: Test the Flow

1. Sign up with a new test account
2. After sign-in, the "Choose Your Mode" modal should appear
3. Click "Activate Player Mode" on either plan
4. You should be redirected to Stripe Checkout
5. Use Stripe's test card: **4242 4242 4242 4242**
   - Any future expiration date
   - Any 3-digit CVC
   - Any ZIP code

## 🔒 Setting Up Stripe Webhook (Optional but Recommended)

After successful payments, Stripe needs to notify your app to activate the subscription:

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter the endpoint URL:
   ```
   https://0ec90b57d6e95fcbda19832f.supabase.co/functions/v1/stripe-webhook
   ```
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Contact your Supabase admin to add this secret to your Edge Functions

## 🧪 Testing Cards

Use these test cards in Stripe Checkout:

| Card Number | Scenario |
|-------------|----------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0025 0000 3155 | Requires authentication (3D Secure) |
| 4000 0000 0000 9995 | Card declined |

## ⚠️ Common Issues

### Issue: "Stripe is not configured" error
**Solution:** Make sure all three Stripe environment variables are set in `.env` and restart your dev server.

### Issue: Still getting "Missing priceId" error
**Solution:**
1. Check that your Price IDs start with `price_` (not `prod_`)
2. Verify there are no extra spaces or quotes in the `.env` file
3. Make sure you restarted the dev server after updating `.env`

### Issue: Authentication errors
**Solution:** These errors occur when Stripe config is missing. They should disappear once you've configured Stripe properly and restarted.

### Issue: Checkout page doesn't load
**Solution:**
1. Verify your Stripe Publishable Key is correct
2. Check that you're using Test Mode keys (pk_test_)
3. Look in browser console for specific error messages

## 🚀 Going to Production

When you're ready to accept real payments:

1. In Stripe Dashboard, toggle from **Test Mode** to **Live Mode**
2. Go to **Developers** → **API keys**
3. Copy your **Live Publishable key** (starts with `pk_live_`)
4. Create new products in Live Mode (same as Step 3, but in Live Mode)
5. Update your `.env` file with Live Mode keys
6. Update the webhook endpoint with your Live Mode webhook secret

## 📊 Monitoring

After setup, you can monitor subscriptions in:
- **Stripe Dashboard** → **Payments** (see all transactions)
- **Stripe Dashboard** → **Customers** (see customer subscriptions)
- **App Settings Page** (users can manage their subscriptions)

## 🆘 Still Having Issues?

If you're still experiencing errors after following this guide:

1. Check the browser console for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure you restarted the dev server
4. Try creating a new test account and going through the flow again
5. Check that your Stripe account is active and not suspended

## ✅ Success Checklist

- [ ] Stripe account created and in Test Mode
- [ ] Publishable Key copied and added to `.env`
- [ ] Weekly subscription product created
- [ ] Weekly Price ID copied and added to `.env`
- [ ] Annual subscription product created
- [ ] Annual Price ID copied and added to `.env`
- [ ] Dev server restarted
- [ ] Console shows "✓ Stripe Configuration Valid"
- [ ] Test sign-up completed successfully
- [ ] Paywall modal appears correctly
- [ ] Clicking "Activate Player Mode" redirects to Stripe Checkout
- [ ] Test payment with 4242 card successful
- [ ] Redirected back to app after payment

Once you've completed this checklist, your subscription system should be fully operational!
