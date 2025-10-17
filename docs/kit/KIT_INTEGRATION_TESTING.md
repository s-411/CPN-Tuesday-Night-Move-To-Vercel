# Kit.com Integration - Testing Guide

## Prerequisites

Before testing, ensure:

1. ✅ **Docker is running** (for local Supabase)
2. ✅ **Kit API key added** to `.env.local`
3. ✅ **Kit Form ID added** to `.env.local` (optional but recommended)
4. ✅ **Database migrations applied**
5. ✅ **Stripe test mode configured**
6. ✅ **Supabase Edge Functions deployed locally**

## Setup Steps

### 1. Start Supabase

```bash
supabase start
```

Wait for all services to start (this may take a minute).

### 2. Apply Database Migrations

```bash
supabase db reset
# or
supabase db push
```

This adds the `kit_subscriber_id` field to the users table.

### 3. Check Supabase Status

```bash
supabase status
```

Make note of:
- API URL (usually `http://127.0.0.1:54321`)
- Anon key
- Service role key

### 4. Start the App

```bash
npm run dev
```

Your app should now be running at `http://localhost:5173`

## Test Sequence

### Test 1: Kit API Connectivity

First, verify that your Kit API key works and the shared module is functioning.

```bash
curl http://localhost:54321/functions/v1/test-kit-api \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Expected Result:**
```json
{
  "success": true,
  "message": "Kit API test completed successfully",
  "subscriberId": "kit_subscriber_id",
  "email": "test-timestamp@example.com",
  "testsRun": [
    "✓ Add subscriber with initial tags",
    "✓ Tag existing subscriber"
  ]
}
```

**Verify in Kit Dashboard:**
1. Go to https://app.kit.com
2. Navigate to Subscribers
3. Search for the test email (test-TIMESTAMP@example.com)
4. Confirm subscriber exists with tags: "signed-up", "test-subscriber", "additional-tag"

✅ **Pass Criteria:** Test subscriber appears in Kit with all 3 tags

---

### Test 2: User Signup Integration

Test that new user signups are automatically synced to Kit.

**Steps:**
1. Open your app at `http://localhost:5173`
2. Navigate to Sign Up page
3. Create a new account with a **real email you have access to**:
   - Email: `your-real-email+test1@gmail.com` (Gmail allows +aliases)
   - Password: `TestPassword123`
   - Name: `Test User` (optional)
4. Complete signup

**Expected Behavior:**
- Check browser console for: `[Auth] Syncing new user to Kit`
- Check browser console for: `[Auth] User synced to Kit: { success: true, ... }`

**Verify in Kit Dashboard:**
1. Go to Kit Subscribers
2. Search for your test email
3. Confirm subscriber exists with tag: "signed-up"

**Verify in Database:**
```bash
# Connect to local Supabase database
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres

# Check user was created with Kit subscriber ID
SELECT id, email, kit_subscriber_id, created_at
FROM public.users
WHERE email = 'your-real-email+test1@gmail.com';
```

**Expected Result:**
- User has a `kit_subscriber_id` (not NULL)
- Kit dashboard shows user with "signed-up" tag

✅ **Pass Criteria:** User appears in Kit with "signed-up" tag, and database has kit_subscriber_id

---

### Test 3: Subscription Activation (Player Mode)

Test that when a user subscribes via Stripe, they get tagged as "player-mode" in Kit.

**Steps:**
1. Log in as the test user from Test 2
2. Navigate to subscription/upgrade page
3. Start Stripe checkout for **weekly** subscription
4. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
5. Complete checkout

**Expected Behavior:**
- Stripe checkout completes successfully
- Stripe webhook fires (`checkout.session.completed`)
- Check Supabase Edge Function logs:
  ```bash
  supabase functions logs stripe-webhook
  ```
  - Look for: `[Stripe Webhook] Tagging user in Kit as player-mode`
  - Look for: `[Stripe Webhook] Successfully tagged user as player-mode in Kit`

**Verify in Kit Dashboard:**
1. Go to Kit Subscribers
2. Search for your test email
3. Confirm subscriber now has TWO tags:
   - "signed-up"
   - "player-mode"

**Verify in Database:**
```sql
SELECT
  email,
  subscription_tier,
  subscription_status,
  subscription_plan_type,
  kit_subscriber_id
FROM public.users
WHERE email = 'your-real-email+test1@gmail.com';
```

**Expected Result:**
- `subscription_tier` = "player"
- `subscription_status` = "active"
- `subscription_plan_type` = "weekly"
- Kit dashboard shows "player-mode" tag

