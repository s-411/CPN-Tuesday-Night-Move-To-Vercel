# Subscription Synchronization - Troubleshooting Guide

## Problem: User Shows "Boyfriend Mode" After Successful Payment

### Quick Diagnosis

If a user completes payment but still shows "Boyfriend Mode":

1. **Check if webhook fired:**
   ```sql
   SELECT
     subscription_tier,
     subscription_status,
     stripe_subscription_id,
     subscription_plan_type,
     subscription_period_start,
     subscription_period_end
   FROM users
   WHERE email = 'USER_EMAIL';
   ```

   **Expected Result:** `subscription_tier = 'player'`
   **If still 'boyfriend':** Webhook hasn't processed

2. **Verify Stripe subscription exists:**
   - Go to Stripe Dashboard → Customers
   - Search by email
   - Check if subscription is active
   - Note the subscription ID

3. **Check Edge Function logs:**
   - Supabase Dashboard → Edge Functions
   - Look at `stripe-webhook` logs
   - Verify `checkout.session.completed` event received

### Immediate Fix (Manual Database Update)

If webhook failed or hasn't processed yet:

```sql
-- Update user subscription manually
UPDATE users
SET
  subscription_tier = 'player',
  subscription_status = 'active',
  subscription_plan_type = 'weekly',  -- or 'annual'
  subscription_period_start = NOW(),
  subscription_period_end = NOW() + INTERVAL '7 days'  -- or '365 days' for annual
WHERE email = 'USER_EMAIL';
```

After running this, user should refresh the page and see "Player Mode".

---

## How the New System Works

### 1. Payment Flow

```
User completes checkout
    ↓
Stripe redirects to: /?page=subscription-success&session_id=XXX
    ↓
SubscriptionSuccessPage loads
    ↓
Calls verify-subscription Edge Function
    ↓
Edge Function:
  - Fetches session from Stripe API
  - Gets subscription status directly
  - Updates database if needed
  - Returns current status
    ↓
If not ready, polls every 2 seconds (max 10 attempts)
    ↓
Once verified, shows success
    ↓
Real-time listener updates profile automatically
```

### 2. Real-Time Updates

AuthContext now listens for database changes:
- When webhook updates user table → Profile refreshes automatically
- User sees tier change without manual refresh
- Console logs: "Profile updated: {new data}"

### 3. Verification Endpoint

New Edge Function: `verify-subscription`

**Purpose:** Checks Stripe directly (not just database) to get authoritative subscription status

**URL:** `https://YOUR_PROJECT.supabase.co/functions/v1/verify-subscription?session_id=XXX`

**Response:**
```json
{
  "success": true,
  "status": "active",
  "subscription": {
    "tier": "player",
    "planType": "weekly",
    "status": "active",
    "periodStart": "2025-10-06T...",
    "periodEnd": "2025-10-13T..."
  },
  "synced": true
}
```

---

## Common Issues & Solutions

### Issue 1: "Missing session ID" Error

**Cause:** User navigated to success page without session_id parameter

**Solution:** User must complete checkout again or navigate to dashboard

### Issue 2: "Subscription is being processed" Message

**Cause:** Webhook hasn't fired within 20 seconds (max polling time)

**Solution:**
1. Wait 30 seconds
2. Refresh page
3. If still not working, check Stripe webhook configuration

### Issue 3: Webhook Not Configured

**Symptoms:** Payments succeed but database never updates

**Diagnosis:**
```sql
-- Check recent user subscriptions
SELECT
  email,
  subscription_tier,
  stripe_customer_id,
  created_at
FROM users
WHERE stripe_customer_id IS NOT NULL
  AND subscription_tier = 'boyfriend'
ORDER BY created_at DESC
LIMIT 10;
```

If many users stuck in "boyfriend" mode, webhook isn't firing.

**Solution:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Verify endpoint exists: `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook`
3. Check events include: `checkout.session.completed`
4. Verify webhook signing secret in Supabase env vars

### Issue 4: Real-Time Updates Not Working

**Symptoms:** User must refresh page to see tier change

**Diagnosis:** Check browser console for errors related to Realtime

**Solution:**
1. Verify Realtime is enabled in Supabase project
2. Check RLS policies allow user to read their own row
3. Verify AuthContext is properly mounted

### Issue 5: Type Errors After Update

**Cause:** Database type definitions were out of sync

**Solution:** Type definitions have been updated to include:
- `subscription_tier`: Now includes 'boyfriend' | 'player'
- `subscription_plan_type`: 'weekly' | 'annual' | null
- `subscription_period_start`: string | null
- `subscription_period_end`: string | null
- `has_seen_paywall`: boolean

---

## Testing the Fix

### Test Scenario 1: New Checkout

1. Sign in with test account
2. Click "Activate Player Mode"
3. Complete checkout with test card: `4242 4242 4242 4242`
4. Verify:
   - Shows "Activating Your Subscription" loading state
   - Within 5 seconds, shows success
   - Can immediately add multiple profiles
   - Settings shows "Player Mode"

### Test Scenario 2: Webhook Delay

1. Temporarily disable webhook in Stripe
2. Complete checkout
3. Verify:
   - Polls for up to 20 seconds
   - Shows "Processing" message if timeout
   - Provides "Retry" button
