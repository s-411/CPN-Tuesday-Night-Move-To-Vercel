import { useState, useEffect } from 'react';
import {
  Trophy,
  LinkIcon,
  ArrowLeft,
  Loader2,
  ClipboardCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getGroupById,
  getGroupRankings,
  LeaderboardGroup,
  Ranking,
} from '../lib/leaderboards';
import { formatCurrency } from '../lib/calculations';

interface LeaderboardDetailProps {
  groupId: string;
  onBack: () => void;
}

export function LeaderboardDetail({ groupId, onBack }: LeaderboardDetailProps) {
  const { user } = useAuth();
  const [group, setGroup] = useState<LeaderboardGroup | null>(null);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user && groupId) {
      loadGroupData();
    }
  }, [user, groupId]);

  const loadGroupData = async () => {
    if (!user || !groupId) return;

    setLoading(true);
    try {
      // Load group info
      const groupResult = await getGroupById(groupId);
      if (groupResult.error || !groupResult.data) {
        console.error('Failed to load group:', groupResult.error);
        onBack();
        return;
      }
      setGroup(groupResult.data);

      // Load rankings
      const rankingsData = await getGroupRankings(groupId);
      setRankings(rankingsData);
    } catch (error) {
      console.error('Error loading group data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = async () => {
    if (!group) return;

    const inviteLink = `${window.location.origin}/join/${group.invite_token}`;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Loader2 className="w-8 h-8 text-cpn-yellow animate-spin mx-auto mb-4" />
          <p className="text-cpn-gray">Loading group...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return null;
  }

  return (
    <div className="min-h-[60vh]">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={onBack}
            className="p-2 text-cpn-gray hover:text-cpn-white transition-colors"
            title="Back to groups"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-4xl font-heading text-cpn-white">{group.name}</h1>
            <p className="text-cpn-gray mt-1">
              {rankings.length} member{rankings.length !== 1 ? 's' : ''} competing
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column - Group Info */}
        <div className="lg:w-1/3">
          <div className="card-cpn bg-gradient-to-br from-cpn-dark2 to-cpn-dark sticky top-6">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="w-8 h-8 text-cpn-yellow" />
              <div>
                <h2 className="text-xl font-heading text-cpn-white">{group.name}</h2>
                <p className="text-cpn-gray text-sm">Private Group</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-cpn-gray text-sm mb-2">Group Statistics</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-cpn-dark2/50 rounded-lg p-3">
                    <p className="text-cpn-yellow text-lg font-bold">{rankings.length}</p>
                    <p className="text-cpn-gray text-xs">Members</p>
                  </div>
                  <div className="bg-cpn-dark2/50 rounded-lg p-3">
                    <p className="text-cpn-yellow text-lg font-bold">
                      {new Date(group.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-cpn-gray text-xs">Created</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-cpn-gray/20 pt-4">
                <p className="text-cpn-gray text-sm mb-3">Invite Friends</p>
                <button
                  onClick={copyInviteLink}
                  className="w-full btn-cpn flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <ClipboardCheck className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-4 h-4" />
                      Copy Invite Link
                    </>
                  )}
                </button>
                <p className="text-xs text-cpn-gray mt-2">
                  Share this link with friends to invite them to your group
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Rankings Table */}
        <div className="lg:w-2/3">
          <div className="card-cpn bg-gradient-to-br from-cpn-dark2 to-cpn-dark">
            <h2 className="text-xl font-heading text-cpn-white mb-6">Rankings</h2>

            {rankings.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-cpn-gray mx-auto mb-4" />
                <p className="text-cpn-gray">No members yet</p>
                <p className="text-cpn-gray text-sm">Invite friends to start competing</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-cpn">
                  <thead>
                    <tr>
                      <th className="w-16">Rank</th>
                      <th>Username</th>
                      <th className="text-right">Cost/Nut</th>
                      <th className="text-right">Total Spent</th>
                      <th className="text-right">Total Nuts</th>
                      <th className="text-right">Girls</th>
                      <th className="text-right">Efficiency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.map((ranking) => (
                      <tr key={ranking.member.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            {ranking.rank === 1 && (
                              <Trophy className="w-5 h-5 text-cpn-yellow" />
                            )}
                            <span
                              className={`font-bold ${
                                ranking.rank === 1
                                  ? 'text-cpn-yellow'
                                  : ranking.rank === 2
                                  ? 'text-cpn-gray'
                                  : ranking.rank === 3
                                  ? 'text-orange-400'
                                  : 'text-cpn-white'
                              }`}
                            >
                              #{ranking.rank}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="font-medium text-cpn-white">
                            {ranking.member.display_username}
                          </div>
                          <div className="text-xs text-cpn-gray">
                            Joined {new Date(ranking.member.joined_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="text-right">
                          <span
                            className={`font-bold ${
                              ranking.rank === 1 ? 'text-cpn-yellow' : 'text-cpn-white'
                            }`}
                          >
                            {formatCurrency(ranking.member.stats.cost_per_nut)}
                          </span>
                        </td>
                        <td className="text-right text-cpn-white">
                          {formatCurrency(ranking.member.stats.total_spent)}
                        </td>
                        <td className="text-right text-cpn-white">
                          {ranking.member.stats.total_nuts}
                        </td>
                        <td className="text-right text-cpn-white">
                          {ranking.member.stats.total_girls}
                        </td>
                        <td className="text-right">
                          <div
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              ranking.member.stats.efficiency_score >= 90
                                ? 'bg-green-500/20 text-green-400'
                                : ranking.member.stats.efficiency_score >= 80
                                ? 'bg-cpn-yellow/20 text-cpn-yellow'
                                : ranking.member.stats.efficiency_score >= 70
                                ? 'bg-orange-500/20 text-orange-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {Math.round(ranking.member.stats.efficiency_score)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Ranking Legend */}
          <div className="mt-6 card-cpn bg-gradient-to-br from-cpn-dark2 to-cpn-dark">
            <h3 className="text-lg font-heading text-cpn-white mb-4">How Rankings Work</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="text-cpn-yellow font-medium mb-2">Primary Ranking</h4>
                <p className="text-cpn-gray">
                  Members are ranked by <strong>Cost per Nut</strong> (lower is better).
                  The most efficient dater ranks #1.
                </p>
              </div>
              <div>
                <h4 className="text-cpn-yellow font-medium mb-2">Tiebreaker</h4>
                <p className="text-cpn-gray">
                  When Cost per Nut is tied, <strong>Efficiency Score</strong> determines
                  the ranking (higher is better).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
