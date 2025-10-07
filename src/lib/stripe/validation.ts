export interface StripeConfigValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateStripeConfig(): StripeConfigValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
  const weeklyPriceId = import.meta.env.VITE_STRIPE_PRICE_PLAYER_MODE_WEEKLY as string | undefined;
  const annualPriceId = import.meta.env.VITE_STRIPE_PRICE_PLAYER_MODE_ANNUAL as string | undefined;

  if (!publishableKey || publishableKey.length === 0) {
    errors.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
  } else if (publishableKey.includes('REPLACE')) {
    errors.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY contains placeholder text');
  } else if (!publishableKey.startsWith('pk_')) {
    warnings.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY does not start with pk_ - may be invalid');
  }

  if (!weeklyPriceId || weeklyPriceId.length === 0) {
    errors.push('NEXT_PUBLIC_STRIPE_PRICE_PLAYER_MODE_WEEKLY is not set');
  } else if (weeklyPriceId.includes('REPLACE')) {
    errors.push('NEXT_PUBLIC_STRIPE_PRICE_PLAYER_MODE_WEEKLY contains placeholder text');
  } else if (!weeklyPriceId.startsWith('price_')) {
    warnings.push('NEXT_PUBLIC_STRIPE_PRICE_PLAYER_MODE_WEEKLY does not start with price_ - may be invalid');
  }

  if (!annualPriceId || annualPriceId.length === 0) {
    errors.push('NEXT_PUBLIC_STRIPE_PRICE_PLAYER_MODE_ANNUAL is not set');
  } else if (annualPriceId.includes('REPLACE')) {
    errors.push('NEXT_PUBLIC_STRIPE_PRICE_PLAYER_MODE_ANNUAL contains placeholder text');
  } else if (!annualPriceId.startsWith('price_')) {
    warnings.push('NEXT_PUBLIC_STRIPE_PRICE_PLAYER_MODE_ANNUAL does not start with price_ - may be invalid');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function logStripeConfigStatus(): void {
  if (import.meta.env.DEV) {
    const validation = validateStripeConfig();

    if (!validation.isValid) {
      console.group('%c⚠️ Stripe Configuration Issues', 'color: #f59e0b; font-weight: bold; font-size: 14px;');
      console.log('%cStripe is not properly configured. Users will not be able to subscribe to paid plans.', 'color: #f59e0b;');
      console.log('%c\nErrors:', 'color: #ef4444; font-weight: bold;');
      validation.errors.forEach(error => {
        console.log(`  ❌ ${error}`);
      });

      if (validation.warnings.length > 0) {
        console.log('%c\nWarnings:', 'color: #f59e0b; font-weight: bold;');
        validation.warnings.forEach(warning => {
          console.log(`  ⚠️  ${warning}`);
        });
      }

      console.log('%c\nTo fix this:', 'color: #3b82f6; font-weight: bold;');
      console.log('1. Get your Stripe API keys from: https://dashboard.stripe.com/test/apikeys');
      console.log('2. Create subscription products at: https://dashboard.stripe.com/test/products');
      console.log('3. Update your .env file with the correct values');
      console.log('4. Restart the development server');
      console.log('%c\nSee .env.example for detailed instructions', 'color: #6b7280;');
      console.groupEnd();
    } else {
      console.log('%c✓ Stripe Configuration Valid', 'color: #10b981; font-weight: bold;');
      if (validation.warnings.length > 0) {
        console.group('%c⚠️ Stripe Configuration Warnings', 'color: #f59e0b; font-weight: bold;');
        validation.warnings.forEach(warning => {
          console.log(`  ⚠️  ${warning}`);
        });
        console.groupEnd();
      }
    }
  }
}
