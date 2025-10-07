#!/bin/bash

# ============================================
# Next.js Migration Setup Script
# ============================================
# This script automates the setup process

set -e  # Exit on error

echo ""
echo "🚀 Setting up your Next.js app..."
echo ""

# Step 1: Set up environment file
echo "📝 Step 1: Setting up environment variables..."
if [ -f ".env.local" ]; then
    echo "   ⚠️  .env.local already exists. Backing up to .env.local.backup"
    mv .env.local .env.local.backup
fi

if [ -f "env.local.READY" ]; then
    mv env.local.READY .env.local
    echo "   ✅ Created .env.local with your credentials"
else
    echo "   ❌ Error: env.local.READY not found!"
    exit 1
fi

# Step 2: Update package.json
echo ""
echo "📦 Step 2: Updating package.json for Next.js..."
if [ -f "package.nextjs.json" ]; then
    # Backup existing package.json
    if [ -f "package.json" ]; then
        cp package.json package.json.vite.backup
        echo "   ℹ️  Backed up old package.json to package.json.vite.backup"
    fi
    cp package.nextjs.json package.json
    echo "   ✅ Updated package.json"
else
    echo "   ❌ Error: package.nextjs.json not found!"
    exit 1
fi

# Step 3: Install dependencies
echo ""
echo "📥 Step 3: Installing dependencies..."
echo "   (This may take a minute...)"
npm install
echo "   ✅ Dependencies installed"

# Step 4: Check for Stripe CLI
echo ""
echo "🔍 Step 4: Checking for Stripe CLI..."
if command -v stripe &> /dev/null; then
    echo "   ✅ Stripe CLI is installed"
else
    echo "   ⚠️  Stripe CLI not found!"
    echo ""
    echo "   To install Stripe CLI:"
    echo "   - macOS: brew install stripe/stripe-cli/stripe"
    echo "   - Other: https://stripe.com/docs/stripe-cli#install"
    echo ""
fi

# Done!
echo ""
echo "═══════════════════════════════════════════════════"
echo "✨ Setup Complete!"
echo "═══════════════════════════════════════════════════"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Open a NEW terminal window and run:"
echo "   stripe listen --forward-to localhost:3000/api/stripe/webhook"
echo ""
echo "2. Copy the webhook secret (whsec_xxxxx) from that command"
echo ""
echo "3. Open .env.local and replace this line:"
echo "   STRIPE_WEBHOOK_SECRET=whsec_REPLACE_WITH_OUTPUT_FROM_STRIPE_LISTEN"
echo "   with the actual value from step 2"
echo ""
echo "4. In THIS terminal, start your app:"
echo "   npm run dev"
echo ""
echo "5. Visit: http://localhost:3000"
echo ""
echo "═══════════════════════════════════════════════════"
echo ""
echo "📚 Documentation:"
echo "   - START_HERE.md - Quick overview"
echo "   - SETUP_INSTRUCTIONS.md - Detailed guide"
echo "   - VERCEL_ENV_VARS.txt - For deployment"
echo ""
echo "🎉 You're ready to go! Good luck!"
echo ""

