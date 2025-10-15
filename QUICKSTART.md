# Quick Start Guide - Local Development

Get up and running with local development in under 5 minutes.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (running)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`brew install supabase/tap/supabase`)

## Setup (First Time)

```bash
# 1. Install dependencies
npm install

# 2. Run the setup script
npm run setup

# 3. Start the dev server (in a new terminal)
npm run dev
```

That's it! Open http://localhost:5173

## Daily Development

```bash
# Start the database
npm run db:start

# Start the dev server
npm run dev
```

## Get Premium Access (Important!)

To test premium features locally, you need to manually upgrade your account:

```bash
# 1. Create an account in the app first
# 2. Then run this command:
npm run upgrade your-email@example.com
```

That's it! Refresh your browser and you'll have full premium access.

See [LOCAL_PREMIUM_ACCESS.md](./LOCAL_PREMIUM_ACCESS.md) for details.

## Important URLs

| What | URL |
|------|-----|
| Your App | http://localhost:5173 |
| Database Admin | http://127.0.0.1:54323 |
| Test Emails | http://127.0.0.1:54324 |

## Useful Commands

```bash
# Database
npm run db:start     # Start local database
npm run db:stop      # Stop local database
npm run db:reset     # Reset database (clean slate)
npm run db:status    # Check database status
npm run db:studio    # Open database admin UI

# Premium Access
npm run upgrade user@example.com  # Upgrade account to premium

# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run typecheck    # Check TypeScript
```

## Testing Premium Features

1. **Create account** at http://localhost:5173
2. **Confirm email** at http://127.0.0.1:54324
3. **Upgrade to premium:**
   ```bash
   npm run upgrade test@example.com
   ```
4. **Refresh browser** - you now have premium access!

All data is **local only** - no impact on production.

See [LOCAL_PREMIUM_ACCESS.md](./LOCAL_PREMIUM_ACCESS.md) for more details.

## Environment Variables

Your `.env.local` is already configured for local development:
- Points to local Supabase at `http://127.0.0.1:54321`
- Uses safe development keys
- **Never affects production**

To switch between local and production, see [LOCAL_DEVELOPMENT.md](./docs/local/LOCAL_DEVELOPMENT.md)

## Need Help?

See [LOCAL_DEVELOPMENT.md](./docs/local/LOCAL_DEVELOPMENT.md) for detailed documentation.

## Common Issues

**Can't connect to database?**
```bash
npm run db:status    # Check if running
npm run db:start     # Start it
```

**Port already in use?**
- Stop the conflicting service
- Or edit ports in `supabase/config.toml`

**Changes not showing?**
- Restart dev server: `Ctrl+C` then `npm run dev`
- Clear browser cache/localStorage
