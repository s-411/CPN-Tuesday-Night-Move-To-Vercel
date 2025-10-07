import { useEffect, useState } from 'react';
import { Check, Loader2, X, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { clearPageParam } from '../lib/urlUtils';

export default function SubscriptionSuccess() {
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const verifySubscription = async () => {
    try {
      setIsVerifying(true);
      setError(null);

      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');

      if (!sessionId) {
        throw new Error('No session ID found');
      }

      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/verify-subscription?session_id=${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to verify subscription');
      }

      const result = await response.json();

      if (!result.success || result.status !== 'active') {
        throw new Error(result.message || 'Subscription verification failed');
      }

      setIsVerifying(false);

      setTimeout(() => {
        clearPageParam();
        window.location.reload();
      }, 3000);
    } catch (err) {
      console.error('Verification error:', err);
      setError(err instanceof Error ? err.message : 'Failed to verify subscription');
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    verifySubscription();
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {isVerifying ? (
          <div className="bg-zinc-900 rounded-[8px] border border-zinc-800 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--color-cpn-yellow)]/10 rounded-full mb-6 animate-pulse">
              <Loader2 className="w-8 h-8 text-[var(--color-cpn-yellow)] animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">
              Activating Player Mode...
            </h1>
            <p className="text-zinc-400">
              Please wait while we activate your subscription
            </p>
          </div>
        ) : error ? (
          <div className="bg-zinc-900 rounded-[8px] border border-red-500/20 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full mb-6">
              <X className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">
              Verification Issue
            </h1>
            <p className="text-zinc-400 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={verifySubscription}
                className="w-full bg-[var(--color-cpn-yellow)] hover:opacity-90 text-black font-bold py-3 px-8 rounded-[100px] transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Verification
              </button>
              <button
                onClick={() => {
                  clearPageParam();
                  window.location.reload();
                }}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 px-8 rounded-[100px] transition-all"
              >
                Go to Dashboard
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-6">
              Your payment was successful. If this issue persists, contact support.
            </p>
          </div>
        ) : (
          <div className="bg-zinc-900 rounded-[8px] border border-green-500/20 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-6">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">
              Player Mode Activated!
            </h1>
            <p className="text-zinc-400 mb-2">
              Your subscription is now active
            </p>
            <p className="text-zinc-500 text-sm mb-8">
              You now have access to all premium features
            </p>

            <div className="bg-zinc-800/50 rounded-[8px] p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-3">What's Unlocked:</h2>
              <ul className="space-y-2 text-left">
                <li className="flex items-start text-zinc-300 text-sm">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>Unlimited profiles</span>
                </li>
                <li className="flex items-start text-zinc-300 text-sm">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>Full analytics and insights</span>
                </li>
                <li className="flex items-start text-zinc-300 text-sm">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>Data vault access</span>
                </li>
                <li className="flex items-start text-zinc-300 text-sm">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>Leaderboards & rankings</span>
                </li>
                <li className="flex items-start text-zinc-300 text-sm">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>Share features</span>
                </li>
              </ul>
            </div>

            <p className="text-zinc-500 text-sm">
              Redirecting to your dashboard...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
