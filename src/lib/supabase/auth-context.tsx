'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface UserMetadata {
  firstName?: string;
  lastName?: string;
  role?: 'employee' | 'rig_admin' | 'super_admin';
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userMetadata: UserMetadata;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, metadata?: Partial<UserMetadata>) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userMetadata, setUserMetadata] = useState<UserMetadata>({});

  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setUserMetadata({
          firstName: session.user.user_metadata?.first_name,
          lastName: session.user.user_metadata?.last_name,
          role: session.user.user_metadata?.role || 'employee',
          avatarUrl: session.user.user_metadata?.avatar_url,
        });
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setUserMetadata({
            firstName: session.user.user_metadata?.first_name,
            lastName: session.user.user_metadata?.last_name,
            role: session.user.user_metadata?.role || 'employee',
            avatarUrl: session.user.user_metadata?.avatar_url,
          });
        } else {
          setUserMetadata({});
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase.auth]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  }, [supabase.auth]);

  const signUpWithEmail = useCallback(async (
    email: string, 
    password: string, 
    metadata?: Partial<UserMetadata>
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: metadata?.firstName,
          last_name: metadata?.lastName,
          role: metadata?.role || 'employee',
        },
      },
    });
    return { error: error as Error | null };
  }, [supabase.auth]);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error: error as Error | null };
  }, [supabase.auth]);

  const value = {
    user,
    session,
    loading,
    userMetadata,
    signOut,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
