import { ReactNode, useState } from 'react';
import { Lock } from 'lucide-react';
import UpgradeModal from './UpgradeModal';

interface SubscriptionGateProps {
  children: ReactNode;
  isLocked: boolean;
  featureName: string;
}

export default function SubscriptionGate({ children, isLocked, featureName }: SubscriptionGateProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="relative min-h-[60vh]">
        <div className="filter blur-sm pointer-events-none select-none opacity-40">
          {children}
        </div>

        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 px-4">
          <div className="text-center max-w-md w-full p-8 bg-zinc-900/95 rounded-[8px] border border-zinc-800 backdrop-blur-sm shadow-2xl">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--color-cpn-yellow)]/10 rounded-full mb-4">
              <Lock className="w-8 h-8 text-[var(--color-cpn-yellow)]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              {featureName} Locked
            </h2>
            <p className="text-zinc-400 mb-6">
              Activate Player Mode to unlock {featureName.toLowerCase()} and all premium features
            </p>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="bg-[var(--color-cpn-yellow)] hover:opacity-90 text-black font-bold py-3 px-8 rounded-[100px] transition-all"
            >
              Activate Player Mode
            </button>
          </div>
        </div>
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName={featureName}
      />
    </>
  );
}
