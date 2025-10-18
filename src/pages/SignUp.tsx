import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus } from 'lucide-react';
import { getReferralContext, clearReferralContext } from '../lib/referral/utils';
import { trackConversion } from '../lib/referral/rewardful';
import { supabase } from '../lib/supabase/client';

interface SignUpProps {
  onSwitchToSignIn: () => void;
  onSuccess: () => void;
}

export function SignUp({ onSwitchToSignIn, onSuccess }: SignUpProps) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isReferred, setIsReferred] = useState(false);

  // Check if user came from a referral link
  useEffect(() => {
    const referralContext = getReferralContext();
    if (referralContext?.isReferred) {
      setIsReferred(true);
      console.log('[SignUp] User is referred, will apply 7-day trial');
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create Supabase auth account
      const { data, error: signUpError } = await signUp(email, password);

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError('Failed to create account');
        setLoading(false);
        return;
      }

      console.log('[SignUp] Account created successfully:', data.user.id);

      // Step 2: Create affiliate in Rewardful for this user
      // This makes every user an affiliate automatically
      try {
        console.log('[SignUp] Creating affiliate for user...');

        // Get auth token for API call
        const { data: { session } } = await supabase.auth.getSession();

        const affiliateResponse = await fetch('/api/referral/create-affiliate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            email: data.user.email,
            firstName: '',
            lastName: '',
          }),
        });

        // Check if response is ok before trying to parse JSON
        if (!affiliateResponse.ok) {
          console.warn('[SignUp] Affiliate API returned error:', affiliateResponse.status);
          throw new Error(`API returned ${affiliateResponse.status}`);
        }

        const affiliateData = await affiliateResponse.json();

        if (affiliateData.affiliateId) {
          console.log('[SignUp] Affiliate created:', affiliateData.affiliateId);

          // Step 3: Save affiliate info to database
          const { error: updateError } = await supabase
            .from('users')
            .update({
              rewardful_affiliate_id: affiliateData.affiliateId,
              rewardful_referral_link: affiliateData.referralLink,
            })
            .eq('id', data.user.id);

          if (updateError) {
            console.error('[SignUp] Failed to save affiliate info:', updateError);
          }
        } else {
          console.warn('[SignUp] Affiliate creation skipped or failed:', affiliateData.warning);
        }
      } catch (affiliateError) {
        console.error('[SignUp] Error during affiliate creation:', affiliateError);
        // Don't fail signup if affiliate creation fails
      }

      // Step 4: Check if this user was referred
      const referralContext = getReferralContext();

      if (referralContext?.isReferred && referralContext.referralId) {
        console.log('[SignUp] Processing referred signup:', referralContext.referralId);

        try {
          // Track conversion in Rewardful
          trackConversion(data.user.email!);

          // Save referred-by data to database
          const { error: updateError } = await supabase
            .from('users')
            .update({
              referred_by_affiliate_id: referralContext.referralId
            })
            .eq('id', data.user.id);

          if (updateError) {
            console.error('[SignUp] Failed to save referred_by_affiliate_id:', updateError);
          } else {
            console.log('[SignUp] Saved referred_by_affiliate_id successfully');
          }

          // Log event to referral_events table
          const { error: eventError } = await supabase.from('referral_events').insert({
            referee_user_id: data.user.id,
            event_type: 'signup',
            rewardful_referral_id: referralContext.referralId,
            event_data: { email: data.user.email },
          });

          if (eventError) {
            console.error('[SignUp] Failed to insert referral_events:', eventError);
          } else {
            console.log('[SignUp] Referral event logged successfully');
          }

          console.log('[SignUp] Referral tracking complete');

          // Clear referral context
          clearReferralContext();

          // Wait a moment to ensure all database operations complete
          // before redirecting (prevents race condition with auth state change)
          await new Promise(resolve => setTimeout(resolve, 500));

          // Redirect referred users to checkout with trial
          console.log('[SignUp] Redirecting to checkout with 7-day trial');
          window.location.href = '/step-4?ref=true';
          return; // Don't show success message, redirect immediately
        } catch (referralError) {
          console.error('[SignUp] Error processing referral:', referralError);
          // Continue with normal signup flow if referral tracking fails
        }
      }

      // Step 5: Show success for non-referred users
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      console.error('[SignUp] Signup error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-cpn-dark">
        <div className="card-cpn w-full max-w-md text-center">
          <div className="w-16 h-16 bg-cpn-yellow rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus size={32} className="text-cpn-dark" />
          </div>
          <h2 className="text-2xl mb-2">Account Created!</h2>
          <p className="text-cpn-gray mb-4">
            Check your email to verify your account. You can now sign in.
          </p>
          <button onClick={onSwitchToSignIn} className="btn-cpn">
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-cpn-dark">
      <div className="card-cpn w-full max-w-md">
        {isReferred && (
          <div className="mb-6 p-3 bg-cpn-yellow/10 border border-cpn-yellow/30 rounded-lg text-center">
            <p className="text-cpn-yellow text-sm font-bold">
              🎉 You're getting 1 week free!
            </p>
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-4xl text-cpn-yellow mb-2">CPN</h1>
          <p className="text-cpn-gray">Cost Per Nut Calculator</p>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl mb-2">Create Account</h2>
          <p className="text-cpn-gray">Start tracking your relationship metrics</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm text-cpn-gray mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input-cpn w-full"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-cpn-gray mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input-cpn w-full"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={8}
            />
            <p className="text-xs text-cpn-gray mt-1">Minimum 8 characters</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm text-cpn-gray mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="input-cpn w-full"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn-cpn w-full flex items-center justify-center gap-2" disabled={loading}>
            {loading ? (
              'Creating account...'
            ) : (
              <>
                <UserPlus size={20} />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-cpn-gray text-sm">
            Already have an account?{' '}
            <button onClick={onSwitchToSignIn} className="text-cpn-yellow hover:underline">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
