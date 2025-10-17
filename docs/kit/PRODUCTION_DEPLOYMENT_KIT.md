# Kit Integration - Production Deployment Guide

## 🚀 Deploy to Production (Live Testing)

Since you have no paying users yet, deploying straight to production is the smart move. Follow these steps:

---

## ✅ Pre-Deployment Checklist

### 1. **Add Environment Variables to Vercel** (REQUIRED)

**Where:** Vercel Dashboard → Your Project → Settings → Environment Variables

**Add these 2 variables:**

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `KIT_API_KEY` | `kit_b0cdf11ceffbe1deb5dee542ced4fa2f` | Production |
| `KIT_FORM_ID` | `8220547` | Production |

**Steps:**
1. Go to https://vercel.com/dashboard
2. Select your CPN-Live project
3. Click **Settings** → **Environment Variables**
4. Click **Add New**
5. Add `KIT_API_KEY` with value `kit_b0cdf11ceffbe1deb5dee542ced4fa2f`
6. Select **Production** environment
7. Click **Save**
8. Repeat for `KIT_FORM_ID` with value `8220547`

---

### 2. **Add Secrets to Supabase Edge Functions** (REQUIRED)

Your Edge Functions run on Supabase servers and need access to Kit credentials.

**Option A: Supabase Dashboard (Recommended)**

1. Go to: https://supabase.com/dashboard
2. Select your project: **mgcmkwrtjpkxmjjixyiy**
3. Navigate to: **Edge Functions** (left sidebar)
4. Click **Secrets** or **Settings**
5. Add these secrets:

```bash
KIT_API_KEY = kit_b0cdf11ceffbe1deb5dee542ced4fa2f
KIT_FORM_ID = 8220547
```

**Option B: Supabase CLI**

```bash
# Login to Supabase
supabase login

# Link to your production project
supabase link --project-ref mgcmkwrtjpkxmjjixyiy

# Set secrets
supabase secrets set KIT_API_KEY=kit_b0cdf11ceffbe1deb5dee542ced4fa2f
supabase secrets set KIT_FORM_ID=8220547
```

---

### 3. **Apply Database Migration to Production** (REQUIRED)

The Kit integration needs a new column in the `users` table.

**Option A: Supabase Dashboard (Safest)**

1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of: `supabase/migrations/20251014015823_add_kit_subscriber_id.sql`
3. Paste and run the SQL
4. Verify: Check that `users` table now has `kit_subscriber_id` column

**Option B: Supabase CLI (Automated)**

```bash
# Link to production project
supabase link --project-ref mgcmkwrtjpkxmjjixyiy

# Push migrations
supabase db push

# This will apply all pending migrations including the Kit one
```

**The Migration SQL** (for reference):
```sql
-- Add kit_subscriber_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS kit_subscriber_id TEXT;
CREATE INDEX IF NOT EXISTS idx_users_kit_subscriber_id ON users(kit_subscriber_id);
COMMENT ON COLUMN users.kit_subscriber_id IS 'Kit.com (ConvertKit) subscriber ID for email marketing integration';
```

---

### 4. **Deploy Edge Functions to Production** (REQUIRED)

Your new Kit integration Edge Functions need to be deployed.

**Check what Edge Functions exist:**
```bash
ls supabase/functions/
```

**Deploy all Edge Functions:**
```bash
# Link to production
supabase link --project-ref mgcmkwrtjpkxmjjixyiy

# Deploy all functions
supabase functions deploy

# Or deploy specific Kit functions:
supabase functions deploy test-kit-api
supabase functions deploy kit-user-signup-manual
supabase functions deploy stripe-webhook
```

**Note:** The `stripe-webhook` function was modified to include Kit integration, so it MUST be redeployed.

---

### 5. **Set Production Branch in Vercel** (REQUIRED)

**Where:** Vercel Dashboard → Your Project → Settings → Git

**Steps:**
1. Go to your Vercel project settings
2. Find **Git** section
3. Set production branch to: `kit-starting-integration`
4. Or merge `kit-starting-integration` into `main` first, then deploy

**Current branch:** `kit-starting-integration`

---

## 🧪 Quick Production Test

Once deployed, test immediately:

### Test 1: Kit API Connectivity

```bash
curl https://mgcmkwrtjpkxmjjixyiy.supabase.co/functions/v1/test-kit-api \
  -H "Authorization: Bearer YOUR_PRODUCTION_ANON_KEY"
```

**Expected:** `{ "success": true, ... }`

**Check Kit Dashboard:** You should see a test subscriber appear

---

### Test 2: User Signup

1. Create a new account on your live app (use a real email you control)
2. Check Kit Dashboard → Subscribers
3. Verify new subscriber appears with "signed-up" tag

---

### Test 3: Subscription Flow

1. Log in as test user
2. Subscribe using Stripe test card: `4242 4242 4242 4242`
3. Check Kit Dashboard
4. Verify user now has "player-mode" tag

---

### Test 4: Cancellation

1. Cancel the test subscription via Stripe portal
2. Check Kit Dashboard
3. Verify user now has "cancelled" tag

---

## 📊 Monitor After Deployment

### Check Supabase Edge Function Logs

