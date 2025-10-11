import { useState, useEffect } from 'react';
import { Trophy, Loader2, CheckCircle, XCircle, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  validateInviteToken,
  joinGroup,
  isUserMemberOfGroup,
  InviteValidation,
} from '../lib/leaderboards';

interface JoinLeaderboardProps {
  inviteToken: string;
  onJoinSuccess: (groupId: string) => void;
  onCancel: () => void;
}

export function JoinLeaderboard({
  inviteToken,
  onJoinSuccess,
  onCancel,
}: JoinLeaderboardProps) {
  const { user } = useAuth();
  const [validation, setValidation] = useState<InviteValidation | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [displayUsername, setDisplayUsername] = useState('');
  const [error, setError] = useState('');
  const [isAlreadyMember, setIsAlreadyMember] = useState(false);

  useEffect(() => {
    validateToken();
  }, [inviteToken, user]);

  const validateToken = async () => {
    setLoading(true);
    try {
      const result = await validateInviteToken(inviteToken);
      setValidation(result);

      // If user is logged in and token is valid, check if they're already a member
      if (user && result.valid && result.group) {
        const isMember = await isUserMemberOfGroup(result.group.id, user.id);
        setIsAlreadyMember(isMember);

        if (isMember) {
          // Redirect to group after a short delay
          setTimeout(() => {
            onJoinSuccess(result.group!.id);
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error validating token:', error);
      setValidation({
        valid: false,
        error: 'Failed to validate invite link',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user || !validation?.group) return;

    if (!displayUsername.trim()) {
      setError('Please enter a username');
      return;
    }

    if (displayUsername.length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }

    setJoining(true);
    setError('');

    try {
      const { error } = await joinGroup(inviteToken, user.id, displayUsername.trim());

      if (error) {
        setError(error);
        return;
      }

      // Success! Navigate to the group
      onJoinSuccess(validation.group.id);
    } catch (error: any) {
      setError(error.message || 'Failed to join group');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Loader2 className="w-8 h-8 text-cpn-yellow animate-spin mx-auto mb-4" />
          <p className="text-cpn-gray">Validating invite...</p>
        </div>
      </div>
    );
  }

  // Invalid token
  if (!validation?.valid) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="max-w-md mx-auto text-center animate-fade-in">
          <div className="card-cpn">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-heading text-cpn-white mb-2">
              Invitation Not Found
            </h2>
            <p className="text-cpn-gray mb-6">
              {validation?.error ||
                'This invitation link is invalid or has expired. Please ask your friend for a new invite link.'}
            </p>
            <button onClick={onCancel} className="btn-cpn">
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Already a member
  if (isAlreadyMember && validation.group) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="max-w-md mx-auto text-center animate-fade-in">
          <div className="card-cpn">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-heading text-cpn-white mb-2">
              Already a Member!
            </h2>
            <p className="text-cpn-gray mb-6">
              You're already a member of <strong>{validation.group.name}</strong>.
              Redirecting you to the group...
            </p>
            <Loader2 className="w-6 h-6 text-cpn-yellow animate-spin mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // User not logged in
  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="max-w-md mx-auto text-center animate-fade-in">
          <div className="card-cpn">
            <Trophy className="w-16 h-16 text-cpn-yellow mx-auto mb-4" />
            <h2 className="text-2xl font-heading text-cpn-white mb-2">
              You've Been Invited!
            </h2>
            <p className="text-cpn-gray mb-6">
              You've been invited to join <strong>{validation.group?.name}</strong> on Cost
              Per Nut. Please log in or sign up to accept your invitation.
            </p>
            <div className="flex gap-3">
              <button onClick={onCancel} className="flex-1 btn-secondary">
                Cancel
              </button>
              <button onClick={() => {/* Will be handled by App.tsx routing */}} className="flex-1 btn-cpn">
                Log In / Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User is logged in and can join
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md mx-auto animate-fade-in">
        <div className="card-cpn">
          <div className="text-center mb-6">
            <Trophy className="w-16 h-16 text-cpn-yellow mx-auto mb-4" />
            <h2 className="text-2xl font-heading text-cpn-white mb-2">
              You've Been Invited!
            </h2>
            <p className="text-cpn-gray">
              Join <strong>{validation.group?.name}</strong> on Cost Per Nut
            </p>
          </div>

          {/* Group Preview */}
          <div className="bg-cpn-dark2/50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-cpn-gray text-sm">Group Name</span>
              <span className="text-cpn-white font-medium">{validation.group?.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-cpn-gray text-sm">Current Members</span>
              <span className="text-cpn-white font-medium flex items-center gap-1">
                <Users className="w-4 h-4" />
                {validation.group?.member_count}
              </span>
            </div>
          </div>

          {/* Username Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-cpn-gray mb-2">
                Choose Your Display Username
              </label>
              <input
                type="text"
                placeholder="Enter a username..."
                value={displayUsername}
                onChange={(e) => setDisplayUsername(e.target.value)}
                className="input-cpn w-full"
                onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
                autoFocus
                disabled={joining}
              />
              <p className="text-xs text-cpn-gray mt-1">
                This username will be shown to other members. Your real identity stays
                private.
              </p>
              {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
            </div>

            {/* Privacy Notice */}
            <div className="bg-cpn-dark2/50 rounded-lg p-3">
              <p className="text-xs text-cpn-gray">
                <strong>Privacy:</strong> This is a private group. Only invited members can
                see the leaderboard. All usernames are anonymous.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 px-4 text-cpn-gray border border-cpn-gray/30 rounded-lg hover:text-cpn-white hover:border-cpn-gray transition-all duration-200"
                disabled={joining}
              >
                Decline
              </button>
              <button
                onClick={handleJoin}
                className="flex-1 btn-cpn flex items-center justify-center gap-2"
                disabled={joining}
              >
                {joining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  'Accept & Join Group'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
