import React from 'react';
import { Bell, Search, User, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SubscriptionStatus } from './SubscriptionStatus';
import { SubscriptionStatus } from './SubscriptionStatus';

interface HeaderProps {
  onAddProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onAddProfile }) => {
  const { user, signOut, userProfile } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">CPN Dashboard</h1>
          {userProfile && (
            <div className="hidden md:block">
              <SubscriptionStatus
                subscriptionTier={userProfile.subscription_tier}
                subscriptionStatus={userProfile.subscription_status}
                subscriptionPeriodEnd={userProfile.subscription_period_end}
                stripePriceId={userProfile.stripe_subscription_id}
              />
            </div>
          )}
          {userProfile && (
            <div className="hidden md:block">
              <SubscriptionStatus
                subscriptionTier={userProfile.subscription_tier}
                subscriptionStatus={userProfile.subscription_status}
                subscriptionPeriodEnd={userProfile.subscription_period_end}
                stripePriceId={userProfile.stripe_subscription_id}
              />
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-400 hover:text-gray-600">
            <Search className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600">
            <Bell className="h-5 w-5" />
          </button>
          <button
            onClick={onAddProfile}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Add Profile
          </button>
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-700">{user?.email}</span>
            <button
              onClick={signOut}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};