1. Go to Supabase Dashboard → Edge Functions
2. Select function (e.g., `stripe-webhook`)
3. View logs in real-time
4. Look for:
   - `[Stripe Webhook] Tagging user in Kit as player-mode`
   - `[Kit User Signup Manual] Successfully added to Kit`

### Check Vercel Deployment Logs

1. Go to Vercel Dashboard → Deployments
2. Click latest deployment
3. View build logs
4. Check for any errors

### Check Kit Dashboard

1. Go to https://app.kit.com
2. Navigate to **Subscribers**
3. Monitor for new signups appearing in real-time
4. Check tags are being applied correctly

---

## 🐛 Troubleshooting

### Issue: "KIT_API_KEY environment variable is not set"

**Cause:** Edge Function secrets not set in Supabase

**Fix:**
1. Go to Supabase Dashboard → Edge Functions → Secrets
2. Add `KIT_API_KEY` and `KIT_FORM_ID`
3. Redeploy Edge Functions: `supabase functions deploy`

---

### Issue: "Column kit_subscriber_id does not exist"

**Cause:** Database migration not applied to production

**Fix:**
1. Go to Supabase Dashboard → SQL Editor
2. Run migration manually (see step 3 above)
3. Verify column exists: `SELECT * FROM users LIMIT 1;`

---

### Issue: Users signing up but not appearing in Kit

**Possible causes:**
- Edge Function secrets not set
- Edge Functions not deployed
- Kit API key invalid

**Debug steps:**
1. Check Supabase Edge Function logs for errors
2. Test Kit API directly: `curl ... test-kit-api`
3. Verify secrets are set: Supabase Dashboard → Edge Functions → Secrets

---

### Issue: Stripe webhook not triggering Kit tags

**Possible causes:**
- `stripe-webhook` Edge Function not redeployed with new Kit code
- Edge Function secrets not set

**Fix:**
```bash
supabase functions deploy stripe-webhook
```

---

## 📋 Complete Deployment Checklist

Use this as you deploy:

- [ ] **Vercel environment variables added**
  - [ ] `KIT_API_KEY=kit_b0cdf11ceffbe1deb5dee542ced4fa2f`
  - [ ] `KIT_FORM_ID=8220547`

- [ ] **Supabase Edge Function secrets added**
  - [ ] `KIT_API_KEY` secret set
  - [ ] `KIT_FORM_ID` secret set

- [ ] **Database migration applied to production**
  - [ ] `users.kit_subscriber_id` column exists
  - [ ] Index created on `kit_subscriber_id`

- [ ] **Edge Functions deployed to production**
  - [ ] `test-kit-api` deployed
  - [ ] `kit-user-signup-manual` deployed
  - [ ] `stripe-webhook` deployed (CRITICAL - has new Kit code)

- [ ] **Branch deployed to Vercel**
  - [ ] `kit-starting-integration` set as production branch
  - [ ] OR merged into `main` and deployed
  - [ ] Build succeeded

- [ ] **Quick tests passed**
  - [ ] Test Kit API connectivity (curl test)
  - [ ] Test user signup (check Kit dashboard)
  - [ ] Test subscription (check for player-mode tag)
  - [ ] Test cancellation (check for cancelled tag)

- [ ] **Monitoring set up**
  - [ ] Supabase Edge Function logs checked
  - [ ] Vercel deployment logs reviewed
  - [ ] Kit dashboard monitoring new subscribers

---

## 🎯 What Happens After Deployment

1. **New signups** → Automatically added to Kit with "signed-up" tag
2. **Subscriptions** → Tagged as "player-mode" in Kit
3. **Cancellations** → Tagged as "cancelled" in Kit
4. **Kit automations** → Can trigger based on these tags

---

## 🔥 IMPORTANT NOTES

### Edge Functions MUST Be Redeployed

The most critical step is redeploying Edge Functions, especially `stripe-webhook`:

```bash
supabase functions deploy stripe-webhook
```

**Why:** The existing `stripe-webhook` function doesn't have the Kit integration code. You MUST redeploy it with the new code that includes Kit tagging.

### Vercel vs. Supabase

- **Vercel** runs your frontend app (React)
- **Supabase** runs your Edge Functions (backend)
- **Both** need Kit credentials:
  - Vercel: For frontend to call `kit-user-signup-manual`
  - Supabase: For Edge Functions to call Kit API

### Database Migration is One-Time

Once applied, the migration adds the `kit_subscriber_id` column permanently. Existing users will have `NULL` in this field until they interact with Kit API.

---

## 📞 Support

If something goes wrong:

1. **Check Supabase Logs** - Most issues show up here
2. **Check Kit Dashboard** - Verify subscribers are being added
3. **Test locally first** - If needed, use Docker + local Supabase
4. **Check environment variables** - Most issues are missing credentials

---

## 🎉 Success Criteria

Deployment is successful when:

✅ Test API call succeeds (curl test)
✅ New signups appear in Kit with "signed-up" tag
✅ Subscriptions trigger "player-mode" tag
✅ Cancellations trigger "cancelled" tag
✅ No errors in Supabase Edge Function logs
✅ Kit dashboard shows increasing subscriber count

---

**Branch:** `kit-starting-integration`
**Ready to deploy:** YES ✅
**Estimated deployment time:** 10-15 minutes

Good luck! 🚀
