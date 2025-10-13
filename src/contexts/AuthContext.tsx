import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';
import { Database } from '../lib/types/database';

type UserProfile = Database['public']['Tables']['users']['Row'];

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  showPaywall: boolean;
  setShowPaywall: (show: boolean) => void;
  signUp: (email: string, password: string, options?: { data?: { full_name?: string } }) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  updateEmail: (newEmail: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);

      if (data) {
        // Disabled automatic paywall display
        // const tier = data.subscription_tier as string | null;
        // const isFreeTier = tier === 'boyfriend' || tier === 'free' || !tier;
        // if (!data.has_seen_paywall && isFreeTier) {
        //   setShowPaywall(true);
        // } else {
        //   setShowPaywall(false);
        // }
        setShowPaywall(false);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Log initial URL on mount to see what params Supabase sends
    console.log('[AuthContext] Initial mount - Full URL:', window.location.href);
    console.log('[AuthContext] Query params:', window.location.search);
    console.log('[AuthContext] Hash params:', window.location.hash);

    // CRITICAL: Check for email_change BEFORE Supabase processes and clears the hash
    const initialHash = window.location.hash;
    if (initialHash.includes('type=email_change')) {
      console.log('[AuthContext] Email change detected in initial hash, setting flag in sessionStorage');
      sessionStorage.setItem('email_change_confirmed', 'true');
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('[AuthContext] Session retrieved:', session ? 'exists' : 'null');
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthContext] onAuthStateChange event:', event, 'pathname:', window.location.pathname);
      console.log('[AuthContext] Session user email:', session?.user?.email);
      console.log('[AuthContext] Session user email_confirmed_at:', session?.user?.email_confirmed_at);
      console.log('[AuthContext] Session user new_email:', (session?.user as any)?.new_email);

      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setShowPaywall(false);
      }
      setLoading(false);

      // Check both query params and hash params for email_change type
      const queryParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const typeFromQuery = queryParams.get('type');
      const typeFromHash = hashParams.get('type');

      console.log('[AuthContext] type from query:', typeFromQuery, 'type from hash:', typeFromHash);

      // Detect email change confirmation - check if event is SIGNED_IN and we have type=email_change in URL
      // OR if the session email changed from what we had before
      if ((typeFromQuery === 'email_change' || typeFromHash === 'email_change') && window.location.pathname !== '/email-confirmed') {
        console.log('[AuthContext] Email change detected via URL params, redirecting to /email-confirmed');
        const fullParams = window.location.search + window.location.hash;
        window.history.pushState({}, '', '/email-confirmed' + fullParams);
        window.dispatchEvent(new PopStateEvent('popstate'));
      } else if (event === 'SIGNED_IN' && user && session?.user && user.email !== session.user.email) {
        console.log('[AuthContext] Email change detected via session email mismatch, redirecting to /email-confirmed');
        window.history.pushState({}, '', '/email-confirmed');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Profile updated:', payload.new);
          setProfile(payload.new as UserProfile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const signUp = async (email: string, password: string, options?: { data?: { full_name?: string } }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: options,
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/password-update`,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  const updateEmail = async (newEmail: string) => {
    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const { error } = await supabase.auth.updateUser(
      { email: newEmail },
      { emailRedirectTo: `${appUrl}/email-confirmed` }
    );
    return { error };
  };

  const value = {
    user,
    profile,
    session,
    loading,
    showPaywall,
    setShowPaywall,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    resetPassword,
    updatePassword,
    updateEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
