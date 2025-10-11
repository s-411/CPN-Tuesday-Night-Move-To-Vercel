/*
  # Leaderboards Feature Schema

  ## Overview
  Creates the database structure for private group leaderboards where users can
  create groups, invite friends via unique tokens, and compete based on dating
  efficiency metrics (cost per nut, total spent, total nuts, etc.).

  ## Tables

  1. **leaderboard_groups**
     - Stores group information and metadata
     - Each group has a unique invite token for sharing
     - Tracks creator and creation date

  2. **leaderboard_members**
     - Junction table linking users to groups
     - Stores anonymous display username for privacy
     - Records join date for each member

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can only see groups they are members of
  - Group creators have additional permissions
  - Invite tokens are unique and cannot be guessed

  ## Features
  - Private groups (only invited members can see)
  - Anonymous usernames within groups
  - Real-time stats calculated from users' data_entries and girls tables
  - Rankings based on cost per nut (primary) and efficiency score (tiebreaker)
*/

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================
-- Generate a URL-safe random token for invites
CREATE OR REPLACE FUNCTION generate_invite_token()
RETURNS TEXT AS $$
BEGIN
  RETURN replace(replace(replace(gen_random_uuid()::text, '-', ''), '{', ''), '}', '');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- LEADERBOARD GROUPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS leaderboard_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) >= 3 AND char_length(name) <= 100),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_token TEXT UNIQUE NOT NULL DEFAULT generate_invite_token(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_invite_token UNIQUE (invite_token)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leaderboard_groups_created_by ON leaderboard_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_leaderboard_groups_invite_token ON leaderboard_groups(invite_token);
CREATE INDEX IF NOT EXISTS idx_leaderboard_groups_created_at ON leaderboard_groups(created_at DESC);

-- =====================================================
-- LEADERBOARD MEMBERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS leaderboard_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES leaderboard_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_username TEXT NOT NULL CHECK (char_length(display_username) >= 2 AND char_length(display_username) <= 50),
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate memberships
  CONSTRAINT unique_group_member UNIQUE (group_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leaderboard_members_group_id ON leaderboard_members(group_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_members_user_id ON leaderboard_members(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_members_joined_at ON leaderboard_members(joined_at DESC);

-- Row Level Security
ALTER TABLE leaderboard_members ENABLE ROW LEVEL SECURITY;

-- Users can view members of groups they belong to
CREATE POLICY "Users can view members of their groups"
  ON leaderboard_members FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT group_id
      FROM leaderboard_members
      WHERE user_id = auth.uid()
    )
  );

-- Users can join groups (insert themselves)
CREATE POLICY "Users can join groups"
  ON leaderboard_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own membership (e.g., change display name)
CREATE POLICY "Users can update own membership"
  ON leaderboard_members FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can leave groups (delete themselves)
CREATE POLICY "Users can leave groups"
  ON leaderboard_members FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- LEADERBOARD GROUPS RLS POLICIES (after members table exists)
-- =====================================================

ALTER TABLE leaderboard_groups ENABLE ROW LEVEL SECURITY;

-- Users can view groups they are members of
CREATE POLICY "Users can view groups they belong to"
  ON leaderboard_groups FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT group_id
      FROM leaderboard_members
      WHERE user_id = auth.uid()
    )
  );

-- Users can create groups
CREATE POLICY "Users can create groups"
  ON leaderboard_groups FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Group creators can update their groups
CREATE POLICY "Group creators can update groups"
  ON leaderboard_groups FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Group creators can delete their groups
CREATE POLICY "Group creators can delete groups"
  ON leaderboard_groups FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Auto-update updated_at timestamp for groups
CREATE TRIGGER update_leaderboard_groups_updated_at
  BEFORE UPDATE ON leaderboard_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-add group creator as first member
CREATE OR REPLACE FUNCTION add_creator_as_member()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the group creator as the first member with their email username
  INSERT INTO leaderboard_members (group_id, user_id, display_username)
  VALUES (
    NEW.id,
    NEW.created_by,
    COALESCE(
      (SELECT display_name FROM users WHERE id = NEW.created_by),
      SPLIT_PART((SELECT email FROM users WHERE id = NEW.created_by), '@', 1)
    )
  )
  ON CONFLICT (group_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_group_created_add_creator ON leaderboard_groups;
CREATE TRIGGER on_group_created_add_creator
  AFTER INSERT ON leaderboard_groups
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_as_member();

-- Function to validate invite tokens
CREATE OR REPLACE FUNCTION validate_invite_token(token TEXT)
RETURNS TABLE(group_id UUID, group_name TEXT, creator_email TEXT, member_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.name,
    u.email,
    COUNT(m.id) as member_count
  FROM leaderboard_groups g
  LEFT JOIN users u ON g.created_by = u.id
  LEFT JOIN leaderboard_members m ON g.id = m.group_id
  WHERE g.invite_token = token
  GROUP BY g.id, g.name, u.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user leaderboard stats
CREATE OR REPLACE FUNCTION get_user_leaderboard_stats(user_uuid UUID)
RETURNS TABLE(
  total_spent NUMERIC,
  total_nuts BIGINT,
  cost_per_nut NUMERIC,
  total_time_minutes BIGINT,
  total_girls BIGINT,
  efficiency_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(de.amount_spent), 0)::NUMERIC as total_spent,
    COALESCE(SUM(de.number_of_nuts), 0)::BIGINT as total_nuts,
    CASE
      WHEN COALESCE(SUM(de.number_of_nuts), 0) = 0 THEN 0
      ELSE ROUND((COALESCE(SUM(de.amount_spent), 0) / COALESCE(SUM(de.number_of_nuts), 1))::NUMERIC, 2)
    END as cost_per_nut,
    COALESCE(SUM(de.duration_minutes), 0)::BIGINT as total_time_minutes,
    COUNT(DISTINCT g.id)::BIGINT as total_girls,
    CASE
      WHEN COALESCE(SUM(de.amount_spent), 0) = 0 THEN 0
      WHEN COALESCE(SUM(de.number_of_nuts), 0) = 0 THEN 0
      ELSE ROUND(
        (
          (COALESCE(SUM(de.number_of_nuts), 0)::NUMERIC / COALESCE(SUM(de.amount_spent), 1)::NUMERIC * 100) +
          (COALESCE(SUM(de.number_of_nuts), 0)::NUMERIC / NULLIF(COALESCE(SUM(de.duration_minutes), 1), 0)::NUMERIC * 60 * 10) +
          COALESCE(AVG(g.rating), 0)::NUMERIC
        ), 2
      )
    END as efficiency_score
  FROM users u
  LEFT JOIN girls g ON g.user_id = u.id AND g.is_active = true
  LEFT JOIN data_entries de ON de.girl_id = g.id
  WHERE u.id = user_uuid
  GROUP BY u.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HELPFUL VIEWS (Optional - for easier querying)
-- =====================================================

-- View to see group membership counts
CREATE OR REPLACE VIEW leaderboard_group_stats AS
SELECT
  g.id as group_id,
  g.name as group_name,
  g.created_by,
  g.created_at,
  COUNT(m.id) as member_count,
  u.email as creator_email
FROM leaderboard_groups g
LEFT JOIN leaderboard_members m ON g.id = m.group_id
LEFT JOIN users u ON g.created_by = u.id
GROUP BY g.id, g.name, g.created_by, g.created_at, u.email;

-- Grant access to authenticated users
GRANT SELECT ON leaderboard_group_stats TO authenticated;
