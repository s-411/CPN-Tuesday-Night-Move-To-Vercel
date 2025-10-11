#!/bin/bash

# Script to manually upgrade a user to premium in local development
# Usage: ./scripts/upgrade-to-premium.sh <email>

if [ -z "$1" ]; then
  echo "❌ Please provide an email address"
  echo "Usage: ./scripts/upgrade-to-premium.sh user@example.com"
  exit 1
fi

EMAIL="$1"

echo "🔍 Looking for user: $EMAIL"

# Get user ID from auth.users
USER_ID=$(docker exec supabase_db_CPN-Live psql -U postgres -d postgres -t -c "SELECT id FROM auth.users WHERE email = '$EMAIL';")

if [ -z "$USER_ID" ]; then
  echo "❌ User not found: $EMAIL"
  echo ""
  echo "Available users:"
  docker exec supabase_db_CPN-Live psql -U postgres -d postgres -c "SELECT email, created_at FROM auth.users ORDER BY created_at DESC;"
  exit 1
fi

# Trim whitespace
USER_ID=$(echo $USER_ID | xargs)

echo "✅ Found user ID: $USER_ID"
echo "🚀 Upgrading to premium..."

# Update or insert into users table
docker exec supabase_db_CPN-Live psql -U postgres -d postgres -c "
INSERT INTO users (id, email, subscription_status, subscription_tier, stripe_customer_id, stripe_subscription_id)
VALUES (
  '$USER_ID',
  '$EMAIL',
  'active',
  'premium',
  'cus_local_dev_' || substring('$USER_ID', 1, 8),
  'sub_local_dev_' || substring('$USER_ID', 1, 8)
)
ON CONFLICT (id) DO UPDATE SET
  subscription_status = 'active',
  subscription_tier = 'premium',
  stripe_customer_id = COALESCE(users.stripe_customer_id, 'cus_local_dev_' || substring('$USER_ID', 1, 8)),
  stripe_subscription_id = COALESCE(users.stripe_subscription_id, 'sub_local_dev_' || substring('$USER_ID', 1, 8));
"

echo ""
echo "✅ User upgraded to premium!"
echo ""
echo "📊 User details:"
docker exec supabase_db_CPN-Live psql -U postgres -d postgres -c "
SELECT
  u.email,
  u.subscription_status,
  u.subscription_tier,
  u.stripe_customer_id,
  u.stripe_subscription_id
FROM users u
WHERE u.id = '$USER_ID';
"

echo ""
echo "🎉 Done! Refresh your browser to see premium features."
echo "   If you're already logged in, you may need to log out and back in."
