/**
 * Activating Trial Page
 *
 * Shown to referred users immediately after signup.
 * Displays a loading state while preparing the Stripe checkout with 7-day trial.
 */

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase/client';
import { STRIPE_CONFIG } from '../lib/stripe/config';

export function ActivatingTrial() {
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Smooth progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90; // Stop at 90% until checkout starts
        }
        return prev + 10;
      });
    }, 200);

    return () => clearInterval(progressInterval);
  }, []);

  useEffect(() => {
    const startCheckout = async () => {
      try {
        // Small delay to ensure page is visible (better UX)
        await new Promise(resolve => setTimeout(resolve, 1000));

        const priceId = STRIPE_CONFIG.prices.playerModeWeekly;

        if (!priceId || priceId.length === 0 || priceId.startsWith('price_REPLACE')) {
          setError('Stripe is not configured. Please contact support.');
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          setError('Session expired. Please sign in again.');
          return;
        }

        console.log('[ActivatingTrial] Starting checkout with 7-day trial');

        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            priceId,
            planType: 'weekly',
            isReferralSignup: true  // This triggers the 7-day trial
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create checkout session');
        }

        if (data.url) {
          // Complete progress bar
          setProgress(100);

          // Small delay so user sees 100%
          await new Promise(resolve => setTimeout(resolve, 300));

          console.log('[ActivatingTrial] Redirecting to Stripe checkout');
          window.location.href = data.url;
        } else {
          throw new Error('No checkout URL received');
        }
      } catch (e: any) {
        console.error('[ActivatingTrial] Error:', e);
        setError(e?.message || 'Failed to activate trial. Please try again.');
      }
    };

    startCheckout();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-cpn-dark">
        <div className="card-cpn w-full max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl mb-2 text-red-400">Oops!</h2>
          <p className="text-cpn-gray mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/step-4'}
            className="btn-cpn"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-cpn-dark">
      <div className="card-cpn w-full max-w-md text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-cpn-yellow rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <span className="text-5xl">🎉</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-2">Account Created!</h1>
        <p className="text-cpn-yellow text-xl mb-6">
          Activating Your Free Trial...
        </p>

        {/* Loading Animation */}
        <div className="mb-6">
          <div className="w-16 h-16 border-4 border-cpn-yellow border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-cpn-dark-lighter rounded-full h-3 mb-4 overflow-hidden">
          <div
            className="bg-cpn-yellow h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Status Text */}
        <div className="text-cpn-gray text-sm space-y-2">
          <p className="flex items-center justify-center gap-2">
            {progress >= 20 && <span className="text-cpn-yellow">✓</span>}
            <span>Account created successfully</span>
          </p>
          <p className="flex items-center justify-center gap-2">
            {progress >= 40 && <span className="text-cpn-yellow">✓</span>}
            <span>Preparing your 7-day free trial</span>
          </p>
          <p className="flex items-center justify-center gap-2">
            {progress >= 60 && <span className="text-cpn-yellow">✓</span>}
            <span>Configuring Player Mode access</span>
          </p>
          <p className="flex items-center justify-center gap-2">
            {progress >= 90 && <span className="text-cpn-yellow">✓</span>}
            <span>Loading secure checkout...</span>
          </p>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-cpn-yellow/10 border border-cpn-yellow/30 rounded-lg">
          <p className="text-sm text-cpn-yellow font-medium">
            💳 You will not be charged for 7 days
          </p>
          <p className="text-xs text-cpn-gray mt-1">
            Cancel anytime during your free trial
          </p>
        </div>
      </div>
    </div>
  );
}
