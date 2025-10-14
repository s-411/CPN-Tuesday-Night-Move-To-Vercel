# Kit.com Integration - Quick Start

## 🚀 Fast Setup (5 minutes)

### 1. Get Kit API Key

```
1. Go to: https://app.kit.com/account_settings/advanced
2. Generate v4 API key
3. Copy key (starts with kit_)
```

### 2. Add to Environment

Add to `.env.local`:
```bash
KIT_API_KEY=kit_b4a8dc959884b5317eb2b7244bdd5f54
KIT_FORM_ID=8220547  # Optional
```

### 3. Apply Database Migration

```bash
supabase db reset
# or
supabase db push
```

### 4. Test Connection

```bash
# Start Supabase if not running
supabase start

# Test Kit API
curl http://localhost:54321/functions/v1/test-kit-api \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Expected:** `{ "success": true, ... }`

---

## 📋 Integration Overview

| Event | Tag in Kit | When |
|-------|-----------|------|
| User signs up | `signed-up` | Immediately |
| User subscribes | `player-mode` | On Stripe checkout success |
| User cancels | `cancelled` | On subscription deletion |

**Abandoned Cart:** Kit automation checks for absence of `player-mode` tag after 10 minutes

---

## 🧪 Quick Test Flow

1. **Test Signup**
   ```
   - Create account in app
   - Check Kit for "signed-up" tag
   ```

2. **Test Subscribe**
   ```
   - Complete Stripe checkout (test mode: 4242 4242 4242 4242)
   - Check Kit for "player-mode" tag
   ```

3. **Test Cancel**
   ```
   - Cancel subscription via Stripe portal
   - Check Kit for "cancelled" tag
   ```

---

## 🔧 Key Files

| File | Purpose |
|------|---------|
| [`supabase/functions/_shared/kit-api.ts`](../supabase/functions/_shared/kit-api.ts) | Kit API client |
| [`supabase/functions/stripe-webhook/index.ts`](../supabase/functions/stripe-webhook/index.ts) | Stripe webhook handler (tags users) |
| [`src/contexts/AuthContext.tsx`](../src/contexts/AuthContext.tsx) | Signup integration |
| [`.env.local`](../.env.local) | Environment config |

---

## 📊 Kit Automation Setup

In Kit Dashboard:

1. Create Automation
2. **Trigger:** Tag "signed-up"
3. **Wait:** 10 minutes
4. **Condition:** Does NOT have tag "player-mode"
5. **Action:** Send abandoned cart email

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "KIT_API_KEY not set" | Restart Supabase after adding to `.env.local` |
| Tags not appearing | Check Edge Function logs: `supabase functions logs stripe-webhook` |
| Webhook not firing | Use Stripe CLI: `stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook` |

---

## 📚 Full Documentation

- **Setup:** [KIT_INTEGRATION.md](./KIT_INTEGRATION.md)
- **Testing:** [KIT_INTEGRATION_TESTING.md](./KIT_INTEGRATION_TESTING.md)
- **Kit API v4:** https://developers.kit.com/v4

---

## 🚦 Production Checklist

Before deploying:

- [ ] Set `KIT_API_KEY` in Vercel Dashboard
- [ ] Set `KIT_API_KEY` in Supabase Dashboard (Edge Functions → Secrets)
- [ ] Set `KIT_FORM_ID` in both
- [ ] Configure Stripe production webhook
- [ ] Test with real (non-test) email
- [ ] Create Kit automation for abandoned cart

---

## 📈 Success Metrics

Integration is working when:

✅ Signup rate = Kit "signed-up" tag count
✅ Subscription rate = Kit "player-mode" tag count
✅ Churn rate = Kit "cancelled" tag count
✅ 100% of users have `kit_subscriber_id` in database

---

**That's it! You're ready to go.** 🎉

For detailed testing steps, see [KIT_INTEGRATION_TESTING.md](./KIT_INTEGRATION_TESTING.md)
