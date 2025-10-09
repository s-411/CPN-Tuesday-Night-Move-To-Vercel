import { useEffect, useState } from 'react';
import { goTo } from '../../lib/navigation';
import { getStep1, getStep2, setStep3, setState } from '../../lib/onboarding/session';
import { useAuth } from '../../contexts/AuthContext';
import { commitOnboardingToSupabase } from '../../lib/onboarding/commit';
import { OnboardingLayout } from '../../components/OnboardingLayout';

export function Step3() {
  const { signUp, signIn } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const s1 = getStep1();
    const s2 = getStep2();
    if (!s1) {
      goTo('/step-1');
      return;
    }
    if (!s2) {
      goTo('/step-2');
      return;
    }
  }, []);

  const handleSubmit = async () => {
    setError('');
    
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    try {
      // Save name to session storage
      setStep3({ name, v: 1 });
      
      // Create account
      const { error: signUpError } = await signUp(email, password, {
        data: { full_name: name }
      });
      
      if (signUpError) {
        // Try sign-in fallback if user exists
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          throw signInError;
        }
      }
      
      // Wait for auth to settle
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Commit onboarding data to database
      setState({ commitStatus: 'in-progress', v: 1 });
      const result = await commitOnboardingToSupabase();
      
      if (!result.ok) {
        console.error('Failed to commit onboarding data:', result.errorMessage);
        setState({ commitStatus: 'error', v: 1 });
        // Don't block user, they can retry in Step 4
      } else {
        setState({ commitStatus: 'success', v: 1 });
      }
      
      // Show success and redirect
      setSuccess(true);
      setTimeout(() => {
        goTo('/step-4');
      }, 800);
      
    } catch (e: any) {
      setError(e?.message || 'Authentication failed');
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout step={3}>
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl mb-2">Create Your Account</h1>
        <p className="text-cpn-gray mb-6">Almost there! Create your account to see your CPN result</p>

        {success && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
            <p className="text-green-400 text-sm flex items-center gap-2">
              <span>✓</span> Account created! Loading your results...
            </p>
          </div>
        )}

        <div className="card-cpn">
          {error && (
            <div className="p-3 mb-4 bg-red-500/10 border border-red-500/50 rounded">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-cpn-gray mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="input-cpn w-full"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading || success}
              />
            </div>
            <div>
              <label className="block text-sm text-cpn-gray mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                className="input-cpn w-full"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || success}
              />
            </div>
            <div>
              <label className="block text-sm text-cpn-gray mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                className="input-cpn w-full"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || success}
                minLength={6}
              />
              <p className="text-xs text-cpn-gray mt-1">Must be at least 6 characters</p>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button 
              className="btn-secondary flex-1" 
              onClick={() => goTo('/step-2')}
              disabled={loading || success}
            >
              Back
            </button>
            <button 
              className="btn-cpn flex-1" 
              onClick={handleSubmit} 
              disabled={loading || success}
            >
              {loading ? 'Creating Account...' : success ? 'Redirecting...' : 'Create Account'}
            </button>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}


