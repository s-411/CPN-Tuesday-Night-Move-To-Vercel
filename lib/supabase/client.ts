import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/database';
import { env } from '../env';

if (!env.supabase.url || !env.supabase.anonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(
  env.supabase.url,
  env.supabase.anonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);


