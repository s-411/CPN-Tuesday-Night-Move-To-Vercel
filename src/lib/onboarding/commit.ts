import { supabase } from '../supabase/client';
import { getStep1, getStep2, getState, setState } from './session';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type CommitResult = {
  ok: boolean;
  girlId?: string;
  errorMessage?: string;
};

export async function commitOnboardingToSupabase(): Promise<CommitResult> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const authUser = authData.user;
    if (!authUser) {
      return { ok: false, errorMessage: 'No authenticated user' };
    }

    const step1 = getStep1();
    const step2 = getStep2();
    if (!step1 || !step2) {
      return { ok: false, errorMessage: 'Missing onboarding data' };
    }

    // Ensure public.users row exists (after auth) with small retries
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: profile, error: profileErr } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .maybeSingle();
      if (!profileErr && profile) break;
      await sleep(400 + attempt * 200);
    }

    // Check if we already created a girl (idempotency check)
    const state = getState();
    let girlId = state?.girlId;

    if (!girlId) {
      // Insert girl only if we haven't already
      const ageNum = parseInt(step1.age);
      const { data: girlInserted, error: girlError } = await supabase
        .from('girls')
        .insert({
          user_id: authUser.id,
          name: step1.name,
          age: ageNum,
          ethnicity: step1.ethnicity || null,
          hair_color: step1.hairColor || null,
          location_city: step1.locationCity || null,
          location_country: step1.locationCountry || null,
          rating: step1.rating,
          is_active: true,
        })
        .select('id')
        .single();

      if (girlError || !girlInserted) {
        const message = girlError?.message || 'Failed to create profile';
        setState({ commitStatus: 'error', v: 1 });
        return { ok: false, errorMessage: message };
      }

      girlId = (girlInserted as any).id as string;
      
      // Store girlId to prevent duplicate inserts on retry
      setState({ commitStatus: 'in-progress', girlId, v: 1 });
    }

    // Check if data entry already exists (idempotency check)
    const { data: existingEntries } = await supabase
      .from('data_entries')
      .select('id')
      .eq('girl_id', girlId)
      .limit(1);

    if (!existingEntries || existingEntries.length === 0) {
      // Insert first data entry only if it doesn't exist
      const totalMinutes = parseInt(step2.hours || '0') * 60 + parseInt(step2.minutes || '0');
      const amount = parseFloat(step2.amountSpent || '0');
      const nuts = parseInt(step2.numberOfNuts || '0');

      const { error: entryError } = await supabase.from('data_entries').insert({
        girl_id: girlId,
        date: step2.date,
        amount_spent: amount,
        duration_minutes: totalMinutes,
        number_of_nuts: nuts,
      });

      if (entryError) {
        setState({ commitStatus: 'error', girlId, v: 1 });
        return { ok: false, girlId, errorMessage: entryError.message };
      }
    }

    // Mark onboarding completed timestamp (best-effort)
    await supabase.from('users').update({ onboarding_completed_at: new Date().toISOString() }).eq('id', authUser.id);

    setState({ commitStatus: 'success', girlId, v: 1 });
    return { ok: true, girlId };
  } catch (e: any) {
    setState({ commitStatus: 'error', v: 1 });
    return { ok: false, errorMessage: e?.message || 'Commit failed' };
  }
}


