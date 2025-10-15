# Kit.com (ConvertKit) Integration

## Overview

This integration connects your app with Kit.com (formerly ConvertKit) for email marketing automation. The integration tracks three key user lifecycle events:

1. **User Signup** → Tag: "signed-up"
2. **Subscription Activation** → Tag: "player-mode"
3. **Subscription Cancellation** → Tag: "cancelled"

Kit handles abandoned cart detection internally by waiting 10 minutes and checking if the user has the "player-mode" tag.

## Architecture

### Components

- **`supabase/functions/_shared/kit-api.ts`** - Kit API v4 client library
- **Database field**: `users.kit_subscriber_id` - Stores Kit subscriber ID for fast lookups
- **Integration points**:
  - User signup flow (auth trigger)
  - Stripe webhook: `checkout.session.completed`
  - Stripe webhook: `customer.subscription.deleted`

### Kit API v4

- **Base URL**: `https://api.kit.com/v4`
- **Authentication**: Bearer token (API key)
- **Documentation**: https://developers.kit.com/v4

Key differences from v3:
- Uses `email_address` parameter instead of `email`
- Cursor-based pagination instead of page-based
- Better performance and async processing

## Environment Variables

### Local Development (.env.local)

```bash
# Kit API v4 Key
KIT_API_KEY=kit_b0cdf11ceffbe1deb5dee542ced4fa2f

# Kit Form ID (optional - to add subscribers to a specific form)
KIT_FORM_ID=8220547
```

### Production (Vercel/Supabase Dashboard)

Make sure to set these in:
- **Vercel Dashboard** → Settings → Environment Variables
- **Supabase Dashboard** → Edge Functions → Secrets

```bash
KIT_API_KEY=kit_your_production_api_key
KIT_FORM_ID=your_form_id
```

## Setup Instructions

### 1. Get Kit API Key

1. Go to https://app.kit.com/account_settings/advanced
2. Generate a v4 API key (NOT v3!)
3. Copy the key (starts with `kit_`)
4. Add to `.env.local`

### 2. Get Kit Form ID (Optional)

1. Go to Kit Dashboard → Forms
2. Select your signup form
3. Copy the form ID from the URL
4. Add to `.env.local` as `KIT_FORM_ID`

If you don't provide a form ID, subscribers will be added directly without being associated with a specific form.

### 3. Apply Database Migration

```bash
# Start Supabase (if not already running)
supabase start

# Apply the migration
supabase db reset

# Or if you want to apply just this migration:
supabase db push
```

This adds the `kit_subscriber_id` field to the `users` table.

### 4. Deploy Edge Functions

When deploying to production, make sure to set the environment variables:

```bash
# Set Kit API secrets in Supabase
supabase secrets set KIT_API_KEY=kit_your_production_api_key
supabase secrets set KIT_FORM_ID=your_form_id
```

## Testing

### Test Kit API Connectivity

There's a test Edge Function to verify your Kit API setup:

```bash
# Start Supabase (if not running)
supabase start

# Run the test function
curl http://localhost:54321/functions/v1/test-kit-api \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

This will:
- Create a test subscriber in Kit
- Apply initial tags ("signed-up", "test-subscriber")
- Add an additional tag ("additional-tag")
- Return success/failure

Check your Kit dashboard to verify the test subscriber appears with all tags.

### Manual Testing Flow

1. **Test Signup**:
   - Create a new account in your app
   - Check Kit dashboard - user should appear with "signed-up" tag

2. **Test Subscription**:
   - Complete Stripe checkout (test mode)
   - Check Kit - user should have "player-mode" tag

3. **Test Abandoned Cart (in Kit)**:
   - Create account but don't subscribe
   - Wait 10 minutes
   - Kit automation should trigger (check for absence of "player-mode" tag)

4. **Test Cancellation**:
   - Cancel a subscription via Stripe portal
   - Check Kit - user should have "cancelled" tag

## Kit API Functions

### `addSubscriberWithTags(email, tags, firstName?)`

Adds a subscriber to Kit with initial tags.

```typescript
const result = await addSubscriberWithTags(
  "user@example.com",
  ["signed-up"],
  "John"
);
// Returns: { subscriberId: "kit_subscriber_id", email: "user@example.com" }
```

### `tagSubscriberByEmail(email, tagName)`

Tags an existing subscriber by email address.

```typescript
await tagSubscriberByEmail("user@example.com", "player-mode");
```

### `getSubscriberByEmail(email)`

Looks up a subscriber by email address.

```typescript
const subscriber = await getSubscriberByEmail("user@example.com");
// Returns: KitSubscriber object or null if not found
```

## Kit Automation Setup

In your Kit account, create an automation with:

1. **Trigger**: Tag "signed-up"
2. **Wait**: 10 minutes
3. **Condition**: If subscriber does NOT have tag "player-mode"
4. **Action**: Send abandoned cart email sequence

If the user upgrades within 10 minutes, they'll get the "player-mode" tag and be removed from the abandoned cart flow automatically.

## Error Handling

The Kit integration is designed to be non-blocking:

- If Kit API is down, the signup/subscription will still succeed
- Errors are logged but don't prevent user operations
- Kit API calls are async and don't block the main flow
- Idempotency is handled - duplicate tags won't cause issues

## Troubleshooting

### "KIT_API_KEY environment variable is not set"

Make sure you've added `KIT_API_KEY` to:
- `.env.local` for local development
- Supabase secrets for production Edge Functions

### "Kit API error: 401 Unauthorized"

Your API key is invalid or expired. Generate a new v4 API key.

### "Subscriber not found"

The subscriber hasn't been added to Kit yet. Make sure the signup integration is working first.

### Tags not appearing in Kit

- Check Edge Function logs for errors
- Verify tag names match exactly (case-sensitive)
- Tags are created automatically if they don't exist

## Migration Notes

### From v3 to v4

If you have existing v3 integration:
- v3 API keys are NOT compatible with v4
- Generate a new v4 API key
- Update parameter names: `email` → `email_address`
- Pagination is now cursor-based, not page-based

## Future Enhancements (Phase V)

### Email Change Sync

Currently not implemented. When users change their email:
- ✅ Supabase Auth updates
- ✅ Users table updates
- ✅ Stripe updates
- ❌ Kit keeps old email

**Workaround**: Users changing emails is rare. If needed, manually update in Kit dashboard or implement email change webhook later.

To implement:
1. Hook into email change event in Supabase Auth
2. Use Kit API to update subscriber email or migrate subscriber
3. Handle edge cases (new email already exists in Kit)

## Support

- Kit API Docs: https://developers.kit.com/v4
- Kit Support: https://help.kit.com
- Internal docs: This file

## Tags Reference

| Tag | Applied When | Purpose |
|-----|-------------|---------|
| `signed-up` | User creates account | Initial signup tracking |
| `player-mode` | User subscribes (weekly/annual) | Indicates active subscriber |
| `cancelled` | User cancels subscription | Post-cancellation follow-up |

Note: Kit automations can use these tags to trigger email sequences.
