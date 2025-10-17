/*
  Secure fix for leaderboard RLS that avoids recursion

  The key insight: We need to check if a user is a member WITHOUT
  using a subquery that references the same table.

  Solution: Use a security definer function that can bypass RLS
  to check membership directly.
*/

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all member records" ON leaderboard_members;

-- Create a security definer function that checks if user is in the same group
CREATE OR REPLACE FUNCTION user_can_see_member(member_group_id UUID, member_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- User can see a member if:
  -- 1. It's their own member record, OR
  -- 2. They are a member of the same group
  IF member_user_id = auth.uid() THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM leaderboard_members
    WHERE group_id = member_group_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create the new secure policy using the function
CREATE POLICY "Users can view members of their groups"
  ON leaderboard_members FOR SELECT
  TO authenticated
  USING (
    user_can_see_member(group_id, user_id)
  );
