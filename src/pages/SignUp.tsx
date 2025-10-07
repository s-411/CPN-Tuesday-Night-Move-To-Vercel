import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus } from 'lucide-react';

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

    const { error: signUpError } = await signUp(email, password);

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
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
