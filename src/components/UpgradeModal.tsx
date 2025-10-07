import { useState } from 'react';
import { X, Lock } from 'lucide-react';
import { STRIPE_CONFIG } from '../lib/stripe/config';
import { supabase } from '../lib/supabase/client';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export default function UpgradeModal({ isOpen, onClose, featureName = 'this feature' }: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleActivatePlayerMode = async (planType: 'weekly' | 'annual') => {
    try {
      setIsLoading(true);
      setError(null);

      const priceId = planType === 'weekly'
        ? STRIPE_CONFIG.prices.playerModeWeekly
        : STRIPE_CONFIG.prices.playerModeAnnual;

      if (!priceId || priceId.length === 0 || priceId.startsWith('price_REPLACE')) {
        throw new Error('Stripe is not configured. Please contact support or check your environment configuration.');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `/api/checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ priceId, planType }),
        }
      );

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to create checkout session');

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setIsLoading(false);
    }
  };

  const weeklyPlan = STRIPE_CONFIG.plans.playerWeekly;
  const annualPlan = STRIPE_CONFIG.plans.playerAnnual;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl mx-4 bg-zinc-900 rounded-[8px] border border-zinc-800 shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--color-cpn-yellow)]/10 rounded-full mb-4">
              <Lock className="w-8 h-8 text-[var(--color-cpn-yellow)]" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-3">Activate Player Mode</h2>
            <p className="text-zinc-400 text-lg">
              Unlock {featureName} and all premium features
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-center">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-zinc-800/50 rounded-[8px] p-8 border-2 border-[var(--color-cpn-yellow)] hover:border-[var(--color-cpn-yellow)] hover:opacity-90 transition-all relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[var(--color-cpn-yellow)] text-black text-xs font-bold px-4 py-1 rounded-full">
                POPULAR
              </div>

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{weeklyPlan.name}</h3>
                <div className="text-sm text-zinc-400 mb-1">{weeklyPlan.billing}</div>
                <div className="text-4xl font-bold text-[var(--color-cpn-yellow)] mb-1">{weeklyPlan.price}</div>
                <div className="text-sm text-zinc-400">{weeklyPlan.pricePerWeek}</div>
              </div>

              <ul className="space-y-3 mb-8">
                {weeklyPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-zinc-300 text-sm">
                    <span className="text-[var(--color-cpn-yellow)] mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleActivatePlayerMode('weekly')}
                disabled={isLoading}
                className="w-full bg-[var(--color-cpn-yellow)] hover:opacity-90 text-black font-bold py-3 px-6 rounded-[100px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Loading...' : 'Activate Weekly'}
              </button>
            </div>

            <div className="bg-zinc-800/50 rounded-[8px] p-8 border-2 border-zinc-700 hover:border-zinc-600 transition-all relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-black text-xs font-bold px-4 py-1 rounded-full">
                {annualPlan.savings}
              </div>

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{annualPlan.name}</h3>
                <div className="text-sm text-zinc-400 mb-1">{annualPlan.billing}</div>
                <div className="text-4xl font-bold text-[var(--color-cpn-yellow)] mb-1">{annualPlan.price}</div>
                <div className="text-sm text-zinc-400">{annualPlan.pricePerWeek}</div>
              </div>

              <ul className="space-y-3 mb-8">
                {annualPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-zinc-300 text-sm">
                    <span className="text-[var(--color-cpn-yellow)] mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleActivatePlayerMode('annual')}
                disabled={isLoading}
                className="w-full bg-[var(--color-cpn-yellow)] hover:opacity-90 text-black font-bold py-3 px-6 rounded-[100px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Loading...' : 'Activate Annual'}
              </button>
            </div>
          </div>

          <div className="text-center">
            <p className="text-zinc-500 text-sm mb-2">
              Secure payment powered by Stripe
            </p>
            <p className="text-zinc-500 text-xs">
              Cancel anytime from Settings • No long-term commitment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
