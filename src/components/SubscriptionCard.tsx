import React, { useState } from 'react';
import { Crown, Check, Loader2 } from 'lucide-react';
import { StripeProduct, formatPrice } from '../stripe-config';

interface SubscriptionCardProps {
  product: StripeProduct;
  isPopular?: boolean;
  currentPlan?: string;
  onSubscribe: (priceId: string) => Promise<void>;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  product,
  isPopular = false,
  currentPlan,
  onSubscribe
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const isCurrentPlan = currentPlan === product.priceId;

  const handleSubscribe = async () => {
    if (isCurrentPlan || isLoading) return;
    
    setIsLoading(true);
    try {
      await onSubscribe(product.priceId);
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getIntervalText = () => {
    switch (product.interval) {
      case 'week': return 'per week';
      case 'month': return 'per month';
      case 'year': return 'per year';
      default: return '';
    }
  };

  return (
    <div className={`relative rounded-2xl border-2 p-8 ${
      isPopular 
        ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50' 
        : 'border-gray-200 bg-white'
    } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
            <Crown className="w-4 h-4" />
            Most Popular
          </div>
        </div>
      )}

      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h3>
        <div className="mb-4">
          <span className="text-4xl font-bold text-gray-900">
            {formatPrice(product.price)}
          </span>
          <span className="text-gray-600 ml-1">{getIntervalText()}</span>
        </div>
        <p className="text-gray-600 mb-6">{product.description}</p>

        <button
          onClick={handleSubscribe}
          disabled={isCurrentPlan || isLoading}
          className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            isCurrentPlan
              ? 'bg-green-100 text-green-800 cursor-not-allowed'
              : isPopular
              ? 'bg-yellow-400 hover:bg-yellow-500 text-black'
              : 'bg-gray-900 hover:bg-gray-800 text-white'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : isCurrentPlan ? (
            <>
              <Check className="w-4 h-4" />
              Current Plan
            </>
          ) : (
            'Subscribe Now'
          )}
        </button>
      </div>
    </div>
  );
};