import { useEffect, useState } from 'react';
import { goTo } from '../../lib/navigation';
import { getStep1, getStep2, setState } from '../../lib/onboarding/session';
import { useAuth } from '../../contexts/AuthContext';

export function Step3() {
  const { signUp, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
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
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const { error: signUpError } = await signUp(email, password);
      if (signUpError) {
        // Try sign-in fallback if user exists
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          throw signInError;
        }
      }
      setState({ commitStatus: 'in-progress', v: 1 });
      goTo('/step-4');
    } catch (e: any) {
      setError(e?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-3xl mb-2">Get your CPN result</h1>
        <p className="text-cpn-gray mb-6">Enter your email address to be logged in and get your CPN result</p>

        <div className="card-cpn">
          {error && (
            <div className="p-3 mb-4 bg-red-500/10 border border-red-500/50 rounded">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-cpn-gray mb-2">Email</label>
              <input
                type="email"
                className="input-cpn w-full"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm text-cpn-gray mb-2">Password</label>
              <input
                type="password"
                className="input-cpn w-full"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex pt-6">
            <button className="btn-cpn flex-1" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Signing in…' : 'Discover your CPN'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


