import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail } from 'lucide-react';

interface ResetPasswordProps {
  onSwitchToSignIn: () => void;
}

export function ResetPassword({ onSwitchToSignIn }: ResetPasswordProps) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: resetError } = await resetPassword(email);

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
    } else {
      setSuccess(true);
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
          <h2 className="text-2xl mb-2">Reset Password</h2>
          <p className="text-cpn-gray">Enter your email address and we'll send you a reset link</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
              <p className="text-green-400 text-sm">
                If your email address exists, we've sent you a password reset link. Please check your spam folder as well.
              </p>
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

          <button
            type="submit"
            className="btn-cpn w-full flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              'Sending reset link...'
            ) : (
              <>
                <Mail size={20} />
                Send Reset Link
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-cpn-gray text-sm">
            Remember your password?{' '}
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
