import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as leaderboards from './leaderboards';
import type { MemberWithStats } from './leaderboards';

// Mock the supabase client
vi.mock('./supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

// Mock the calculations module
vi.mock('./calculations', () => ({
  calculateCostPerNut: vi.fn((spent, nuts) => (nuts === 0 ? 0 : spent / nuts)),
  calculateEfficiencyScore: vi.fn(() => 100),
}));

import { supabase } from './supabase/client';

describe('leaderboards module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createGroup', () => {
    it('should create a group with valid name and userId', async () => {
      const mockGroup = {
        id: 'group-123',
        name: 'Test Group',
        created_by: 'user-123',
        invite_token: 'token-123',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockGroup, error: null }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });

      const result = await leaderboards.createGroup('Test Group', 'user-123');

      expect(result.data).toEqual(mockGroup);
      expect(result.error).toBeNull();
      expect(mockInsert).toHaveBeenCalledWith({
        name: 'Test Group',
        created_by: 'user-123',
      });
    });

    it('should trim whitespace from group name', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: {}, error: null }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });

      await leaderboards.createGroup('  Trimmed Name  ', 'user-123');

      expect(mockInsert).toHaveBeenCalledWith({
        name: 'Trimmed Name',
        created_by: 'user-123',
      });
    });

    it('should reject group name shorter than 3 characters', async () => {
      const result = await leaderboards.createGroup('AB', 'user-123');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Group name must be between 3 and 100 characters');
    });

    it('should reject group name longer than 100 characters', async () => {
      const longName = 'A'.repeat(101);
      const result = await leaderboards.createGroup(longName, 'user-123');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Group name must be between 3 and 100 characters');
    });

    it('should accept group name exactly 3 characters', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: {}, error: null }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });

      const result = await leaderboards.createGroup('ABC', 'user-123');

      expect(result.error).toBeNull();
    });

    it('should accept group name exactly 100 characters', async () => {
      const exactName = 'A'.repeat(100);
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: {}, error: null }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });

      const result = await leaderboards.createGroup(exactName, 'user-123');

      expect(result.error).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });

      const result = await leaderboards.createGroup('Valid Name', 'user-123');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Database error');
    });
  });

  describe('getUserGroups', () => {
    it('should return empty array when user is not in any groups', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await leaderboards.getUserGroups('user-123');

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it('should fetch and return groups with member counts', async () => {
      const mockMemberData = [
        { group_id: 'group-1' },
        { group_id: 'group-2' },
      ];

      const mockGroupsData = [
        { id: 'group-1', name: 'Group 1', created_by: 'user-1' },
        { id: 'group-2', name: 'Group 2', created_by: 'user-2' },
      ];

      let callCount = 0;
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'leaderboard_members') {
          if (callCount === 0) {
            callCount++;
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: mockMemberData, error: null }),
              }),
            };
          } else {
            // For member count queries
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ count: 5 }),
              }),
            };
          }
        } else if (table === 'leaderboard_groups') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: mockGroupsData, error: null }),
            }),
          };
        }
      });

      const result = await leaderboards.getUserGroups('user-123');

      expect(result.data).toHaveLength(2);
      expect(result.error).toBeNull();
    });

    it('should handle errors when fetching member data', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Member fetch error' },
        }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await leaderboards.getUserGroups('user-123');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Member fetch error');
    });
  });

  describe('calculateRankings', () => {
    it('should rank members by cost per nut ascending', () => {
      const members: MemberWithStats[] = [
        {
          id: 'member-1',
          group_id: 'group-1',
          user_id: 'user-1',
          display_username: 'User1',
          joined_at: '2024-01-01',
          stats: {
            total_spent: 100,
            total_nuts: 10,
            cost_per_nut: 10,
            total_time_minutes: 60,
            total_girls: 5,
            efficiency_score: 50,
          },
        },
        {
          id: 'member-2',
          group_id: 'group-1',
          user_id: 'user-2',
          display_username: 'User2',
          joined_at: '2024-01-02',
          stats: {
            total_spent: 50,
            total_nuts: 10,
            cost_per_nut: 5,
            total_time_minutes: 60,
            total_girls: 3,
            efficiency_score: 60,
          },
        },
      ];

      const rankings = leaderboards.calculateRankings(members);

      expect(rankings).toHaveLength(2);
      expect(rankings[0].rank).toBe(1);
      expect(rankings[0].member.display_username).toBe('User2');
      expect(rankings[1].rank).toBe(2);
      expect(rankings[1].member.display_username).toBe('User1');
    });

    it('should use efficiency score as tiebreaker for equal cost per nut', () => {
      const members: MemberWithStats[] = [
        {
          id: 'member-1',
          group_id: 'group-1',
          user_id: 'user-1',
          display_username: 'User1',
          joined_at: '2024-01-01',
          stats: {
            total_spent: 100,
            total_nuts: 10,
            cost_per_nut: 10,
            total_time_minutes: 60,
            total_girls: 5,
            efficiency_score: 80,
          },
        },
        {
          id: 'member-2',
          group_id: 'group-1',
          user_id: 'user-2',
          display_username: 'User2',
          joined_at: '2024-01-02',
          stats: {
            total_spent: 100,
            total_nuts: 10,
            cost_per_nut: 10,
            total_time_minutes: 60,
            total_girls: 3,
            efficiency_score: 90,
          },
        },
      ];

      const rankings = leaderboards.calculateRankings(members);

      expect(rankings[0].member.display_username).toBe('User2'); // Higher efficiency
      expect(rankings[1].member.display_username).toBe('User1');
    });

    it('should place members without data at the end', () => {
      const members: MemberWithStats[] = [
        {
          id: 'member-1',
          group_id: 'group-1',
          user_id: 'user-1',
          display_username: 'User1',
          joined_at: '2024-01-01',
          stats: {
            total_spent: 0,
            total_nuts: 0,
            cost_per_nut: 0,
            total_time_minutes: 0,
            total_girls: 0,
            efficiency_score: 0,
          },
        },
        {
          id: 'member-2',
          group_id: 'group-1',
          user_id: 'user-2',
          display_username: 'User2',
          joined_at: '2024-01-02',
          stats: {
            total_spent: 100,
            total_nuts: 10,
            cost_per_nut: 10,
            total_time_minutes: 60,
            total_girls: 3,
            efficiency_score: 90,
          },
        },
      ];

      const rankings = leaderboards.calculateRankings(members);

      expect(rankings[0].member.display_username).toBe('User2'); // Has data
      expect(rankings[1].member.display_username).toBe('User1'); // No data
    });

    it('should sort members without data by join date', () => {
      const members: MemberWithStats[] = [
        {
          id: 'member-1',
          group_id: 'group-1',
          user_id: 'user-1',
          display_username: 'User1',
          joined_at: '2024-01-03',
          stats: {
            total_spent: 0,
            total_nuts: 0,
            cost_per_nut: 0,
            total_time_minutes: 0,
            total_girls: 0,
            efficiency_score: 0,
          },
        },
        {
          id: 'member-2',
          group_id: 'group-1',
          user_id: 'user-2',
          display_username: 'User2',
          joined_at: '2024-01-01',
          stats: {
            total_spent: 0,
            total_nuts: 0,
            cost_per_nut: 0,
            total_time_minutes: 0,
            total_girls: 0,
            efficiency_score: 0,
          },
        },
      ];

      const rankings = leaderboards.calculateRankings(members);

      expect(rankings[0].member.display_username).toBe('User2'); // Joined earlier
      expect(rankings[1].member.display_username).toBe('User1');
    });

    it('should handle empty array', () => {
      const rankings = leaderboards.calculateRankings([]);
      expect(rankings).toEqual([]);
    });
  });

  describe('joinGroup', () => {
    it('should validate username length (minimum)', async () => {
      const result = await leaderboards.joinGroup('token-123', 'user-123', 'A');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Username must be between 2 and 50 characters');
    });

    it('should validate username length (maximum)', async () => {
      const longUsername = 'A'.repeat(51);
      const result = await leaderboards.joinGroup('token-123', 'user-123', longUsername);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Username must be between 2 and 50 characters');
    });

    it('should accept username exactly 2 characters', async () => {
      // Mock getGroupIdFromToken
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'group-123', name: 'Test' },
            error: null,
          }),
        }),
      });

      let callIndex = 0;
      (supabase.from as any).mockImplementation(() => {
        if (callIndex === 0) {
          callIndex++;
          return { select: mockSelect };
        } else if (callIndex === 1) {
          callIndex++;
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          };
        } else {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: {}, error: null }),
              }),
            }),
          };
        }
      });

      const result = await leaderboards.joinGroup('token-123', 'user-123', 'AB');

      expect(result.error).toBeNull();
    });

    it('should detect if user is already a member', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'group-123', name: 'Test' },
            error: null,
          }),
        }),
      });

      let callIndex = 0;
      (supabase.from as any).mockImplementation(() => {
        if (callIndex === 0) {
          callIndex++;
          return { select: mockSelect };
        } else {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'existing-member' },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
      });

      const result = await leaderboards.joinGroup('token-123', 'user-123', 'TestUser');

      expect(result.data).toBeNull();
      expect(result.error).toBe('You are already a member of this group');
    });
  });

  describe('getUserStats', () => {
    it('should return stats from database function', async () => {
      const mockStats = {
        total_spent: '100.50',
        total_nuts: '10',
        cost_per_nut: '10.05',
        total_time_minutes: '120',
        total_girls: '5',
        efficiency_score: '85.5',
      };

      (supabase.rpc as any).mockResolvedValue({
        data: [mockStats],
        error: null,
      });

      const result = await leaderboards.getUserStats('user-123');

      expect(result.total_spent).toBe(100.50);
      expect(result.total_nuts).toBe(10);
      expect(result.cost_per_nut).toBe(10.05);
      expect(result.total_time_minutes).toBe(120);
      expect(result.total_girls).toBe(5);
      expect(result.efficiency_score).toBe(85.5);
    });

    it('should return zero stats when no data available', async () => {
      (supabase.rpc as any).mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await leaderboards.getUserStats('user-123');

      expect(result.total_spent).toBe(0);
      expect(result.total_nuts).toBe(0);
      expect(result.cost_per_nut).toBe(0);
      expect(result.total_time_minutes).toBe(0);
      expect(result.total_girls).toBe(0);
      expect(result.efficiency_score).toBe(0);
    });

    it('should handle null values in stats', async () => {
      const mockStats = {
        total_spent: null,
        total_nuts: null,
        cost_per_nut: null,
        total_time_minutes: null,
        total_girls: null,
        efficiency_score: null,
      };

      (supabase.rpc as any).mockResolvedValue({
        data: [mockStats],
        error: null,
      });

      const result = await leaderboards.getUserStats('user-123');

      expect(result.total_spent).toBe(0);
      expect(result.total_nuts).toBe(0);
      expect(result.cost_per_nut).toBe(0);
      expect(result.total_time_minutes).toBe(0);
      expect(result.total_girls).toBe(0);
      expect(result.efficiency_score).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      (supabase.rpc as any).mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await leaderboards.getUserStats('user-123');

      // Should return zero stats on error
      expect(result.total_spent).toBe(0);
      expect(result.total_nuts).toBe(0);
    });
  });

  describe('isUserMemberOfGroup', () => {
    it('should return true when user is a member', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'member-123' },
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await leaderboards.isUserMemberOfGroup('group-123', 'user-123');

      expect(result).toBe(true);
    });

    it('should return false when user is not a member', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await leaderboards.isUserMemberOfGroup('group-123', 'user-123');

      expect(result).toBe(false);
    });

    it('should return false on database error', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(new Error('Database error')),
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await leaderboards.isUserMemberOfGroup('group-123', 'user-123');

      expect(result).toBe(false);
    });
  });
});