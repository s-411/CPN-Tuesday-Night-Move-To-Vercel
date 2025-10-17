import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { goTo } from '../lib/navigation';

export function EmailConfirmed() {
  const [hasValidToken, setHasValidToken] = useState(true);

  useEffect(() => {
    // Check both query params and hash params
    const queryParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const fullHash = window.location.hash;

    const accessToken = hashParams.get('access_token') || hashParams.get('token');
    const typeFromQuery = queryParams.get('type');
    const typeFromHash = hashParams.get('type');

    // Check sessionStorage flag set by AuthContext BEFORE hash was cleared
    const emailChangeFlag = sessionStorage.getItem('email_change_confirmed');

    console.log('[EmailConfirmed] Checking token - accessToken:', !!accessToken, 'typeFromQuery:', typeFromQuery, 'typeFromHash:', typeFromHash);
    console.log('[EmailConfirmed] Full hash string:', fullHash);
    console.log('[EmailConfirmed] SessionStorage flag:', emailChangeFlag);

    // If we're on this page and there's ANYTHING in the hash (especially type=email_change),
    // or if there's an access_token, or if the sessionStorage flag is set, assume it's valid.
    const hasTypeInHash = fullHash.includes('type=email_change');
    const hasAccessToken = !!accessToken || fullHash.includes('access_token=');

    if (!hasAccessToken && !hasTypeInHash && !typeFromQuery && !typeFromHash && !emailChangeFlag) {
      console.log('[EmailConfirmed] No valid token or type found anywhere');
      setHasValidToken(false);
    } else {
      console.log('[EmailConfirmed] Valid email change confirmation detected');
      setHasValidToken(true);
      // Clear the flag after using it
      if (emailChangeFlag) {
        sessionStorage.removeItem('email_change_confirmed');
      }
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
