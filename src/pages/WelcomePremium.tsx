import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { goTo } from '../lib/navigation';
import { clearOnboarding } from '../lib/onboarding/session';

export function WelcomePremium() {
  const { profile } = useAuth();

  useEffect(() => {
    // Clear onboarding session data when landing here
    clearOnboarding();
  }, []);

  const subscriptionName = profile?.subscription_tier === 'player' ? 'Player Mode' : 'Boyfriend Mode';

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

