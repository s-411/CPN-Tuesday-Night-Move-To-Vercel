import { useEffect, useMemo, useState } from 'react';
import { goTo } from '../../lib/navigation';
import { getStep1, getStep2, getState, setState, clearOnboarding } from '../../lib/onboarding/session';
import { calculateCostPerNut, calculateTimePerNut, calculateCostPerHour, formatCurrency } from '../../lib/calculations';
import { STRIPE_CONFIG } from '../../lib/stripe/config';
import { supabase } from '../../lib/supabase/client';
import { commitOnboardingToSupabase } from '../../lib/onboarding/commit';
import { OnboardingLayout } from '../../components/OnboardingLayout';

export function Step4() {
  const s1 = getStep1();
  const s2 = getStep2();
  useEffect(() => {
    if (!s1) {
      goTo('/step-1');
      return;
    }
    if (!s2) {
      goTo('/step-2');
      return;
    }
  }, []);

  const totalMinutes = useMemo(() => (s2 ? parseInt(s2.hours || '0') * 60 + parseInt(s2.minutes || '0') : 0), [s2]);
  const amount = useMemo(() => (s2 ? parseFloat(s2.amountSpent || '0') : 0), [s2]);
  const nuts = useMemo(() => (s2 ? parseInt(s2.numberOfNuts || '0') : 0), [s2]);

  const costPerNut = calculateCostPerNut(amount, nuts);
  const timePerNut = calculateTimePerNut(totalMinutes, nuts);
  const costPerHour = calculateCostPerHour(amount, totalMinutes);

  const [status, setStatus] = useState(getState()?.commitStatus || 'success');
  const [message, setMessage] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  // Data already committed in Step 3, just display results
  useEffect(() => {
    const state = getState();
    if (state?.commitStatus) {
      setStatus(state.commitStatus);
    }
  }, []);

  const retryCommit = async () => {
    setRetrying(true);
    setStatus('in-progress');
    setState({ commitStatus: 'in-progress', v: 1 });
    
    const res = await commitOnboardingToSupabase();
    
    if (res.ok) {
      setStatus('success');
      setState({ commitStatus: 'success', v: 1 });
      setMessage(null);
    } else {
      setStatus('error');
      setState({ commitStatus: 'error', v: 1 });
      setMessage(res.errorMessage || 'Failed to save to your account.');
    }
    setRetrying(false);
  };

  const finish = () => {
    clearOnboarding();
    goTo('/');
  };

  const startCheckout = async (planType: 'weekly' | 'annual') => {
    try {
      const priceId = planType === 'weekly' ? STRIPE_CONFIG.prices.playerModeWeekly : STRIPE_CONFIG.prices.playerModeAnnual;
      if (!priceId || priceId.length === 0 || priceId.startsWith('price_REPLACE')) {
        setMessage('Stripe is not configured. Please contact support.');
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessage('Please sign in first.');
        return;
      }
      const response = await fetch(`/api/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ priceId, planType }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create checkout session');
      if (data.url) window.location.href = data.url;
    } catch (e: any) {
      setMessage(e?.message || 'Failed to start checkout');
    }
  };

  return (
    <OnboardingLayout step={4}>
      <div className="max-w-4xl mx-auto">
        {/* Results Card */}
        <div className="card-cpn mb-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">Your CPN Result</h1>
            {s1 && (
              <p className="text-cpn-gray">For <span className="text-white font-semibold">{s1.name}</span></p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center p-6 bg-cpn-dark rounded-lg">
              <p className="text-sm text-cpn-gray mb-2">Cost/Nut</p>
              <p className="text-4xl md:text-6xl font-extrabold text-cpn-yellow">{formatCurrency(costPerNut)}</p>
            </div>
            <div className="text-center p-6 bg-cpn-dark rounded-lg">
              <p className="text-sm text-cpn-gray mb-2">Time/Nut</p>
              <p className="text-3xl md:text-4xl font-bold">{timePerNut.toFixed(1)}m</p>
            </div>
            <div className="text-center p-6 bg-cpn-dark rounded-lg">
              <p className="text-sm text-cpn-gray mb-2">Cost/Hour</p>
              <p className="text-3xl md:text-4xl font-bold">{formatCurrency(costPerHour)}</p>
            </div>
          </div>

          {status === 'in-progress' && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/50 rounded">
              <p className="text-sm text-blue-400">💾 Saving to your account…</p>
            </div>
          )}
          {status === 'success' && (
            <div className="p-3 bg-green-500/10 border border-green-500/50 rounded">
              <p className="text-sm text-green-400">✓ Saved to your account!</p>
            </div>
          )}
          {status === 'error' && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded">
              <p className="text-sm text-red-400 mb-2">{message || 'Failed to save data'}</p>
              <button 
                className="btn-secondary text-sm py-1 px-3"
                onClick={retryCommit}
                disabled={retrying}
              >
                {retrying ? 'Retrying...' : 'Retry Save'}
              </button>
            </div>
          )}
        </div>

        {/* Subscription Options */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">Choose Your Mode</h2>
          <p className="text-cpn-gray text-center mb-6">Unlock more features with Player Mode</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Boyfriend Mode - Free */}
            <div className="card-cpn border-zinc-700">
              <div className="mb-4">
                <h3 className="text-xl font-bold mb-1">Boyfriend Mode</h3>
                <p className="text-2xl font-bold text-cpn-yellow">Free</p>
                <p className="text-sm text-cpn-gray">Forever</p>
              </div>
              <ul className="text-sm text-cpn-gray mb-6 space-y-2">
                {STRIPE_CONFIG.plans.boyfriend.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-cpn-gray">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button className="btn-secondary w-full py-3" onClick={finish}>
                Keep Free
              </button>
            </div>

            {/* Player Mode Weekly - Highlighted */}
            <div className="card-cpn border-[var(--color-cpn-yellow)] bg-[var(--color-cpn-yellow)]/5">
              <div className="mb-4">
                <div className="inline-block px-2 py-1 bg-cpn-yellow text-cpn-dark text-xs font-bold rounded mb-2">
                  RECOMMENDED
                </div>
                <h3 className="text-xl font-bold mb-1">{STRIPE_CONFIG.plans.playerWeekly.name}</h3>
                <p className="text-3xl font-bold text-cpn-yellow">{STRIPE_CONFIG.plans.playerWeekly.price}</p>
                <p className="text-sm text-cpn-gray">per week</p>
              </div>
              <ul className="text-sm text-cpn-gray mb-6 space-y-2">
                {STRIPE_CONFIG.plans.playerWeekly.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-cpn-yellow">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button className="btn-cpn w-full py-3 text-lg" onClick={() => startCheckout('weekly')}>
                Activate Weekly
              </button>
            </div>

            {/* Player Mode Annual - Best Value */}
            <div className="card-cpn border-zinc-700">
              <div className="mb-4">
                <div className="inline-block px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded mb-2">
                  {STRIPE_CONFIG.plans.playerAnnual.savings}
                </div>
                <h3 className="text-xl font-bold mb-1">{STRIPE_CONFIG.plans.playerAnnual.name}</h3>
                <p className="text-3xl font-bold text-cpn-yellow">{STRIPE_CONFIG.plans.playerAnnual.price}</p>
                <p className="text-sm text-cpn-gray">per year ({STRIPE_CONFIG.plans.playerAnnual.pricePerWeek})</p>
              </div>
              <ul className="text-sm text-cpn-gray mb-6 space-y-2">
                {STRIPE_CONFIG.plans.playerAnnual.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-cpn-yellow">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button className="btn-cpn w-full py-3" onClick={() => startCheckout('annual')}>
                Activate Annual
              </button>
            </div>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}


