import { env } from '../../../lib/env';

export const STRIPE_CONFIG = {
  publishableKey: env.stripe.publishableKey || '',

  prices: {
    playerModeWeekly: env.stripe.prices.playerModeWeekly || '',
    playerModeAnnual: env.stripe.prices.playerModeAnnual || '',
  },

  plans: {
    boyfriend: {
      name: 'Boyfriend Mode',
      price: 'Free',
      features: [
        'Track 1 active profile',
        'Basic data entry',
        'Limited analytics preview',
      ],
      tier: 'boyfriend' as const,
    },
    playerWeekly: {
      name: 'Player Mode',
      billing: 'Weekly',
      price: '$1.99',
      pricePerWeek: '$1.99/week',
      features: [
        'Unlimited profiles',
        'Full analytics access',
        'Data vault',
        'Leaderboards',
        'Share features',
        'All premium features',
      ],
      tier: 'player' as const,
      planType: 'weekly' as const,
    },
    playerAnnual: {
      name: 'Player Mode',
      billing: 'Annual',
      price: '$27',
      pricePerWeek: '$0.52/week',
      savings: 'Save 74%',
      features: [
        'Unlimited profiles',
        'Full analytics access',
        'Data vault',
        'Leaderboards',
        'Share features',
        'All premium features',
      ],
      tier: 'player' as const,
      planType: 'annual' as const,
    },
  },
};

export type SubscriptionTier = 'boyfriend' | 'player';
export type PlanType = 'weekly' | 'annual';
