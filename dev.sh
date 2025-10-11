#!/bin/bash

# Local Development Starter Script
# This ensures shell environment variables don't override .env.local

# Unset any VITE_* variables that might be in your shell
unset VITE_SUPABASE_URL
unset VITE_SUPABASE_ANON_KEY
unset VITE_APP_URL
unset VITE_STRIPE_PUBLISHABLE_KEY
unset VITE_STRIPE_PRICE_PLAYER_MODE_WEEKLY
unset VITE_STRIPE_PRICE_PLAYER_MODE_ANNUAL

echo "🧹 Cleared shell environment variables"
echo "📄 Loading from .env.local instead"
echo ""

# Start Vite
npm run dev
