/**
 * Leaderboards Backend Logic
 *
 * This module handles all leaderboard operations including:
 * - Creating and managing groups
 * - Validating and joining via invite tokens
 * - Calculating user stats from their data
 * - Ranking members by cost per nut and efficiency
 */

import { supabase } from './supabase/client';
import { calculateCostPerNut, calculateEfficiencyScore } from './calculations';

// =====================================================
// TYPES
// =====================================================

export interface LeaderboardGroup {
  id: string;
  name: string;
  created_by: string;
  invite_token: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export interface LeaderboardMember {
  id: string;
  group_id: string;
  user_id: string;
  display_username: string;
  joined_at: string;
}

export interface UserStats {
  total_spent: number;
  total_nuts: number;
  cost_per_nut: number;
  total_time_minutes: number;
  total_girls: number;
  efficiency_score: number;
}

export interface MemberWithStats extends LeaderboardMember {
  stats: UserStats;
}

export interface Ranking {
  rank: number;
  member: MemberWithStats;
}

export interface InviteValidation {
  valid: boolean;
  group?: {
    id: string;
    name: string;
    creator_email: string;
    member_count: number;
  };
  error?: string;
}

// =====================================================
// GROUP MANAGEMENT
// =====================================================

/**
 * Create a new leaderboard group
 * Database trigger automatically adds creator as first member
 * @param name - Group name (3-100 characters)
 * @param userId - ID of the user creating the group
 * @returns The created group or error
 */
export async function createGroup(name: string, userId: string) {
  try {
    // Validate name length
    if (name.length < 3 || name.length > 100) {
      return { data: null, error: 'Group name must be between 3 and 100 characters' };
    }

    const { data, error } = await supabase
      .from('leaderboard_groups')
      .insert({
        name: name.trim(),
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;

    // Explicitly add creator as member (defense in depth - works with or without trigger)
    // ON CONFLICT in database constraint prevents duplicates if trigger also runs
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('display_name, email')
        .eq('id', userId)
        .single();

      const displayUsername = userData?.display_name || userData?.email?.split('@')[0] || 'User';

      await supabase
        .from('leaderboard_members')
        .insert({
          group_id: data.id,
          user_id: userId,
          display_username: displayUsername,
        });
    } catch (memberError) {
      // Ignore conflicts - trigger may have already added creator
      console.log('Creator auto-join handled (trigger or conflict):', memberError);
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Error creating group:', error);
    return { data: null, error: error.message || 'Failed to create group' };
  }
}

/**
 * Get all groups that a user is a member of
 * @param userId - User ID
 * @returns Array of groups with member counts
 */
export async function getUserGroups(userId: string) {
  try {
    // First, get the group IDs the user is a member of
    const { data: memberData, error: memberError } = await supabase
      .from('leaderboard_members')
      .select('group_id')
      .eq('user_id', userId);

    if (memberError) throw memberError;

    if (!memberData || memberData.length === 0) {
      return { data: [], error: null };
    }

    const groupIds = memberData.map((m) => m.group_id);

    // Then, fetch the groups directly (avoiding nested query that causes recursion)
    const { data: groupsData, error: groupsError } = await supabase
      .from('leaderboard_groups')
      .select('*')
      .in('id', groupIds);

    if (groupsError) throw groupsError;

    // Get member counts for each group
    const groups: LeaderboardGroup[] = await Promise.all(
      (groupsData || []).map(async (group) => {
        const { count } = await supabase
          .from('leaderboard_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        return {
          ...group,
          member_count: count || 0,
        };
      })
    );

    return { data: groups, error: null };
  } catch (error: any) {
    console.error('Error fetching user groups:', error);
    return { data: null, error: error.message || 'Failed to fetch groups' };
  }
}

/**
 * Get a single group by ID
 * @param groupId - Group ID
 * @returns Group data with member count
 */
export async function getGroupById(groupId: string) {
  try {
    const { data, error } = await supabase
      .from('leaderboard_groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (error) throw error;

    // Get member count
    const { count } = await supabase
      .from('leaderboard_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId);

    return {
      data: {
        ...data,
        member_count: count || 0,
      },
      error: null,
    };
  } catch (error: any) {
    console.error('Error fetching group:', error);
    return { data: null, error: error.message || 'Failed to fetch group' };
  }
}

/**
 * Update a group's name (only creator can do this)
 * @param groupId - Group ID
 * @param name - New group name
 * @param userId - User ID (must be creator)
 */
export async function updateGroupName(groupId: string, name: string, userId: string) {
  try {
    const { data, error } = await supabase
      .from('leaderboard_groups')
      .update({ name: name.trim() })
      .eq('id', groupId)
      .eq('created_by', userId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating group:', error);
    return { data: null, error: error.message || 'Failed to update group' };
  }
}

/**
 * Delete a group (only creator can do this)
 * @param groupId - Group ID
 * @param userId - User ID (must be creator)
 */
export async function deleteGroup(groupId: string, userId: string) {
  try {
    const { error } = await supabase
      .from('leaderboard_groups')
      .delete()
      .eq('id', groupId)
      .eq('created_by', userId);

    if (error) throw error;

    return { error: null };
  } catch (error: any) {
    console.error('Error deleting group:', error);
    return { error: error.message || 'Failed to delete group' };
  }
}

// =====================================================
// INVITE TOKEN MANAGEMENT
// =====================================================

/**
 * Validate an invite token and get group information
 * @param token - Invite token
 * @returns Validation result with group info if valid
 */
export async function validateInviteToken(token: string): Promise<InviteValidation> {
  try {
    const { data, error } = await supabase.rpc('validate_invite_token', { token });

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        valid: false,
        error: 'Invalid or expired invite link',
      };
    }

    const groupInfo = data[0];
    return {
      valid: true,
      group: {
        id: groupInfo.group_id,
        name: groupInfo.group_name,
        creator_email: groupInfo.creator_email,
        member_count: parseInt(groupInfo.member_count),
      },
    };
  } catch (error: any) {
    console.error('Error validating invite token:', error);
    return {
      valid: false,
      error: error.message || 'Failed to validate invite token',
    };
  }
}

/**
 * Get group ID from invite token
 * @param token - Invite token
 * @returns Group ID or null
 */
export async function getGroupIdFromToken(token: string) {
  try {
    const { data, error } = await supabase
      .from('leaderboard_groups')
      .select('id, name')
      .eq('invite_token', token)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error getting group from token:', error);
    return { data: null, error: error.message || 'Invalid invite token' };
  }
}

// =====================================================
// MEMBER MANAGEMENT
// =====================================================

/**
 * Join a group using an invite token
 * @param token - Invite token
 * @param userId - User ID
 * @param displayUsername - Anonymous username for this group
 * @returns Membership data or error
 */
export async function joinGroup(token: string, userId: string, displayUsername: string) {
  try {
    // Validate username length
    if (displayUsername.length < 2 || displayUsername.length > 50) {
      return { data: null, error: 'Username must be between 2 and 50 characters' };
    }

    // Get group from token
    const groupResult = await getGroupIdFromToken(token);
    if (groupResult.error || !groupResult.data) {
      return { data: null, error: groupResult.error || 'Invalid invite token' };
    }

    const groupId = groupResult.data.id;

    // Check if user is already a member
    const { data: existing } = await supabase
      .from('leaderboard_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      return { data: null, error: 'You are already a member of this group' };
    }

    // Add user to group
    const { data, error } = await supabase
      .from('leaderboard_members')
      .insert({
        group_id: groupId,
        user_id: userId,
        display_username: displayUsername.trim(),
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error joining group:', error);
    return { data: null, error: error.message || 'Failed to join group' };
  }
}

/**
 * Leave a group
 * @param groupId - Group ID
 * @param userId - User ID
 */
export async function leaveGroup(groupId: string, userId: string) {
  try {
    const { error } = await supabase
      .from('leaderboard_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;

    return { error: null };
  } catch (error: any) {
    console.error('Error leaving group:', error);
    return { error: error.message || 'Failed to leave group' };
  }
}

/**
 * Update display username in a group
 * @param groupId - Group ID
 * @param userId - User ID
 * @param displayUsername - New username
 */
export async function updateDisplayUsername(groupId: string, userId: string, displayUsername: string) {
  try {
    const { data, error } = await supabase
      .from('leaderboard_members')
      .update({ display_username: displayUsername.trim() })
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating username:', error);
    return { data: null, error: error.message || 'Failed to update username' };
  }
}

/**
 * Get all members of a group
 * @param groupId - Group ID
 * @returns Array of members
 */
export async function getGroupMembers(groupId: string) {
  try {
    const { data, error } = await supabase
      .from('leaderboard_members')
      .select('*')
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error: any) {
    console.error('Error fetching group members:', error);
    return { data: null, error: error.message || 'Failed to fetch members' };
  }
}

// =====================================================
// STATS CALCULATION
// =====================================================

/**
 * Get stats for a user using the database function
 * @param userId - User ID
 * @returns User stats
 */
export async function getUserStats(userId: string): Promise<UserStats> {
  try {
    const { data, error } = await supabase.rpc('get_user_leaderboard_stats', {
      user_uuid: userId,
    });

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        total_spent: 0,
        total_nuts: 0,
        cost_per_nut: 0,
        total_time_minutes: 0,
        total_girls: 0,
        efficiency_score: 0,
      };
    }

    const stats = data[0];
    return {
      total_spent: parseFloat(stats.total_spent) || 0,
      total_nuts: parseInt(stats.total_nuts) || 0,
      cost_per_nut: parseFloat(stats.cost_per_nut) || 0,
      total_time_minutes: parseInt(stats.total_time_minutes) || 0,
      total_girls: parseInt(stats.total_girls) || 0,
      efficiency_score: parseFloat(stats.efficiency_score) || 0,
    };
  } catch (error: any) {
    console.error('Error fetching user stats:', error);
    return {
      total_spent: 0,
      total_nuts: 0,
      cost_per_nut: 0,
      total_time_minutes: 0,
      total_girls: 0,
      efficiency_score: 0,
    };
  }
}

/**
 * Get members with their stats
 * @param groupId - Group ID
 * @returns Array of members with calculated stats
 */
export async function getMembersWithStats(groupId: string): Promise<MemberWithStats[]> {
  try {
    const membersResult = await getGroupMembers(groupId);
    if (membersResult.error || !membersResult.data) {
      return [];
    }

    // Get stats for each member
    const membersWithStats = await Promise.all(
      membersResult.data.map(async (member) => {
        const stats = await getUserStats(member.user_id);
        return {
          ...member,
          stats,
        };
      })
    );

    return membersWithStats;
  } catch (error: any) {
    console.error('Error fetching members with stats:', error);
    return [];
  }
}

// =====================================================
// RANKINGS
// =====================================================

/**
 * Calculate rankings for group members
 * Sorted by: Cost per nut (ascending), then efficiency score (descending)
 * @param members - Array of members with stats
 * @returns Sorted array with rank assignments
 */
export function calculateRankings(members: MemberWithStats[]): Ranking[] {
  // Filter out members with no data
  const validMembers = members.filter((m) => m.stats.total_nuts > 0);

  // Sort by cost per nut (ascending - lower is better), then by efficiency score (descending - higher is better)
  const sorted = [...validMembers].sort((a, b) => {
    // Primary: Cost per nut (lower is better)
    if (a.stats.cost_per_nut !== b.stats.cost_per_nut) {
      return a.stats.cost_per_nut - b.stats.cost_per_nut;
    }
    // Tiebreaker: Efficiency score (higher is better)
    return b.stats.efficiency_score - a.stats.efficiency_score;
  });

  // Assign ranks
  return sorted.map((member, index) => ({
    rank: index + 1,
    member,
  }));
}

/**
 * Get rankings for a group
 * @param groupId - Group ID
 * @returns Sorted rankings with all member data
 */
export async function getGroupRankings(groupId: string): Promise<Ranking[]> {
  try {
    const membersWithStats = await getMembersWithStats(groupId);
    return calculateRankings(membersWithStats);
  } catch (error: any) {
    console.error('Error calculating rankings:', error);
    return [];
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Check if a user is a member of a group
 * @param groupId - Group ID
 * @param userId - User ID
 * @returns Boolean indicating membership
 */
export async function isUserMemberOfGroup(groupId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('leaderboard_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    return !!data && !error;
  } catch (error) {
    return false;
  }
}

/**
 * Get the user's display username in a specific group
 * @param groupId - Group ID
 * @param userId - User ID
 * @returns Display username or null
 */
export async function getUserDisplayName(groupId: string, userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('leaderboard_members')
      .select('display_username')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    return data.display_username;
  } catch (error) {
    return null;
  }
}