4. Re-enable webhook
5. Click "Retry"
6. Should succeed

### Test Scenario 3: Real-Time Update

1. Open two browser windows
2. Window 1: On dashboard as user
3. Window 2: Supabase SQL Editor
4. Run SQL to update tier:
   ```sql
   UPDATE users SET subscription_tier = 'player' WHERE id = 'USER_ID';
   ```
5. Window 1 should update automatically without refresh
6. Check console for "Profile updated" message

---

## Monitoring

### Key Metrics to Watch

1. **Webhook Success Rate**
   ```sql
   -- Count recent subscriptions
   SELECT
     COUNT(*) as total_checkouts,
     COUNT(CASE WHEN subscription_tier = 'player' THEN 1 END) as successful_upgrades,
     COUNT(CASE WHEN subscription_tier = 'boyfriend' AND stripe_customer_id IS NOT NULL THEN 1 END) as stuck_users
   FROM users
   WHERE created_at > NOW() - INTERVAL '7 days'
     AND stripe_customer_id IS NOT NULL;
   ```

2. **Average Verification Time**
   - Check Edge Function logs
   - Look for time between checkout.session.completed and database update

3. **Failed Verifications**
   - Check for errors in verify-subscription logs

### Health Check Query

Run this weekly to find users with issues:

```sql
-- Users with active Stripe subscription but wrong tier
SELECT
  u.id,
  u.email,
  u.subscription_tier,
  u.stripe_subscription_id,
  u.subscription_period_end
FROM users u
WHERE u.stripe_subscription_id IS NOT NULL
  AND u.subscription_tier = 'boyfriend'
ORDER BY u.created_at DESC;
```

If any results, manually fix with UPDATE query above.

---

## Prevention

### Webhook Monitoring

Set up alerts in Stripe Dashboard:
1. Go to Developers → Webhooks
2. Click your webhook endpoint
3. Monitor "Recent events" tab
4. Look for failed deliveries

### Database Monitoring

Create a scheduled function to check for mismatches:

```sql
-- Find users who need manual intervention
CREATE OR REPLACE FUNCTION check_subscription_sync()
RETURNS TABLE(user_id UUID, email TEXT, issue TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.email,
    'Active subscription but boyfriend tier' as issue
  FROM users u
  WHERE u.stripe_subscription_id IS NOT NULL
    AND u.subscription_tier = 'boyfriend'
    AND u.subscription_status = 'active';
END;
$$ LANGUAGE plpgsql;
```

---

## Support Response Templates

### For Users Stuck in Boyfriend Mode

```
Hi [Name],

I see you completed your payment successfully, but your account hasn't upgraded yet. This is a temporary synchronization issue.

I've manually activated your Player Mode subscription. Please:
1. Refresh your browser (Cmd+R or Ctrl+R)
2. You should now see "Player Mode" in settings
3. You can add up to 50 profiles

Your subscription is active and will renew on [DATE].

Apologies for the inconvenience!
```

### For Recurring Issues

```
Hi [Name],

I've activated your subscription manually. We've also implemented fixes to prevent this issue in the future:

1. Automatic verification when you return from checkout
2. Real-time updates when subscription activates
3. Retry mechanism if there are delays

If you experience any other issues, please let me know immediately.

Thank you for your patience!
```

---

## Development Notes

### Files Modified

1. **supabase/functions/verify-subscription/index.ts** (NEW)
   - Verifies subscription directly with Stripe
   - Updates database if out of sync
   - Returns authoritative status

2. **src/pages/SubscriptionSuccessPage.tsx** (UPDATED)
   - Calls verification endpoint with polling
   - Shows loading state during verification
   - Handles errors gracefully

3. **src/contexts/AuthContext.tsx** (UPDATED)
   - Added real-time database listener
   - Auto-refreshes profile on subscription changes

4. **src/lib/types/database.ts** (UPDATED)
   - Fixed type definitions to match actual schema
   - Added missing fields

### Next Steps

1. Deploy verify-subscription Edge Function
2. Test complete flow with test payment
3. Monitor for 48 hours
4. Check for stuck users
5. Adjust polling timing if needed

---

## Emergency Procedures

### If Many Users Stuck

1. Check Stripe webhook logs
2. Verify webhook is receiving events
3. Check for errors in stripe-webhook function
4. Run bulk update query:
   ```sql
   -- Update all users with active Stripe subscription
   UPDATE users u
   SET
     subscription_tier = 'player',
     subscription_status = 'active'
   WHERE u.stripe_subscription_id IS NOT NULL
     AND u.subscription_tier = 'boyfriend';
   ```

### If Webhook Completely Broken

1. Temporarily use verify-subscription as primary mechanism
2. Add button in settings: "Sync Subscription Status"
3. Users can manually trigger sync
4. Fix webhook configuration
5. Re-enable automatic processing

---

## Rollback Plan

If issues arise:

1. Verify old flow still works (webhook-only)
2. Disable verify-subscription calls temporarily
3. Fix issues
4. Re-enable with monitoring

The webhook still works independently, so the new verification is purely additive and can be disabled if needed.
