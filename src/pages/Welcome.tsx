import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { goTo } from '../lib/navigation';
import { getStep1, clearOnboarding } from '../lib/onboarding/session';
import { Users, Plus, BarChart3 } from 'lucide-react';

export function Welcome() {
  const { profile } = useAuth();
  const [girlName, setGirlName] = useState<string>('');

  useEffect(() => {
    // Get the girl's name from onboarding before clearing
    try {
      const step1 = getStep1();
      if (step1?.name) {
        setGirlName(step1.name);
      }
    } catch (error) {
      console.error('Error reading onboarding data:', error);
    }

    // Clear onboarding session data after reading
    clearOnboarding();
  }, []);

  const handleNavigate = (path: string) => {
    goTo(path);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cpn-dark p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-cpn-yellow mb-4">🎉</h1>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Welcome to CPN!</h2>
          <p className="text-cpn-gray text-lg">
            {profile?.email ? `Hi ${profile.email.split('@')[0]},` : 'Hi there,'} you're all set up and ready to go.
          </p>
        </div>

        <div className="card-cpn mb-6">
          <h3 className="text-xl font-bold mb-4">You're off to a great start!</h3>
          <p className="text-cpn-gray mb-4">
            {girlName ? (
              <>
                You've already entered <span className="text-white font-semibold">{girlName}</span> and 
                your first data entry. Use the sidebar or buttons below to add more girls or track more encounters.
              </>
            ) : (
              <>
                You've already entered your first girl and data entry. Use the sidebar or buttons below to 
                add more girls or track more encounters.
              </>
            )}
          </p>
        </div>

        <div className="card-cpn bg-cpn-yellow/10 border-[var(--color-cpn-yellow)]/50 mb-6">
          <h3 className="text-lg font-bold mb-3 text-cpn-yellow">You're in Boyfriend Mode (Free)</h3>
          <p className="text-sm text-cpn-gray mb-3">
            Track 1 active profile with basic analytics. Ready for more?
          </p>
          <ul className="text-sm text-cpn-gray mb-4 space-y-1">
            <li>• Upgrade to Player Mode for unlimited profiles</li>
            <li>• Access full analytics and data insights</li>
            <li>• Share your stats and compare on leaderboards</li>
          </ul>
          <button 
            className="btn-cpn w-full text-sm"
            onClick={() => handleNavigate('/settings')}
          >
            View Upgrade Options
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            className="card-cpn hover:border-[var(--color-cpn-yellow)] transition-colors cursor-pointer text-center p-6"
            onClick={() => handleNavigate('/')}
          >
            <BarChart3 size={32} className="mx-auto mb-3 text-cpn-yellow" />
            <h4 className="font-bold mb-2">View Dashboard</h4>
            <p className="text-sm text-cpn-gray">See your metrics and insights</p>
          </button>

          <button
            className="card-cpn hover:border-[var(--color-cpn-yellow)] transition-colors cursor-pointer text-center p-6"
            onClick={() => handleNavigate('/data-entry')}
          >
            <Plus size={32} className="mx-auto mb-3 text-cpn-yellow" />
            <h4 className="font-bold mb-2">Add More Data</h4>
            <p className="text-sm text-cpn-gray">
              {girlName ? `Track another encounter with ${girlName}` : 'Track another encounter'}
            </p>
          </button>

          <button
            className="card-cpn hover:border-[var(--color-cpn-yellow)] transition-colors cursor-pointer text-center p-6"
            onClick={() => handleNavigate('/girls')}
          >
            <Users size={32} className="mx-auto mb-3 text-cpn-yellow" />
            <h4 className="font-bold mb-2">Manage Girls</h4>
            <p className="text-sm text-cpn-gray">View and edit your profiles</p>
          </button>
        </div>

        <div className="text-center">
          <button 
            className="btn-secondary"
            onClick={() => handleNavigate('/')}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

