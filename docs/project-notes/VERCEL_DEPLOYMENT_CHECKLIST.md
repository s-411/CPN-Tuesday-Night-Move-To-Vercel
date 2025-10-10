# Vercel Deployment Checklist

## Required Environment Variables

Verify ALL of these are set in your Vercel project settings:
**Settings → Environment Variables**

### Supabase (Required)
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (sensitive!)

### Stripe (Required)
- ✅ `STRIPE_SECRET_KEY` - Stripe secret key (starts with `sk_`)
- ✅ `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret (starts with `whsec_`)
- ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (starts with `pk_`)
- ✅ `NEXT_PUBLIC_STRIPE_PRICE_PLAYER_MODE_WEEKLY` - Weekly plan price ID (starts with `price_`)
- ✅ `NEXT_PUBLIC_STRIPE_PRICE_PLAYER_MODE_ANNUAL` - Annual plan price ID (starts with `price_`)

### App Configuration (Optional)
- `NEXT_PUBLIC_APP_URL` - Your app's URL (e.g., `https://app.cost-per-nut.com`)

## Debugging Production Issues

### View Vercel Function Logs

1. Go to your Vercel dashboard
2. Click on your deployment
3. Go to **Functions** tab
4. Click on `/api/checkout`
5. View real-time logs

### Common Issues

**500 Error on `/api/checkout`**

Check the logs for:
```
[Checkout API] Environment check
```

If you see missing environment variables, add them in Vercel settings.

**401 Unauthorized**

Check logs for:
```
[Checkout API] No auth token provided
```

This means the frontend isn't sending the auth token correctly.

**Stripe API Error**

Check logs for:
```
[Checkout API] ERROR
```

Look at the error message - usually invalid price ID or Stripe key issues.

## After Updating Environment Variables

1. Redeploy your app (or Vercel will auto-redeploy)
2. Test the checkout flow at `/step-4`
3. Check Function logs for `[Checkout API]` messages

## Test URLs for Production

- Onboarding: `https://your-domain.com/step-1`
- Checkout test: `https://your-domain.com/step-4`

## Emergency Rollback

If deployment breaks:
```bash
# In Vercel dashboard:
Deployments → Click on previous working deployment → Promote to Production
```

