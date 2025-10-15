# How to Get Premium Access Locally

Since Stripe checkout doesn't work in local development, you can **manually upgrade your account to premium** in the local database.

## Quick Method

**After creating an account in the app:**

```bash
npm run upgrade your-email@example.com
```

That's it! Refresh your browser and you'll have premium access.

## Step by Step

### 1. Create an Account

1. Go to http://localhost:5173
2. Sign up with any email (e.g., `test@example.com`)
3. Confirm the email at http://127.0.0.1:54324
4. Login to your account

### 2. Upgrade to Premium

Open your terminal and run:

```bash
npm run upgrade test@example.com
```

Replace `test@example.com` with the email you used.

### 3. Refresh Browser

- Refresh the page: `Cmd+R` or `Ctrl+R`
- Or logout and login again
- You should now have premium access!

## What This Does

The script:
1. Finds your user in the local database
2. Sets `subscription_status` to `active`
3. Sets `subscription_tier` to `premium`
4. Adds fake Stripe IDs (for local dev only)

This gives you full access to all premium features without needing Stripe.

## Manual Method (Using Supabase Studio)

If you prefer a GUI:

1. **Open Supabase Studio:** http://127.0.0.1:54323
2. **Go to "Table Editor"**
3. **Find the `auth.users` table**
   - Copy your user's `id`
4. **Go to the `users` table**
5. **Insert or update a row:**
   - `id`: (paste your user ID)
   - `email`: your email
   - `subscription_status`: `active`
   - `subscription_tier`: `premium`
   - `stripe_customer_id`: `cus_local_dev_test`
   - `stripe_subscription_id`: `sub_local_dev_test`
6. **Save** and refresh your browser

## Verify Premium Access

After upgrading, you should be able to:
- ✅ Access all premium pages
- ✅ See premium features unlocked
- ✅ No paywall modals
- ✅ Full functionality

## Multiple Test Users

You can create multiple accounts and upgrade each one:

```bash
# Create accounts in the app, then upgrade them:
npm run upgrade alice@test.com
npm run upgrade bob@test.com
npm run upgrade premium-user@test.com
```

## Reset Database

To start fresh with a clean database:

```bash
npm run db:reset
```

This will:
- Delete all users
- Delete all data
- Reset to initial state
- You'll need to create accounts again

## Downgrade to Free

To test the free tier experience:

```bash
docker exec supabase_db_CPN-Live psql -U postgres -d postgres -c "
UPDATE users
SET subscription_status = 'inactive',
    subscription_tier = 'free'
WHERE email = 'your-email@example.com';
"
```

Then refresh your browser.

## Troubleshooting

**"User not found"**
- Make sure you created the account in the app first
- Check the email spelling
- List all users:
  ```bash
  docker exec supabase_db_CPN-Live psql -U postgres -d postgres -c "SELECT email FROM auth.users;"
  ```

**Still seeing paywall after upgrade**
- Hard refresh: `Cmd+Shift+R` or `Ctrl+Shift+R`
- Try logging out and back in
- Clear browser localStorage and try again

**"users table doesn't exist"**
- Make sure database is running: `npm run db:status`
- Check migrations applied: `npm run db:reset`

## Why This Works

In local development:
- ✅ You control the database
- ✅ No real money involved
- ✅ Safe to modify data
- ✅ Completely isolated from production

In production:
- Stripe handles subscriptions
- Webhooks update the database
- Real payment processing
- This script won't work (and shouldn't!)

## Summary

**To get premium access locally:**

1. Create account: http://localhost:5173
2. Run: `npm run upgrade your-email@example.com`
3. Refresh browser
4. Enjoy premium features!

**No Stripe needed for local development.** Test everything locally, then test Stripe on a preview deployment.
