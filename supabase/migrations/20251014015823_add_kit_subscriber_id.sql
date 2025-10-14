/*
  # Add Kit Subscriber ID to Users Table

  1. Changes to `users` table
    - Add `kit_subscriber_id` (text) - Stores the Kit.com subscriber ID for API operations
    - This allows us to tag subscribers without looking them up by email each time

  2. Notes
    - Field is optional (nullable) - will be populated on first interaction with Kit
    - Existing users will have NULL until they interact with Kit API
    - No unique constraint because it's managed by Kit's API
*/

-- Add kit_subscriber_id column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'kit_subscriber_id'
  ) THEN
    ALTER TABLE users ADD COLUMN kit_subscriber_id TEXT;

    -- Add index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_users_kit_subscriber_id ON users(kit_subscriber_id);

    -- Add comment for documentation
    COMMENT ON COLUMN users.kit_subscriber_id IS 'Kit.com (ConvertKit) subscriber ID for email marketing integration';
  END IF;
END $$;
