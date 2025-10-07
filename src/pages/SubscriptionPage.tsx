import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SubscriptionCard } from '../components/SubscriptionCard';
import { SubscriptionStatus } from '../components/SubscriptionStatus';
import { STRIPE_PRODUCTS } from '../stripe-config';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const SubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (priceId: string) => {
    try {
      const response = await fetch(`/api/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/subscription/success`,
          cancelUrl: `${window.location.origin}/subscription`,
        }),
      });

      const { url } = await response.json();
      if (url) {
        window.location.replace(url);
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
        </div>

        {userProfile && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Plan</h2>
            <SubscriptionStatus
              subscriptionTier={userProfile.subscription_tier}
              subscriptionStatus={userProfile.subscription_status}
              subscriptionPeriodEnd={userProfile.subscription_period_end}
              stripePriceId={userProfile.stripe_subscription_id}
            />
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Plans</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {STRIPE_PRODUCTS.map((product, index) => (
              <SubscriptionCard
                key={product.priceId}
                product={product}
                isPopular={index === 1} // Annual plan is popular
                currentPlan={userProfile?.stripe_subscription_id}
                onSubscribe={handleSubscribe}
              />
            ))}
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>All subscriptions can be cancelled at any time.</p>
          <p>Secure payments processed by Stripe.</p>
        </div>
      </div>
    </div>
  );
};