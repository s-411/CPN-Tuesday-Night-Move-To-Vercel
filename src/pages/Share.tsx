import { useEffect, useState } from 'react';
import { detectReferralContext, persistReferralContext } from '../lib/referral/utils';

export function Share() {
  const [isReferred, setIsReferred] = useState(false);

  useEffect(() => {
    // Detect and persist referral context
    const context = detectReferralContext();
    if (context) {
      persistReferralContext(context);
      setIsReferred(true);
    }
  }, []);

  const handleGetStarted = () => {
    // Navigate to signup page
    window.location.href = '/signup';
  };

  return (
    <div className="min-h-screen bg-cpn-dark flex flex-col">
      {/* Referral Banner - Only show if user came from referral link */}
      {isReferred && (
        <div className="w-full bg-cpn-yellow py-3 px-4 text-center">
          <p className="text-cpn-dark font-bold text-lg">
            🎉 You were invited to CPN — Get 1 week free!
          </p>
        </div>
      )}

      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl w-full text-center">
          <div className="mb-8">
            <img src="/CPN fav.png" alt="CPN" className="w-24 h-24 mx-auto mb-4" />
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Track Every Interaction
            </h1>
            <p className="text-xl md:text-2xl text-cpn-gray mb-8">
              Never forget a detail about the women in your life
            </p>
          </div>

          <button
            className="btn-cpn text-lg px-8 py-4"
            onClick={handleGetStarted}
          >
            {isReferred ? 'Get 1 Week Free' : 'Try for Free'}
          </button>

          {isReferred && (
            <p className="text-sm text-cpn-gray mt-4">
              Start with a 7-day free trial of Player Mode
            </p>
          )}

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="card-cpn">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-xl font-bold mb-2">Track Metrics</h3>
              <p className="text-cpn-gray">
                Monitor spending, time, and relationship metrics for every interaction
              </p>
            </div>

            <div className="card-cpn">
              <div className="text-4xl mb-3">📈</div>
              <h3 className="text-xl font-bold mb-2">Analytics</h3>
              <p className="text-cpn-gray">
                Get insights with detailed charts and cost per nut calculations
              </p>
            </div>

            <div className="card-cpn">
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="text-xl font-bold mb-2">Private & Secure</h3>
              <p className="text-cpn-gray">
                Your data is encrypted and completely private
              </p>
            </div>
          </div>

          {/* Social Proof */}
          <div className="mt-16 text-center">
            <p className="text-cpn-gray mb-4">Join hundreds of users tracking their relationships</p>
            <div className="flex justify-center items-center gap-2">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-cpn-yellow flex items-center justify-center text-cpn-dark font-bold">
                  M
                </div>
                <div className="w-8 h-8 rounded-full bg-cpn-yellow flex items-center justify-center text-cpn-dark font-bold">
                  J
                </div>
                <div className="w-8 h-8 rounded-full bg-cpn-yellow flex items-center justify-center text-cpn-dark font-bold">
                  S
                </div>
                <div className="w-8 h-8 rounded-full bg-cpn-yellow flex items-center justify-center text-cpn-dark font-bold">
                  +
                </div>
              </div>
              <p className="text-sm text-cpn-gray ml-2">and many more</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-6 text-center text-cpn-gray text-sm">
        <p>&copy; 2024 Cost Per Nut. Track smarter, not harder.</p>
      </div>
    </div>
  );
}
