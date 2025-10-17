import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { goTo } from '../lib/navigation';
import { clearOnboarding } from '../lib/onboarding/session';

export function WelcomePremium() {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    // Clear onboarding session data when landing here
    clearOnboarding();
  }, []);

  useEffect(() => {
    // Wait for profile to load to prevent flashing wrong subscription tier
    if (profile) {
      setIsLoading(false);
    }

    // Timeout after 10 seconds - redirect to sign-in if profile never loads
    const timeout = setTimeout(() => {
      if (!profile) {
        setHasTimedOut(true);
        setTimeout(() => {
          goTo('/');
        }, 2000);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [profile]);

  // Show loading state while waiting for profile to load
  if (isLoading && !hasTimedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cpn-dark p-6">
        <div className="max-w-2xl w-full">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-cpn-yellow/10 rounded-full mb-6 animate-pulse">
              <Loader2 className="w-8 h-8 text-cpn-yellow animate-spin" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Loading your account...</h2>
            <p className="text-cpn-gray">Please wait a moment</p>
          </div>
        </div>
      </div>
    );
  }

  // Show timeout message if profile didn't load
  if (hasTimedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cpn-dark p-6">
        <div className="max-w-2xl w-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Taking longer than expected...</h2>
            <p className="text-cpn-gray mb-4">Redirecting you to sign in</p>
          </div>
        </div>
      </div>
    );
  }

  const subscriptionName = profile?.subscription_tier === 'player' ? 'Player Mode' : 'Premium';

  return (
    <div className="min-h-screen flex items-center justify-center bg-cpn-dark p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-cpn-yellow mb-4">🎉</h1>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Welcome to {subscriptionName}!</h2>
          <p className="text-cpn-gray text-lg">Your account is all set up and ready to go.</p>
        </div>

        <div className="card-cpn mb-6">
          <h3 className="text-xl font-bold mb-4">What's Next?</h3>
          <div className="space-y-3 text-cpn-gray">
            <div className="flex items-start gap-3">
              <span className="text-cpn-yellow font-bold">1.</span>
              <p>Your first girl profile and data entry have been saved to your account</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-cpn-yellow font-bold">2.</span>
              <p>Add more profiles and data to track your CPN over time</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-cpn-yellow font-bold">3.</span>
              <p>Explore analytics, leaderboards, and share your stats with friends</p>
            </div>
          </div>
        </div>

        {profile?.subscription_tier === 'player' && (
          <div className="card-cpn bg-cpn-yellow/10 border-cpn-yellow/50 mb-6">
            <p className="text-sm text-cpn-yellow">
              ✨ You now have access to unlimited profiles, full analytics, data vault, leaderboards, and sharing features!
            </p>
          </div>
        )}

        <button 
          className="btn-cpn w-full text-lg py-4"
          onClick={() => goTo('/')}
        >
          Get Started
        </button>
      </div>
    </div>
  );
}

