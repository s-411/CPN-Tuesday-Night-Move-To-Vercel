export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  mode: 'subscription' | 'payment';
  interval?: 'week' | 'month' | 'year';
}

export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    priceId: 'price_1SBdEy4N2PMxx1mWPFLurfxX',
    name: 'Player Mode - Weekly',
    description: 'Weekly subscription to CPN Player Mode - Track up to 50 profiles, advanced analytics, and more',
    price: 1.99,
    currency: 'usd',
    mode: 'subscription',
    interval: 'week'
  },
  {
    priceId: 'price_1SBdEz4N2PMxx1mWQLpPCYCr',
    name: 'Player Mode - Annual',
    description: 'Yearly access to CPN - Everything in Player Mode plus API access and priority support',
    price: 27.00,
    currency: 'usd',
    mode: 'subscription',
    interval: 'year'
  }
];

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS.find(product => product.priceId === priceId);
};

export const formatPrice = (price: number, currency: string = 'usd'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(price);
};