# Local Development with Stripe Integration

## Important: Two Development Modes

This app has **API routes for Stripe** that require special handling in local development.

### Option 1: Full Development (with Stripe) - RECOMMENDED

Use this when testing **payments, subscriptions, or any API routes**.

```bash
# Start local database
npm run db:start

# Start full development server (includes API routes)
npm run dev

# Or explicitly:
npm run dev:api
```

**Your app runs at:** http://localhost:3000

This uses Vercel's dev server which supports:
- ✅ Stripe checkout
- ✅ Payment webhooks
- ✅ All API routes in `/api/`
- ✅ Local Supabase database
- ✅ Hot reload

### Option 2: UI-Only Development (faster, no API)

Use this only for **UI changes that don't need payments**.

```bash
npm run dev:ui
```

**Your app runs at:** http://localhost:5173

This uses Vite directly (faster startup), but:
- ❌ No Stripe checkout (will fail)
- ❌ No API routes
- ✅ Faster hot reload
- ✅ Good for styling/UI work

## Current Setup Status

✅ **Local Supabase Running**
- API: http://127.0.0.1:54321
- Studio: http://127.0.0.1:54323
- Database: Local Docker instance

✅ **Environment Configured**
- Points to local Supabase
- Stripe test mode keys configured
- App URL: http://localhost:3000

## Testing Stripe Checkout Locally

### Prerequisites

Make sure your `.env.local` has Stripe test keys:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PRICE_PLAYER_MODE_WEEKLY=price_...
VITE_STRIPE_PRICE_PLAYER_MODE_ANNUAL=price_...
```

These are already in your `.env.local` file.

### Steps to Test Checkout

1. **Start the database:**
   ```bash
   npm run db:start
   ```

2. **Start the dev server:**
   ```bash
   npm run dev
   ```

3. **Open the app:**
   ```
   http://localhost:3000
   ```

4. **Create/login to a test account**

5. **Try to upgrade to premium**
   - The Stripe checkout should open
   - Use test card: `4242 4242 4242 4242`
   - Any future date, any CVC

6. **Complete payment**
   - You'll be redirected back
   - Subscription should be active

### Testing Stripe Webhooks (Advanced)

To test webhook events locally (e.g., subscription created, payment succeeded):

1. **Install Stripe CLI:**
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. **Login to Stripe:**
   ```bash
   stripe login
   ```

3. **Forward webhooks to local server:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. **Copy the webhook secret** (starts with `whsec_...`)

5. **Add to `.env.local`:**
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

6. **Restart dev server:**
   ```bash
   # Ctrl+C to stop, then:
   npm run dev
   ```

Now webhook events will be forwarded to your local server!

## Why Two Ports?

- **Port 3000** (Vercel dev) - Runs API routes, slower but full-featured
- **Port 5173** (Vite only) - Faster startup, UI-only development

The app is configured to use **port 3000 by default** for complete functionality.

## Common Issues

### "Failed to load resource: 500 (Internal Server Error)" on /api/checkout

**Solution:** You're probably using `npm run dev:ui` (port 5173) which doesn't support API routes. Use:

```bash
npm run dev
```

And access at http://localhost:3000

### "Connection refused" to mgcmkwrtjpkxmjjixyiy.supabase.co

**Solution:** The app is trying to connect to production Supabase instead of local.

1. Check `.env.local` has:
   ```env
   VITE_SUPABASE_URL=http://127.0.0.1:54321
   ```

2. Restart dev server:
   ```bash
   # Ctrl+C to stop, then:
   npm run dev
   ```

3. Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

### "Unexpected end of JSON input"

**Cause:** API route returned an error that wasn't JSON

**Solution:**
1. Check browser console for full error
2. Check terminal for API route logs
3. Verify all environment variables are set in `.env.local`
4. Restart dev server

### Stripe checkout opens production, not test mode

**Solution:** Check that `.env.local` has **test** keys (start with `pk_test_` and `sk_test_`), not live keys.

## Environment Variable Loading

**Important:** Vercel dev server loads environment variables from `.env.local` automatically, but you must **restart the server** when you change them.

```bash
# After editing .env.local:
# 1. Stop server: Ctrl+C
# 2. Restart: npm run dev
```

## Quick Reference

```bash
# Database
npm run db:start      # Start local database
npm run db:stop       # Stop local database
npm run db:reset      # Reset to clean state
npm run db:status     # Check status
npm run db:studio     # Open Supabase Studio

# Development
npm run dev           # Full dev (with API) - port 3000
npm run dev:ui        # UI only (faster) - port 5173
npm run dev:api       # Same as npm run dev

# Other
npm run build         # Build for production
npm run preview       # Preview production build
```

## Summary

For **complete local development with Stripe**:

1. `npm run db:start` - Start database
2. `npm run dev` - Start dev server
3. Open http://localhost:3000
4. All features work including Stripe checkout

Your local setup is **completely isolated** from production:
- ✅ Local database (Docker)
- ✅ Stripe test mode
- ✅ No impact on live site
- ✅ No impact on production database
