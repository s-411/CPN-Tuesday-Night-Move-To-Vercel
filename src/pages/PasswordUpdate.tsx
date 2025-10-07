import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lock, CheckCircle } from 'lucide-react';

interface PasswordUpdateProps {
  onSwitchToSignIn: () => void;
}

export function PasswordUpdate({ onSwitchToSignIn }: PasswordUpdateProps) {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasValidToken, setHasValidToken] = useState(true);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');

    if (!accessToken) {
      setHasValidToken(false);
      setError('Invalid or expired reset link. Please request a new password reset.');
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

    const { error: updateError } = await updatePassword(password);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        onSwitchToSignIn();
      }, 3000);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-cpn-dark">
        <div className="card-cpn w-full max-w-md text-center">
          <div className="w-16 h-16 bg-cpn-yellow rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-cpn-dark" />
          </div>
          <h2 className="text-2xl mb-2">Password Updated!</h2>
          <p className="text-cpn-gray mb-4">
            Your password has been successfully updated. Redirecting you to sign in...
          </p>
          <button onClick={onSwitchToSignIn} className="btn-cpn">
            Go to Sign In Now
          </button>
        </div>
      </div>
    );
  }

  if (!hasValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-cpn-dark">
        <div className="card-cpn w-full max-w-md text-center">
          <div className="mb-6">
            <h2 className="text-2xl mb-2">Invalid Reset Link</h2>
            <p className="text-cpn-gray mb-4">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
          </div>
          <button onClick={onSwitchToSignIn} className="btn-cpn w-full">
            Back to Sign In
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
          <h2 className="text-2xl mb-2">Update Password</h2>
          <p className="text-cpn-gray">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm text-cpn-gray mb-2">
              New Password
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
              Confirm New Password
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

          <button
            type="submit"
            className="btn-cpn w-full flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              'Updating password...'
            ) : (
              <>
                <Lock size={20} />
                Update Password
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-cpn-gray text-sm">
            <button
              onClick={onSwitchToSignIn}
              className="text-cpn-yellow hover:underline"
            >
              Back to sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