✅ **Pass Criteria:** User has both "signed-up" and "player-mode" tags in Kit

---

### Test 4: Abandoned Cart Flow (Kit-side)

Test that Kit's internal automation can detect abandoned carts.

**Steps:**
1. Create a SECOND new user (different email):
   - Email: `your-real-email+test2@gmail.com`
   - Complete signup BUT DO NOT SUBSCRIBE
2. Wait for user to appear in Kit (check Test 2 verification steps)
3. In Kit Dashboard, set up an automation:
   - **Trigger**: Subscriber is tagged "signed-up"
   - **Wait**: 10 minutes
   - **Condition**: Subscriber does NOT have tag "player-mode"
   - **Action**: Send email (or just log/test action)

**Expected Behavior:**
- After 10 minutes, automation should trigger
- User still only has "signed-up" tag (no "player-mode")
- Automation continues (sends email or performs action)

**Optional: Test upgrade within 10 minutes:**
1. Create THIRD user (`your-real-email+test3@gmail.com`)
2. Sign up
3. Immediately subscribe (within 10 minutes)
4. User gets "player-mode" tag
5. After 10 minutes, automation should NOT trigger (user has "player-mode")

✅ **Pass Criteria:** Kit automation fires for users who don't subscribe, skips users who do subscribe within 10 minutes

---

### Test 5: Subscription Cancellation

Test that cancelled subscriptions are tagged in Kit.

**Steps:**
1. Log in as test user from Test 3 (who has active subscription)
2. Navigate to Stripe Customer Portal:
   - Your app should have a "Manage Subscription" button
   - Or go directly via Stripe test portal link
3. Cancel subscription
4. Confirm cancellation

**Expected Behavior:**
- Stripe webhook fires (`customer.subscription.deleted`)
- Check Supabase Edge Function logs:
  ```bash
  supabase functions logs stripe-webhook
  ```
  - Look for: `[Stripe Webhook] Tagging cancelled user in Kit`
  - Look for: `[Stripe Webhook] Successfully tagged user as cancelled in Kit`

**Verify in Kit Dashboard:**
1. Go to Kit Subscribers
2. Search for your test email
3. Confirm subscriber now has THREE tags:
   - "signed-up"
   - "player-mode"
   - "cancelled"

**Verify in Database:**
```sql
SELECT
  email,
  subscription_tier,
  subscription_status,
  subscription_plan_type,
  kit_subscriber_id
FROM public.users
WHERE email = 'your-real-email+test1@gmail.com';
```

**Expected Result:**
- `subscription_tier` = "boyfriend" (reverted)
- `subscription_status` = "canceled"
- `subscription_plan_type` = NULL
- Kit dashboard shows "cancelled" tag

✅ **Pass Criteria:** User has all three tags in Kit: "signed-up", "player-mode", and "cancelled"

---

## Edge Case Testing

### Edge Case 1: User Already in Kit

**Scenario:** User signs up, but their email already exists in Kit (from previous test or manual add).

**Steps:**
1. Manually add email to Kit first
2. Sign up with that email in your app

**Expected Behavior:**
- Signup succeeds
- Kit API detects existing subscriber
- Tags are added without creating duplicate subscriber
- Database is updated with existing Kit subscriber ID

✅ **Pass Criteria:** No duplicate subscribers in Kit, tags applied correctly

---

### Edge Case 2: Kit API Temporarily Down

**Scenario:** Simulate Kit API failure.

**Steps:**
1. Temporarily set invalid `KIT_API_KEY` in `.env.local`
2. Restart Supabase functions (or restart Supabase)
3. Try signing up a new user

**Expected Behavior:**
- Signup completes successfully (not blocked)
- Browser console shows error: `[Auth] Error syncing to Kit`
- User is created in database
- User does NOT have `kit_subscriber_id` (NULL)

**Recovery:**
1. Fix `KIT_API_KEY`
2. Restart Supabase
3. Manually trigger sync by calling:
   ```bash
   curl http://localhost:54321/functions/v1/kit-user-signup-manual \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "userId": "user-uuid-from-database",
       "email": "failed-user@example.com",
       "firstName": "Test"
     }'
   ```

✅ **Pass Criteria:** App doesn't break when Kit is down, users can still sign up

---

### Edge Case 3: Missing Kit Form ID

**Scenario:** Test without `KIT_FORM_ID` configured.

**Steps:**
1. Remove `KIT_FORM_ID` from `.env.local` (or set to empty string)
2. Restart Supabase
3. Sign up new user

