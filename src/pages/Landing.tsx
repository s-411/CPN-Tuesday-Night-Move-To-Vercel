/**
 * Root Landing Page
 * Simple page with CPN logo and Sign In / Sign Up buttons
 */

export function Landing() {
  const handleSignIn = () => {
    window.location.href = '/signin';
  };

  const handleSignUp = () => {
    window.location.href = '/signup';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cpn-dark p-4">
      <div className="text-center">
        {/* CPN Logo */}
        <div className="mb-8">
          <img
            src="/CPN fav.png"
            alt="CPN"
            className="w-32 h-32 mx-auto mb-4"
          />
          <h1 className="text-4xl md:text-5xl font-bold text-cpn-yellow mb-2">
            CPN
          </h1>
          <p className="text-lg text-cpn-gray">
            Cost Per Nut Calculator
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 max-w-sm mx-auto">
          <button
            onClick={handleSignIn}
            className="w-full px-8 py-4 text-lg font-bold transition-all duration-200"
            style={{
              border: '2px solid var(--color-cpn-yellow)',
              borderRadius: '100px',
              backgroundColor: 'var(--color-cpn-dark)',
              color: 'var(--color-cpn-yellow)'
            }}
          >
            Sign In
          </button>

          <button
            onClick={handleSignUp}
            className="btn-cpn w-full text-lg px-8 py-4"
          >
            Sign Up
          </button>
        </div>

        {/* Footer Text */}
        <p className="text-sm text-cpn-gray mt-12">
          Track smarter, not harder
        </p>
      </div>
    </div>
  );
}
