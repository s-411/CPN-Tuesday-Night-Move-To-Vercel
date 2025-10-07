/**
 * Environment Configuration for Next.js
 * 
 * This module provides type-safe access to environment variables.
 * - Client-side vars must be prefixed with NEXT_PUBLIC_
 * - Server-only vars have no prefix and are only accessible server-side
 */

// ============================================
// CLIENT-SIDE ENVIRONMENT VARIABLES
// ============================================
// These are exposed to the browser and embedded at build time

export const env = {
  // Supabase Configuration (Client-side)
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
  
  // Stripe Configuration (Client-side)
  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
    prices: {
      playerModeWeekly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PLAYER_MODE_WEEKLY!,
      playerModeAnnual: process.env.NEXT_PUBLIC_STRIPE_PRICE_PLAYER_MODE_ANNUAL!,
    },
  },
  
  // App Configuration (Client-side)
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
  },
  
  // Feature Flags (Client-side)
  features: {
    anonymousOnboarding: process.env.NEXT_PUBLIC_ENABLE_ANONYMOUS_ONBOARDING === 'true',
  },
  
  // Environment Detection
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
} as const;

// ============================================
// SERVER-SIDE ENVIRONMENT VARIABLES
// ============================================
// These are ONLY accessible server-side (API routes, server components)
// DO NOT import these in client components!

export const serverEnv = {
  // Supabase Server Configuration
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },
  
  // Stripe Server Configuration
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  },
} as const;

// ============================================
// VALIDATION
// ============================================
// Run validation on server startup

function validateEnv() {
  const requiredClientVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_STRIPE_PRICE_PLAYER_MODE_WEEKLY',
    'NEXT_PUBLIC_STRIPE_PRICE_PLAYER_MODE_ANNUAL',
  ];
  
  const requiredServerVars = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
  ];
  
  const missing: string[] = [];
  
  // Check client vars
  for (const varName of requiredClientVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  // Check server vars (only on server)
  if (typeof window === 'undefined') {
    for (const varName of requiredServerVars) {
      if (!process.env[varName]) {
        missing.push(varName);
      }
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
}

// Run validation
if (typeof window === 'undefined') {
  validateEnv();
}

// ============================================
// UTILITIES
// ============================================

export function getStripeConfig() {
  return {
    publishableKey: env.stripe.publishableKey,
    prices: {
      playerModeWeekly: env.stripe.prices.playerModeWeekly,
      playerModeAnnual: env.stripe.prices.playerModeAnnual,
    },
  };
}

export function getSupabaseConfig() {
  return {
    url: env.supabase.url,
    anonKey: env.supabase.anonKey,
  };
}


