import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn } from 'lucide-react';

interface SignInProps {
  onSwitchToSignUp: () => void;
  onSwitchToResetPassword?: () => void;
}

export function SignIn({ onSwitchToSignUp, onSwitchToResetPassword }: SignInProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-cpn-dark">
      <div className="card-cpn w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl text-cpn-yellow mb-2">CPN</h1>
          <p className="text-cpn-gray">Cost Per Nut Calculator</p>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl mb-2">Welcome Back</h2>
          <p className="text-cpn-gray">Sign in to your account</p>
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
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm text-cpn-gray">
                Password
              </label>
              {onSwitchToResetPassword && (
                <button
                  type="button"
                  onClick={onSwitchToResetPassword}
                  className="text-xs text-cpn-gray hover:text-cpn-yellow transition-colors"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <input
              id="password"
              type="password"
              className="input-cpn w-full"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn-cpn w-full flex items-center justify-center gap-2" disabled={loading}>
            {loading ? (
              'Signing in...'
            ) : (
              <>
                <LogIn size={20} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-cpn-gray text-sm">
            Don't have an account?{' '}
            <button onClick={onSwitchToSignUp} className="text-cpn-yellow hover:underline">
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
