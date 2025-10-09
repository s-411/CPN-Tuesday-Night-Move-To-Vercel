import { ReactNode } from 'react';

interface OnboardingLayoutProps {
  children: ReactNode;
  step?: number;
  totalSteps?: number;
}

export function OnboardingLayout({ children, step, totalSteps = 4 }: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-cpn-dark">
      {/* Simple header with logo */}
      <div className="text-center pt-8 pb-4">
        <h1 className="text-2xl text-cpn-yellow font-bold">CPN</h1>
        {step && (
          <p className="text-cpn-gray text-sm mt-2">Step {step} of {totalSteps}</p>
        )}
      </div>
      
      {/* Content */}
      <div className="px-6 py-8">
        {children}
      </div>
    </div>
  );
}

