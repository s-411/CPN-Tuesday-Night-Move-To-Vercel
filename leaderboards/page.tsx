'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon, UserGroupIcon, TrophyIcon, LinkIcon, EyeIcon } from '@heroicons/react/24/outline';
import { leaderboardGroupsStorage, initializeSampleGroups } from '@/lib/leaderboards';
import { LeaderboardGroup } from '@/lib/types';

export default function LeaderboardsPage() {
  const [groups, setGroups] = useState<LeaderboardGroup[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Initialize sample data on first load
    initializeSampleGroups();
    loadGroups();
  }, []);

  const loadGroups = () => {
    const userGroups = leaderboardGroupsStorage.getAll();
    setGroups(userGroups);
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    if (groupName.length < 3) {
      setError('Group name must be at least 3 characters');
      return;
    }

    try {
      const newGroup = leaderboardGroupsStorage.create(
        { name: groupName.trim() },
        'current-user'
      );
      
      setGroupName('');
      setError('');
      setIsCreating(false);
      loadGroups();
      
      // Redirect to the new group
      window.location.href = `/leaderboards/${newGroup.id}`;
    } catch (error) {
      setError('Failed to create group');
    }
  };

  const copyInviteLink = (group: LeaderboardGroup) => {
    const inviteLink = `${window.location.origin}/join/${group.inviteToken}`;
    navigator.clipboard.writeText(inviteLink);
    // TODO: Add success toast notification
  };

  if (groups.length === 0) {
    return (
      <div className="min-h-screen bg-cpn-dark">
        {/* Header */}
        <div className="border-b border-cpn-gray/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <h1 className="text-3xl font-heading text-cpn-white">Leaderboards</h1>
              <p className="text-cpn-gray mt-1">
                Create group leaderboards to compete with friends
              </p>
            </div>
          </div>
        </div>

        {/* Empty State with Hero Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center animate-fade-in">
            <div className="text-6xl mb-8">🏆</div>
            <h2 className="text-4xl font-heading text-cpn-white mb-4">
              Create Group Leaderboards
            </h2>
            <p className="text-xl text-cpn-gray mb-8 max-w-2xl mx-auto">
              Invite your friends to compare cost per nut results and dating efficiency. 
              Create private groups and see who's the most efficient dater.
            </p>

            {/* Benefits */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="card-cpn bg-gradient-to-br from-cpn-dark2 to-cpn-dark text-center">
                <UserGroupIcon className="w-12 h-12 text-cpn-yellow mx-auto mb-4" />
                <h3 className="text-lg font-heading text-cpn-white mb-2">Private Groups</h3>
                <p className="text-cpn-gray text-sm">
                  Only invited members can see your group. Complete privacy guaranteed.
                </p>
              </div>
              <div className="card-cpn bg-gradient-to-br from-cpn-dark2 to-cpn-dark text-center">
                <EyeIcon className="w-12 h-12 text-cpn-yellow mx-auto mb-4" />
                <h3 className="text-lg font-heading text-cpn-white mb-2">Anonymous</h3>
                <p className="text-cpn-gray text-sm">
                  All usernames are kept anonymous. Only you know your real identity.
                </p>
              </div>
              <div className="card-cpn bg-gradient-to-br from-cpn-dark2 to-cpn-dark text-center">
                <TrophyIcon className="w-12 h-12 text-cpn-yellow mx-auto mb-4" />
                <h3 className="text-lg font-heading text-cpn-white mb-2">Competitive</h3>
                <p className="text-cpn-gray text-sm">
                  Rankings based on cost per nut efficiency and dating metrics.
                </p>
              </div>
            </div>

            {/* Create Group Form */}
            {!isCreating ? (
              <button
                onClick={() => setIsCreating(true)}
                className="btn-cpn inline-flex items-center gap-2 text-lg px-8 py-4"
              >
                <PlusIcon className="w-6 h-6" />
                Create Your First Group
              </button>
            ) : (
              <div className="max-w-md mx-auto">
                <div className="card-cpn">
                  <h3 className="text-lg font-heading text-cpn-white mb-4">Create Group</h3>
                  <div className="space-y-4">
                    <div>
                      <input
                        type="text"
                        placeholder="Enter group name..."
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="input-cpn"
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cpn-dark">
      {/* Header */}
      <div className="border-b border-cpn-gray/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-heading text-cpn-white">Your Groups</h1>
              <p className="text-cpn-gray mt-1">
                {groups.length} group{groups.length !== 1 ? 's' : ''} created
              </p>
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="btn-cpn flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Create Group
            </button>
          </div>
        </div>
      </div>

      {/* Groups Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {groups.map((group) => (
            <div key={group.id} className="card-cpn bg-gradient-to-br from-cpn-dark2 to-cpn-dark hover:border-cpn-yellow/30 transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-heading text-cpn-white mb-1">{group.name}</h3>
                  <p className="text-cpn-gray text-sm">
                    {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <TrophyIcon className="w-6 h-6 text-cpn-yellow" />
              </div>
              
              <div className="text-sm text-cpn-gray mb-4">
                Created {group.createdAt.toLocaleDateString()}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => window.location.href = `/leaderboards/${group.id}`}
                  className="flex-1 btn-cpn py-2 px-4 text-sm"
                >
                  View Rankings
                </button>
                <button
                  onClick={() => copyInviteLink(group)}
                  className="p-2 border border-cpn-gray/30 rounded-lg hover:border-cpn-yellow transition-colors"
                  title="Copy invite link"
                >
                  <LinkIcon className="w-4 h-4 text-cpn-gray hover:text-cpn-yellow" />
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
                      className="input-cpn"
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
    </div>
  );
}