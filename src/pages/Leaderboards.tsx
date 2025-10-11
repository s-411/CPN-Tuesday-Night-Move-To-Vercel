import { useState, useEffect } from 'react';
import { Plus, Trophy, LinkIcon, Users, Eye, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createGroup, getUserGroups, LeaderboardGroup } from '../lib/leaderboards';

interface LeaderboardsProps {
  onNavigateToGroup?: (groupId: string) => void;
  refreshTrigger?: number; // Add a prop to trigger refresh
}

export function Leaderboards({ onNavigateToGroup, refreshTrigger }: LeaderboardsProps) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<LeaderboardGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user, refreshTrigger]); // Reload when refreshTrigger changes

  const loadGroups = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await getUserGroups(user.id);
      if (error) throw new Error(error);
      setGroups(data || []);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!user) return;

    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    if (groupName.length < 3) {
      setError('Group name must be at least 3 characters');
      return;
    }

    try {
      const { data, error } = await createGroup(groupName.trim(), user.id);
      if (error) throw new Error(error);

      setGroupName('');
      setError('');
      setIsCreating(false);
      await loadGroups();

      // Navigate to the new group
      if (data && onNavigateToGroup) {
        onNavigateToGroup(data.id);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create group');
    }
  };

  const copyInviteLink = (group: LeaderboardGroup) => {
    const inviteLink = `${window.location.origin}/join/${group.invite_token}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedToken(group.invite_token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-cpn-yellow animate-spin mx-auto mb-4" />
          <p className="text-cpn-gray">Loading groups...</p>
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="min-h-[60vh]">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-heading text-cpn-white mb-2">Leaderboards</h1>
          <p className="text-cpn-gray">
            Create group leaderboards to compete with friends
          </p>
        </div>

        {/* Empty State with Hero Section */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center animate-fade-in">
            <div className="text-6xl mb-8">🏆</div>
            <h2 className="text-4xl font-heading text-cpn-white mb-4">
              Create Group Leaderboards
            </h2>
            <p className="text-xl text-cpn-gray mb-8 max-w-2xl mx-auto">
              Invite your friends to compare cost per nut results and dating efficiency.
              Create private groups and see who's the most efficient dater.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4 justify-center mb-12 max-w-md mx-auto">
              {!isCreating ? (
                <>
                  <button
                    onClick={() => setIsCreating(true)}
                    className="btn-cpn flex-1 inline-flex items-center justify-center gap-2 text-lg px-8 py-4"
                  >
                    <Plus className="w-6 h-6" />
                    Create Your First Group
                  </button>
                  <button
                    onClick={() => onNavigateToGroup && onNavigateToGroup('example')}
                    className="btn-secondary flex-1 inline-flex items-center justify-center gap-2 text-lg px-8 py-4"
                  >
                    <Eye className="w-6 h-6" />
                    See Example Group
                  </button>
                </>
              ) : (
                <div className="w-full">
                  <div className="card-cpn text-left">
                    <h3 className="text-lg font-heading text-cpn-white mb-4">Create Group</h3>
                    <div className="space-y-4">
                      <div>
                        <input
                          type="text"
                          placeholder="Enter group name..."
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                          className="input-cpn w-full"
                          onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
                          autoFocus
                        />
                        {error && (
                          <p className="text-red-400 text-sm mt-1">{error}</p>
                        )}
                      </div>
                      <div className="bg-cpn-dark2/50 rounded-lg p-3">
                        <p className="text-sm text-cpn-gray">
                          <strong>Privacy Notice:</strong> This leaderboard is completely private.
                          Only people you invite can see it. All usernames are kept anonymous.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setIsCreating(false);
                            setGroupName('');
                            setError('');
                          }}
                          className="flex-1 py-3 px-4 text-cpn-gray border border-cpn-gray/30 rounded-lg hover:text-cpn-white hover:border-cpn-gray transition-all duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreateGroup}
                          className="flex-1 btn-cpn"
                        >
                          Create Group
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Benefits */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="card-cpn bg-gradient-to-br from-cpn-dark2 to-cpn-dark text-center">
                <Users className="w-12 h-12 text-cpn-yellow mx-auto mb-4" />
                <h3 className="text-lg font-heading text-cpn-white mb-2">Private Groups</h3>
                <p className="text-cpn-gray text-sm">
                  Only invited members can see your group. Complete privacy guaranteed.
                </p>
              </div>
              <div className="card-cpn bg-gradient-to-br from-cpn-dark2 to-cpn-dark text-center">
                <Eye className="w-12 h-12 text-cpn-yellow mx-auto mb-4" />
                <h3 className="text-lg font-heading text-cpn-white mb-2">Anonymous</h3>
                <p className="text-cpn-gray text-sm">
                  All usernames are kept anonymous. Only you know your real identity.
                </p>
              </div>
              <div className="card-cpn bg-gradient-to-br from-cpn-dark2 to-cpn-dark text-center">
                <Trophy className="w-12 h-12 text-cpn-yellow mx-auto mb-4" />
                <h3 className="text-lg font-heading text-cpn-white mb-2">Competitive</h3>
                <p className="text-cpn-gray text-sm">
                  Rankings based on cost per nut efficiency and dating metrics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-heading text-cpn-white mb-2">Your Groups</h1>
          <p className="text-cpn-gray">
            {groups.length} group{groups.length !== 1 ? 's' : ''} created
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="btn-cpn flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Group
        </button>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
        {groups.map((group) => (
          <div
            key={group.id}
            className="card-cpn bg-gradient-to-br from-cpn-dark2 to-cpn-dark hover:border-cpn-yellow/30 transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-heading text-cpn-white mb-1">{group.name}</h3>
                <p className="text-cpn-gray text-sm">
                  {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                </p>
              </div>
              <Trophy className="w-6 h-6 text-cpn-yellow" />
            </div>

            <div className="text-sm text-cpn-gray mb-4">
              Created {new Date(group.created_at).toLocaleDateString()}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onNavigateToGroup && onNavigateToGroup(group.id)}
                className="flex-1 btn-cpn py-2 px-4 text-sm"
              >
                View Rankings
              </button>
              <button
                onClick={() => copyInviteLink(group)}
                className="p-2 border border-cpn-gray/30 rounded-lg hover:border-cpn-yellow transition-colors"
                title="Copy invite link"
              >
                <LinkIcon
                  className={`w-4 h-4 ${
                    copiedToken === group.invite_token ? 'text-cpn-yellow' : 'text-cpn-gray hover:text-cpn-yellow'
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Group Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-cpn-dark border border-cpn-gray/20 rounded-lg w-full max-w-md animate-slide-up">
            <div className="p-6">
              <h3 className="text-xl font-heading text-cpn-white mb-4">Create New Group</h3>
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Enter group name..."
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="input-cpn w-full"
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
                    autoFocus
                  />
                  {error && (
                    <p className="text-red-400 text-sm mt-1">{error}</p>
                  )}
                </div>
                <div className="bg-cpn-dark2/50 rounded-lg p-3">
                  <p className="text-sm text-cpn-gray">
                    <strong>Privacy Notice:</strong> This leaderboard is completely private.
                    Only people you invite can see it. All usernames are kept anonymous.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setGroupName('');
                      setError('');
                    }}
                    className="flex-1 py-3 px-4 text-cpn-gray border border-cpn-gray/30 rounded-lg hover:text-cpn-white hover:border-cpn-gray transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateGroup}
                    className="flex-1 btn-cpn"
                  >
                    Create Group
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
