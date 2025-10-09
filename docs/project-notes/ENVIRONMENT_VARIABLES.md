# Environment Variables Reference

## Quick Reference

### Client-Side (Browser-Accessible)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
NEXT_PUBLIC_STRIPE_PRICE_PLAYER_MODE_WEEKLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_PLAYER_MODE_ANNUAL=price_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_ANONYMOUS_ONBOARDING=false
```

### Server-Only (Never Exposed to Browser)
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Environment-Specific Values

### Development
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_WEBHOOK_SECRET=whsec_... (from `stripe listen`)
```

### Production
```bash
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe Dashboard webhook)
```

## Where to Find Each Value

| Variable | Location |
|----------|----------|
| Supabase URL & Keys | https://supabase.com/dashboard → Project → Settings → API |
| Stripe Publishable Key | https://dashboard.stripe.com → Developers → API Keys |
| Stripe Secret Key | https://dashboard.stripe.com → Developers → API Keys |
| Stripe Webhook Secret (Local) | Output from `stripe listen` command |
| Stripe Webhook Secret (Prod) | https://dashboard.stripe.com → Webhooks → Endpoint details |
| Stripe Price IDs | https://dashboard.stripe.com → Products → Product → Pricing |

## Code Usage

### Accessing in Code
```typescript
// lib/env.ts provides type-safe access
import { env, serverEnv } from '@/lib/env';

// Client or server
const supabaseUrl = env.supabase.url;

// Server-only (will error if used client-side)
const serviceKey = serverEnv.supabase.serviceRoleKey;
```

### Files Modified
- `lib/env.ts` - Central env configuration
- `lib/supabase/client.ts` - Uses `env.*`
- `lib/supabase/server.ts` - Uses `serverEnv.*`
- `lib/stripe/config.ts` - Uses `env.stripe.*`
- All API routes - Use `serverEnv.*` for secrets

