import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { goTo } from '../lib/navigation';

export function EmailConfirmed() {
  const [hasValidToken, setHasValidToken] = useState(true);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    if (!accessToken || type !== 'email_change') {
      setHasValidToken(false);
    }
  }, []);

  const handleGoToDashboard = () => {
    goTo('/');
  };

  if (!hasValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-cpn-dark">
        <div className="card-cpn w-full max-w-md text-center">
          <div className="mb-6">
            <h2 className="text-2xl mb-2">Invalid Confirmation Link</h2>
            <p className="text-cpn-gray mb-4">
              This email confirmation link is invalid or has expired.
            </p>
          </div>
          <button onClick={handleGoToDashboard} className="btn-cpn w-full">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-cpn-dark">
      <div className="card-cpn w-full max-w-md text-center">
        <div className="w-16 h-16 bg-cpn-yellow rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-cpn-dark" />
        </div>
        <h2 className="text-2xl mb-2">Email Updated!</h2>
        <p className="text-cpn-gray mb-4">
          Your email address has been successfully updated.
        </p>
        <button onClick={handleGoToDashboard} className="btn-cpn w-full">
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
