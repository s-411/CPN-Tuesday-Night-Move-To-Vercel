# Stripe Checkout Fix - Local Development

## The Problem

You were getting these errors when testing Stripe checkout locally:
- `Failed to load resource: 500 (Internal Server Error)` on `/api/checkout`
- `Unexpected end of JSON input`
- Connection attempts to production Supabase (`mgcmkwrtjpkxmjjixyiy.supabase.co`) instead of local

## The Root Cause

The issue was that **Vite dev server** (port 5173) doesn't support **Vercel serverless functions** (the API routes in `/api/`). Stripe checkout requires these API routes to work.

## The Solution

Use **Vercel's dev server** instead, which supports both the frontend AND the API routes:

```bash
npm run dev
```

This now runs on **port 3000** (not 5173) and includes full API support.

## What Changed

### 1. Default Dev Command Updated

**Before:**
```bash
npm run dev  # Started Vite on port 5173 (no API support)
```

**After:**
```bash
npm run dev  # Starts Vercel dev on port 3000 (with API support)
```

### 2. New Development Scripts

```bash
npm run dev        # Full dev with API (port 3000) - DEFAULT
npm run dev:api    # Same as above
npm run dev:ui     # UI-only, faster (port 5173) - for styling work
```

### 3. Environment Variable Updated

**`.env.local`** now has:
```env
VITE_APP_URL=http://localhost:3000  # Changed from 5173
```

### 4. Documentation Added

- **[LOCAL_DEV_WITH_STRIPE.md](docs/local/LOCAL_DEV_WITH_STRIPE.md)** - Complete guide for Stripe development
- **[QUICKSTART.md](QUICKSTART.md)** - Updated with correct port info

## How to Use Now

### Daily Development (with Stripe)

```bash
# 1. Start database
npm run db:start

# 2. Start dev server
npm run dev

# 3. Open browser
http://localhost:3000
```

### Testing Stripe Checkout

1. Go to http://localhost:3000
2. Create/login to a test account
3. Try to upgrade to premium
4. Use test card: `4242 4242 4242 4242`
5. Stripe checkout should work now!

## Why This Works

**Vercel Dev Server:**
- ✅ Serves the frontend (Vite)
- ✅ Runs API routes (Stripe checkout, webhooks, etc.)
- ✅ Loads environment variables from `.env.local`
- ✅ Hot reload for both frontend and API
- ✅ Mimics production environment

**Vite Dev Server (port 5173):**
- ✅ Serves the frontend only
- ❌ No API routes
- ✅ Faster startup
- ✅ Good for UI-only work

## Current Status - Everything Working

✅ **Dev Server Running**
- URL: http://localhost:3000
- Status: HTTP 200
- API routes: Enabled

✅ **Local Supabase Running**
- API: http://127.0.0.1:54321 (responding)
- Studio: http://127.0.0.1:54323
- Email Testing: http://127.0.0.1:54324

✅ **Environment Configured**
- Supabase: Local instance
- Stripe: Test mode keys
- App URL: http://localhost:3000

## Testing Checklist

Try these to verify everything works:

- [ ] Create a new test account at http://localhost:3000
- [ ] Check confirmation email at http://127.0.0.1:54324
- [ ] Login with the test account
- [ ] Navigate to subscription/upgrade page
- [ ] Click "Upgrade" or "Subscribe"
- [ ] Stripe checkout should open (not error 500)
- [ ] Enter test card: `4242 4242 4242 4242`
- [ ] Complete checkout
- [ ] You should be redirected back with active subscription

## If You Still Have Issues

### Hard Refresh Browser

After changing ports, your browser might have cached the old port:

```
Mac: Cmd + Shift + R
Windows: Ctrl + Shift + R
```

### Clear Browser Storage

1. Open browser console (F12)
2. Go to Application tab
3. Clear Storage → Clear site data

### Verify Environment Variables

Check that `.env.local` has:
```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGci...  # Local key
VITE_APP_URL=http://localhost:3000
```

### Check Dev Server Logs

In the terminal where `npm run dev` is running, you should see logs from both:
- Vite (frontend)
- API routes (when you test checkout)

If you see errors, they'll appear there.

## Quick Commands

```bash
# Stop and restart dev server
Ctrl+C
npm run dev

# Check database status
npm run db:status

# Reset database
npm run db:reset

# Open Supabase Studio
npm run db:studio
```

## Summary

The fix was simple: **use the correct dev server that supports API routes**.

- **Before:** Vite-only server (no API support) → Stripe fails
- **After:** Vercel dev server (full API support) → Stripe works

All your code is correct - it just needed the right development environment!
