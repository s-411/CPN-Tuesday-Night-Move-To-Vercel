# 🚨 IMPORTANT: Environment Variable Issue Fixed

## The Problem We Just Found

Your **shell had production Supabase credentials** set as environment variables, which were **overriding** your `.env.local` file. This is why:

1. ❌ Your account was created in **production** (not local)
2. ❌ The upgrade script couldn't find your user (looking in local DB)
3. ❌ You were connecting to the live site instead of local

## The Solution

Those environment variables have been temporarily unset in the current dev server process, but they'll come back when you restart your terminal.

## What You Need to Do NOW

### 1. Stop Using the Current Terminal

Your current terminal still has those production env vars set. We need to remove them permanently.

### 2. Find Where They're Set

Check these files for `VITE_SUPABASE_URL`:

```bash
# Check your shell config files
grep -r "VITE_SUPABASE" ~/.bashrc ~/.bash_profile ~/.zshrc ~/.zprofile 2>/dev/null
```

### 3. Remove Them

Edit the file(s) found above and **remove or comment out** any lines like:

```bash
export VITE_SUPABASE_URL=https://mgcmkwrtjpkxmjjixyiy.supabase.co
export VITE_SUPABASE_ANON_KEY=...
```

### 4. Restart Your Terminal

**Close your current terminal completely** and open a new one. This loads the fresh config.

### 5. Start Development with the Safe Script

From now on, use this command to start development:

```bash
./dev.sh
```

This script:
- Automatically unsets any shell env vars
- Loads from `.env.local` instead
- Ensures you're always using local Supabase

Or you can manually unset and run:

```bash
unset VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY && npm run dev
```

## Testing It Worked

After restarting your terminal:

```bash
# This should return nothing (or different values)
echo $VITE_SUPABASE_URL

# Start dev server
./dev.sh

# Check the app uses local Supabase
# Open http://localhost:5173
# Open browser console (F12)
# You should NOT see production URLs
```

## Creating a New Account (The Right Way)

**NOW you can create a real local account:**

1. **Close old terminal, open NEW terminal**
2. **Start dev server:**
   ```bash
   cd /Users/steveharris/Documents/GitHub/CPN-Live
   ./dev.sh
   ```
3. **Go to:** http://localhost:5173
4. **Create account** with a NEW email (e.g., `local@test.com`)
5. **Confirm email** at http://127.0.0.1:54324
6. **Login**
7. **Upgrade to premium:**
   ```bash
   npm run upgrade local@test.com
   ```
8. **Refresh browser** - premium access!

## What About the Old Account?

The account `localdev1@gmail.com` was created in **production** (because shell env vars pointed there). You have two options:

### Option A: Leave it (Recommended)
- It's in production but inactive
- No harm done
- Just create a new local account

### Option B: Delete it from Production
- Go to https://supabase.com/dashboard
- Find your project
- Go to Authentication → Users
- Delete `localdev1@gmail.com`

## Summary of the Issue

**What happened:**
1. Your shell had production credentials as environment variables
2. Shell env vars override `.env.local` in Vite
3. App connected to production instead of local
4. Your test account went to production DB
5. Upgrade script looked in local DB (empty)
6. User not found!

**The fix:**
1. Remove production env vars from shell config
2. Use `./dev.sh` to start development
3. This ensures `.env.local` is respected
4. Create new accounts in LOCAL database

## Prevention

**Never do this:**

```bash
# Don't export VITE_* variables in your shell
export VITE_SUPABASE_URL=https://...  # ❌ BAD
```

**Instead:**

- Keep all config in `.env.local` file
- Use `./dev.sh` to start dev server
- Shell env vars should stay clean

## Quick Reference

```bash
# Start development (safe way)
./dev.sh

# Or manually
unset VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY && npm run dev

# Create account in app

# Upgrade to premium
npm run upgrade your-email@example.com
```

---

**The app is NOW running correctly on local Supabase!** Just close your terminal and start fresh following the steps above.
