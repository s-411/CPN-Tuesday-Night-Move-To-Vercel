/*
  Fix infinite recursion in leaderboard RLS policies

  The issue: leaderboard_groups SELECT policy checks leaderboard_members,
  and leaderboard_members SELECT policy checks leaderboard_groups back,
  creating circular recursion.

  Solution: Simplify the policies to avoid circular dependencies.
  Use security definer functions where needed to bypass RLS recursion.
*/

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view groups they belong to" ON leaderboard_groups;
DROP POLICY IF EXISTS "Users can view members of their groups" ON leaderboard_members;

-- =====================================================
-- SIMPLER RLS POLICIES WITHOUT RECURSION
-- =====================================================

-- For leaderboard_groups: Users can see groups they created OR are members of
-- We'll use a security definer function to avoid recursion
CREATE OR REPLACE FUNCTION user_is_group_member(group_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM leaderboard_members
    WHERE group_id = group_uuid
    AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create the groups policy using the function
CREATE POLICY "Users can view groups they belong to"
  ON leaderboard_groups FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR user_is_group_member(id, auth.uid())
  );

-- For leaderboard_members: Users can see members of groups they're in
-- Use direct check without subquery recursion
CREATE POLICY "Users can view members of their groups"
  ON leaderboard_members FOR SELECT
  TO authenticated
  USING (
    -- User can see members of groups where they are also a member
    group_id IN (
      SELECT lm.group_id
      FROM leaderboard_members lm
      WHERE lm.user_id = auth.uid()
    )
  );
