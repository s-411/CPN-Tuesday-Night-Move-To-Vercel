import React from 'react';
import { Crown } from 'lucide-react';
import { getProductByPriceId, formatPrice } from '../stripe-config';

interface SubscriptionStatusProps {
  subscriptionTier: string;
  subscriptionStatus?: string;
  subscriptionPeriodEnd?: string;
  stripePriceId?: string;
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
  subscriptionTier,
  subscriptionStatus,
  subscriptionPeriodEnd,
  stripePriceId
}) => {
  const getStatusColor = () => {
    switch (subscriptionStatus) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'past_due': return 'text-yellow-600 bg-yellow-100';
      case 'canceled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTierDisplay = () => {
    if (stripePriceId) {
      const product = getProductByPriceId(stripePriceId);
      if (product) {
        return product.name;
      }
    }
    
    switch (subscriptionTier) {
      case 'boyfriend': return 'Boyfriend Mode';
      case 'player': return 'Player Mode';
      case 'premium': return 'Premium';
      case 'lifetime': return 'Lifetime';
      default: return 'Free';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <Crown className="w-5 h-5 text-yellow-500" />
        <div>
          <h3 className="font-semibold text-gray-900">{getTierDisplay()}</h3>
          {subscriptionStatus && (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
              {subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};