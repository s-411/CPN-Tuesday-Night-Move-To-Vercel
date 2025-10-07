/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure environment variables are validated at build time
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Environment variables that should be inlined
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_STRIPE_PRICE_PLAYER_MODE_WEEKLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_PLAYER_MODE_WEEKLY,
    NEXT_PUBLIC_STRIPE_PRICE_PLAYER_MODE_ANNUAL: process.env.NEXT_PUBLIC_STRIPE_PRICE_PLAYER_MODE_ANNUAL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  
  // Webpack configuration for stripe in server components
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'stripe'];
    }
    return config;
  },
  
  // Image optimization
  images: {
    domains: [],
  },
  
  // Redirect trailing slashes
  trailingSlash: false,
  
  // React strict mode
  reactStrictMode: true,
  
  // SWC minify
  swcMinify: true,
};

module.exports = nextConfig;

