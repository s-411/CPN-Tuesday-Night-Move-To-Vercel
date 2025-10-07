import { useEffect, useMemo, useState } from 'react';
import { goTo } from '../../lib/navigation';
import { getStep1, getStep2, getState, setState, clearOnboarding } from '../../lib/onboarding/session';
import { calculateCostPerNut, calculateTimePerNut, calculateCostPerHour, formatCurrency } from '../../lib/calculations';
import { STRIPE_CONFIG } from '../../lib/stripe/config';
import { supabase } from '../../lib/supabase/client';
import { commitOnboardingToSupabase } from '../../lib/onboarding/commit';

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

  const [status, setStatus] = useState(getState()?.commitStatus || 'idle');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'idle') {
      setStatus('in-progress');
      setState({ commitStatus: 'in-progress', v: 1 });
      commitOnboardingToSupabase().then((res) => {
        if (res.ok) {
          setStatus('success');
          setState({ commitStatus: 'success', v: 1 });
        } else {
          setStatus('error');
          setState({ commitStatus: 'error', v: 1 });
          setMessage(res.errorMessage || 'Failed to save to your account. You can finish and add data later.');
        }
      });
    }
  }, []);

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
    <div className="min-h-screen flex flex-col items-center p-6">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl mb-2">Your CPN</h1>
        <p className="text-cpn-gray mb-6">Step 4 of 4</p>

        <div className="card-cpn">
          {s1 && (
            <div className="mb-4">
              <p className="text-sm text-cpn-gray">For</p>
              <p className="text-xl font-bold">{s1.name}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4">
              <p className="text-xs text-cpn-gray mb-1">Cost/Nut</p>
              <p className="text-3xl md:text-5xl font-extrabold text-cpn-yellow">{formatCurrency(costPerNut)}</p>
            </div>
            <div className="p-4">
              <p className="text-xs text-cpn-gray mb-1">Time/Nut</p>
              <p className="text-2xl md:text-3xl font-bold">{timePerNut.toFixed(1)}m</p>
            </div>
            <div className="p-4">
              <p className="text-xs text-cpn-gray mb-1">Cost/Hour</p>
              <p className="text-2xl md:text-3xl font-bold">{formatCurrency(costPerHour)}</p>
            </div>
          </div>

          <div className="mt-6">
            {status === 'in-progress' && (
              <p className="text-sm text-cpn-gray">Saving to your account…</p>
            )}
            {status === 'success' && (
              <p className="text-sm text-green-400">Saved to your account.</p>
            )}
            {status === 'error' && (
              <p className="text-sm text-red-400">{message}</p>
            )}
          </div>

          <div className="flex justify-end mt-6">
            <button className="btn-cpn" onClick={finish}>Finish</button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-zinc-700 bg-zinc-800/40">
            <h3 className="text-lg font-bold mb-1">Boyfriend Mode</h3>
            <p className="text-sm text-cpn-gray mb-3">Free</p>
            <ul className="text-sm text-cpn-gray mb-4 list-disc pl-5">
              {STRIPE_CONFIG.plans.boyfriend.features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            <button className="btn-secondary w-full" onClick={finish}>Keep Free</button>
          </div>

          <div className="p-4 rounded-lg border border-[var(--color-cpn-yellow)] bg-zinc-800/60">
            <h3 className="text-lg font-bold mb-1">{STRIPE_CONFIG.plans.playerWeekly.name}</h3>
            <p className="text-sm text-cpn-gray mb-3">{STRIPE_CONFIG.plans.playerWeekly.billing}</p>
            <p className="text-2xl font-bold text-[var(--color-cpn-yellow)] mb-1">{STRIPE_CONFIG.plans.playerWeekly.price}</p>
            <p className="text-xs text-cpn-gray mb-3">{STRIPE_CONFIG.plans.playerWeekly.pricePerWeek}</p>
            <ul className="text-sm text-cpn-gray mb-4 list-disc pl-5">
              {STRIPE_CONFIG.plans.playerWeekly.features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            <button className="btn-cpn w-full" onClick={() => startCheckout('weekly')}>Activate Weekly</button>
          </div>

          <div className="p-4 rounded-lg border border-zinc-700 bg-zinc-800/40">
            <h3 className="text-lg font-bold mb-1">{STRIPE_CONFIG.plans.playerAnnual.name}</h3>
            <p className="text-sm text-cpn-gray mb-3">{STRIPE_CONFIG.plans.playerAnnual.billing}</p>
            <p className="text-2xl font-bold text-[var(--color-cpn-yellow)] mb-1">{STRIPE_CONFIG.plans.playerAnnual.price}</p>
            <p className="text-xs text-cpn-gray mb-3">{STRIPE_CONFIG.plans.playerAnnual.pricePerWeek} • {STRIPE_CONFIG.plans.playerAnnual.savings}</p>
            <ul className="text-sm text-cpn-gray mb-4 list-disc pl-5">
              {STRIPE_CONFIG.plans.playerAnnual.features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            <button className="btn-cpn w-full" onClick={() => startCheckout('annual')}>Activate Annual</button>
          </div>
        </div>
      </div>
    </div>
  );
}


