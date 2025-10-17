/*
  # Sync Display Name Updates to Leaderboards

  ## Purpose
  When a user updates their display_name in the users table, automatically
  update their display_username in ALL leaderboard groups they're a member of.

  ## Why This Is Needed
  Currently, display_username is stored per-group in leaderboard_members.
  When users update their global display_name, it doesn't propagate to their
  leaderboard memberships, causing their old name to persist in all groups.

  ## How It Works
  A trigger on the users table detects display_name updates and automatically
  updates all corresponding leaderboard_members.display_username entries.

  ## Edge Cases Handled
  - If display_name is set to NULL, falls back to email username
  - Updates happen atomically within the same transaction
  - Works across all groups the user is a member of
*/

-- =====================================================
-- FUNCTION: Sync display_name to all leaderboard groups
-- =====================================================
CREATE OR REPLACE FUNCTION sync_display_name_to_leaderboards()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if display_name has actually changed
  IF (OLD.display_name IS DISTINCT FROM NEW.display_name) THEN
    -- Update display_username in all groups the user is a member of
    UPDATE leaderboard_members
    SET display_username = COALESCE(
      NEW.display_name,
      SPLIT_PART(NEW.email, '@', 1)
    )
    WHERE user_id = NEW.id;

    -- Log the update for debugging
    RAISE NOTICE 'Updated display_username for user % in % groups',
      NEW.id,
      (SELECT COUNT(*) FROM leaderboard_members WHERE user_id = NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER: Auto-sync on users.display_name update
-- =====================================================
DROP TRIGGER IF EXISTS on_display_name_updated ON users;
CREATE TRIGGER on_display_name_updated
  AFTER UPDATE OF display_name ON users
  FOR EACH ROW
  EXECUTE FUNCTION sync_display_name_to_leaderboards();

-- =====================================================
-- BACKFILL: Sync existing display_names to leaderboards
-- =====================================================
-- For all existing users with a display_name set, update their leaderboard memberships
UPDATE leaderboard_members lm
SET display_username = COALESCE(
  u.display_name,
  SPLIT_PART(u.email, '@', 1)
)
FROM users u
WHERE lm.user_id = u.id
  AND u.display_name IS NOT NULL
  AND lm.display_username != u.display_name;
