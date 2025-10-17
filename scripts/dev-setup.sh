#!/bin/bash

# Local Development Setup Script for CPN-Live
# This script helps you get started with local development

set -e

echo "🚀 CPN-Live Local Development Setup"
echo "===================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi
echo "✅ Docker is running"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "Install it with: brew install supabase/tap/supabase"
    exit 1
fi
echo "✅ Supabase CLI is installed"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found. Creating from example..."
    cp .env.local.example .env.local
    echo "✅ Created .env.local"
    echo "⚠️  Please edit .env.local and add your Stripe test keys"
else
    echo "✅ .env.local exists"
fi

# Stop any existing Supabase instance
echo ""
echo "🛑 Stopping any existing Supabase instance..."
supabase stop > /dev/null 2>&1 || true

# Start Supabase
echo ""
echo "🔄 Starting Supabase local instance..."
supabase start

# Get status
echo ""
echo "📊 Supabase Status:"
echo "==================="
supabase status

echo ""
echo "✅ Setup Complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Open Supabase Studio: http://127.0.0.1:54323"
echo "2. Start the dev server: npm run dev"
echo "3. Open the app: http://localhost:5173"
echo ""
echo "📧 Test emails will appear in: http://127.0.0.1:54324"
echo ""
echo "💡 Useful commands:"
echo "   npm run dev          - Start development server"
echo "   supabase status      - Check Supabase status"
echo "   supabase stop        - Stop Supabase"
echo "   supabase db reset    - Reset database to clean state"
echo ""