**Expected Behavior:**
- Signup succeeds
- User is added directly to Kit (not associated with a form)
- Tags are still applied
- Kit dashboard shows subscriber without form association

✅ **Pass Criteria:** Integration works without form ID, subscribers added successfully

---

## Debugging Common Issues

### Issue 1: "KIT_API_KEY environment variable is not set"

**Solution:**
1. Check `.env.local` has `KIT_API_KEY=kit_...`
2. Restart Supabase: `supabase stop && supabase start`
3. For production, set in Supabase Dashboard → Edge Functions → Secrets

---

### Issue 2: "Subscriber not found" when tagging

**Cause:** User wasn't added to Kit during signup.

**Solution:**
1. Check signup integration worked (Test 2)
2. Manually sync user:
   ```bash
   curl http://localhost:54321/functions/v1/kit-user-signup-manual \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"userId": "USER_UUID", "email": "user@example.com"}'
   ```

---

### Issue 3: Tags not appearing in Kit

**Possible causes:**
- Kit API rate limiting (unlikely in test mode)
- Tag names are case-sensitive (use exact matches)
- Kit API key doesn't have proper permissions

**Solution:**
1. Check Edge Function logs for errors
2. Verify API key is v4 (not v3)
3. Test Kit API directly with test function (Test 1)

---

### Issue 4: Stripe webhook not triggering

**Possible causes:**
- Webhook secret not configured
- Webhook endpoint not set up in Stripe Dashboard
- Using wrong Stripe mode (live vs. test)

**Solution:**
1. Check webhook is configured in Stripe Dashboard → Developers → Webhooks
2. For local testing, use Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
   ```
3. Check Supabase function logs:
   ```bash
   supabase functions logs stripe-webhook --tail
   ```

---

## Production Testing Checklist

Before deploying to production:

- [ ] All local tests pass (Tests 1-5)
- [ ] Edge cases handled (Edge Cases 1-3)
- [ ] Environment variables set in Vercel + Supabase Dashboard
  - [ ] `KIT_API_KEY` (production key, not test)
  - [ ] `KIT_FORM_ID` (production form)
  - [ ] Stripe production keys
- [ ] Stripe webhook configured for production URL
- [ ] Kit automation created and tested
- [ ] Test with real (non-test) email addresses
- [ ] Monitor logs for first few real signups
- [ ] Verify tags appear in Kit for real users

---

## Monitoring in Production

### Key Metrics to Watch

1. **Kit Subscriber Growth**
   - Should match signup rate
   - Check daily in Kit dashboard

2. **Tag Distribution**
   - "signed-up" tags = total signups
   - "player-mode" tags = active subscribers
   - "cancelled" tags = churned users

3. **Edge Function Errors**
   - Monitor Supabase Dashboard → Functions → Logs
   - Set up alerts for repeated Kit API failures

4. **Database Health**
   - Check percentage of users with `kit_subscriber_id` NOT NULL
   - Should be close to 100% after integration is live

---

## Cleanup After Testing

```sql
-- Delete test users from database
DELETE FROM public.users
WHERE email LIKE '%+test%@gmail.com';

-- Or delete specific test user
DELETE FROM public.users
WHERE email = 'your-real-email+test1@gmail.com';
```

**In Kit Dashboard:**
1. Search for test subscribers
2. Delete or unsubscribe test emails
3. Remove test tags if desired

---

## Success Criteria

The integration is working correctly when:

✅ New signups automatically appear in Kit with "signed-up" tag
✅ Subscriptions trigger "player-mode" tag in Kit
✅ Cancellations trigger "cancelled" tag in Kit
✅ Kit automation can detect abandoned carts (no "player-mode" tag after 10 min)
✅ Integration is non-blocking (app works even if Kit API is down)
✅ Database has `kit_subscriber_id` for all users synced to Kit
✅ No duplicate subscribers in Kit
✅ Edge cases handled gracefully

---

## Next Steps

Once all tests pass:

1. **Update Documentation**: Add any lessons learned
2. **Set Up Monitoring**: Configure alerts for Kit API failures
3. **Deploy to Production**: Follow production testing checklist
4. **Create Kit Automations**:
   - Abandoned cart sequence (10-min wait)
   - Welcome sequence for "signed-up" tag
   - Re-engagement for "cancelled" tag
5. **Monitor Results**: Track conversion rates and email engagement

---

## Support

- Kit API Issues: https://help.kit.com
- Integration Issues: See [KIT_INTEGRATION.md](./KIT_INTEGRATION.md)
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
