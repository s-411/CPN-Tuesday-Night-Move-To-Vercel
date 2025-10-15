# Local Development Setup

This guide explains how to run the CPN-Live application locally using Docker for the database, allowing you to create accounts, log in, and test locally **without affecting the production database or live site**.

## Overview

The local development environment uses:
- **Supabase CLI** to manage a local PostgreSQL database in Docker
- **Local environment variables** that point to the local database
- **Vite dev server** for the frontend
- **Test mode Stripe keys** for payment testing

## Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or later)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

### Installing Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Windows (PowerShell)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
brew install supabase/tap/supabase
```

## Initial Setup

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd CPN-Live
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

The default values in `.env.local` are already configured for local development:
- Supabase runs at `http://127.0.0.1:54321`
- Uses local Supabase default keys (safe for local development)
- Stripe test keys (you'll need to add your own from Stripe Dashboard)

**Important:** The `.env.local` file is in `.gitignore` and will **never** be committed to git.

### 3. Start Local Supabase

Start the local Supabase instance (this will use Docker):

```bash
supabase start
```

This command will:
- Pull necessary Docker images (first time only)
- Start PostgreSQL database
- Start Supabase services (Auth, Storage, Realtime, etc.)
- Apply database migrations from `supabase/migrations/`
- Display connection details

You'll see output like:

```
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
  S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   S3 Access Key: 625729a08b95bf1b7ff351a663f3a23c
   S3 Secret Key: 850181e4652dd023b7a98c58ae0d2d34bd487ee0cc3254aed6eda37307425907
       S3 Region: local
```

**Keep this terminal window open** or run in the background.

### 4. Access Supabase Studio

Open your browser and navigate to:

```
http://127.0.0.1:54323
```

This is the Supabase Studio UI where you can:
- View and edit database tables
- Manage authentication users
- Test SQL queries
- Monitor logs
- View storage buckets

### 5. Start the Development Server

In a new terminal window:

```bash
npm run dev
```

Your app will be available at:

```
http://localhost:5173
```

## Development Workflow

### Creating Test Users

You can create test users in two ways:

#### Option 1: Through the App UI
1. Go to `http://localhost:5173`
2. Sign up with any email (e.g., `test@example.com`)
3. The confirmation email will appear in Inbucket: `http://127.0.0.1:54324`
4. Click the confirmation link in the email

#### Option 2: Through Supabase Studio
1. Go to `http://127.0.0.1:54323`
2. Navigate to "Authentication" → "Users"
3. Click "Add user"
4. Enter email and password
5. Check "Auto Confirm User" to skip email confirmation

### Database Management

#### View Tables
- Open Supabase Studio: `http://127.0.0.1:54323`
- Go to "Table Editor"
- Browse your tables: `profiles`, `girls`, `growth_data`, etc.

#### Run SQL Queries
- In Supabase Studio, go to "SQL Editor"
- Write and execute SQL queries
- Example: View all users
  ```sql
  SELECT * FROM auth.users;
  ```

#### Reset Database
To start fresh with a clean database:

```bash
supabase db reset
```

This will:
- Drop all tables
- Re-run all migrations
- Seed with initial data (if configured)

### Testing Payments Locally

The local setup uses **Stripe Test Mode** keys:

1. Get your test keys from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Add them to `.env.local`:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   ```
3. Use [test card numbers](https://stripe.com/docs/testing#cards):
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

### Switching Between Local and Production

Your `.env.local` file has both local and production Supabase credentials:

**For Local Development:**
```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**For Production Testing:**
Uncomment the production credentials and comment out the local ones:
```env
# VITE_SUPABASE_URL=http://127.0.0.1:54321
# VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-key
```

**Always restart your dev server after changing environment variables.**

## Common Commands

### Supabase Commands

```bash
# Start local Supabase
supabase start

# Stop local Supabase
supabase stop

# Check status
supabase status

# Reset database (clean slate)
supabase db reset

# View logs
supabase logs

# Generate TypeScript types from database schema
supabase gen types typescript --local > src/lib/types/database.ts
```

### Development Server

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Important URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | Vite dev server |
| Supabase API | http://127.0.0.1:54321 | Local Supabase API |
| Supabase Studio | http://127.0.0.1:54323 | Database management UI |
| Inbucket | http://127.0.0.1:54324 | Email testing (catches all emails) |
| Database | postgresql://postgres:postgres@127.0.0.1:54322/postgres | Direct database connection |

## Database Migrations

Your database schema is defined in migration files under `supabase/migrations/`:

- `20251003170314_create_cpn_database_schema.sql` - Main schema
- `20251003175117_fix_rls_performance_and_security.sql` - RLS policies
- `20251004004220_divine_wind.sql` - Additional changes

These are automatically applied when you run `supabase start`.

### Creating New Migrations

```bash
# Create a new migration file
supabase migration new my_new_migration

# This creates a new file in supabase/migrations/
# Edit it to add your schema changes

# Apply the migration
supabase db reset
```

## Troubleshooting

### Docker Issues

**Problem:** Docker is not running
```
Error: Cannot connect to the Docker daemon
```

**Solution:** Start Docker Desktop

### Port Conflicts

**Problem:** Ports already in use
```
Error: Port 54321 is already in use
```

**Solution:** Stop other services or configure different ports in `supabase/config.toml`

### Database Connection Errors

**Problem:** Can't connect to database
```
Error: fetch failed
```

**Solution:**
1. Check if Supabase is running: `supabase status`
2. Restart Supabase: `supabase stop && supabase start`
3. Check `.env.local` has correct URL: `http://127.0.0.1:54321`

### Environment Variables Not Loading

**Problem:** Changes to `.env.local` not taking effect

**Solution:**
1. Stop the dev server (Ctrl+C)
2. Restart: `npm run dev`
3. Clear browser cache/localStorage

### Migration Errors

**Problem:** Database migrations fail

**Solution:**
```bash
# Reset and reapply migrations
supabase db reset

# If issues persist, check migration SQL syntax
# in supabase/migrations/
```

## Security Notes

- **Local credentials** are safe default Supabase development keys
- **Never commit** `.env.local` to git (it's in `.gitignore`)
- **Production credentials** in `.env.local` are commented out by default
- **Local database** is completely isolated from production
- **Test Stripe keys** prevent accidental charges

## Production Deployment

This local setup does **not** affect production. Production is deployed separately:

- **Hosting:** Vercel
- **Database:** Supabase Cloud (production instance)
- **Environment Variables:** Configured in Vercel Dashboard

See [PRODUCTION_LAUNCH_GUIDE.md](./PRODUCTION_LAUNCH_GUIDE.md) for production deployment.

## Need Help?

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Local Development Guide](https://supabase.com/docs/guides/local-development)
- [Supabase Docker](https://supabase.com/docs/guides/self-hosting/docker)
