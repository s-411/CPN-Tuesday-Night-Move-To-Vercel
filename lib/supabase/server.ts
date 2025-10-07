/**
 * Supabase Server Client for Next.js
 * 
 * This module provides server-side Supabase clients for use in:
 * - API Routes
 * - Server Components
 * - Server Actions
 * 
 * IMPORTANT: Never import this in client components!
 */

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from './types/database';
import { serverEnv, env } from '../env';

/**
 * Create a Supabase client for Server Components
 * This client respects the user's session from cookies
 */
export async function createServerClient() {
  const cookieStore = await cookies();
  
  return createClient<Database>(
    env.supabase.url,
    env.supabase.anonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Cookie setting can fail in Server Components
            // This is expected behavior
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Cookie removal can fail in Server Components
          }
        },
      },
    }
  );
}

/**
 * Create a Supabase Admin client with service role key
 * This client bypasses Row Level Security (RLS)
 * 
 * ⚠️ USE WITH CAUTION - This has full database access!
 * Only use for admin operations where RLS should be bypassed
 */
export function createServerAdminClient() {
  return createClient<Database>(
    serverEnv.supabase.url,
    serverEnv.supabase.serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Create a Supabase client for API Routes
 * This client respects the user's session from cookies
 */
export function createRouteHandlerClient() {
  // For Route Handlers, we need to use the cookies() function
  // but handle it synchronously for the Route Handler context
  return createClient<Database>(
    env.supabase.url,
    env.supabase.anonKey,
    {
      cookies: {
        get(name: string) {
          // In Route Handlers, cookies() is available synchronously
          const cookieStore = cookies();
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            const cookieStore = cookies();
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Ignore cookie setting errors
          }
        },
        remove(name: string, options: any) {
          try {
            const cookieStore = cookies();
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Ignore cookie removal errors
          }
        },
      },
    }
  );
}


