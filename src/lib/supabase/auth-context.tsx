'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface UserMetadata {
  firstName?: string;
  lastName?: string;
  role?: 'employee' | 'rig_admin' | 'super_admin';
  avatarUrl?: string;
  employeeId?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userMetadata: UserMetadata;
  refreshRole: () => Promise<void>;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, metadata?: Partial<UserMetadata>) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
  resendSignUpOtp: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userMetadata, setUserMetadata] = useState<UserMetadata>({});

  const supabase = createClient();

  // Fetch role from employees table (source of truth)
  const fetchEmployeeRole = useCallback(async (userId: string) => {
    const { data: employee, error } = await supabase
      .from('employees')
      .select('id, role, name, photo_url')
      .eq('clerk_user_id', userId)
      .single();

    if (error || !employee) {
      // Employee record doesn't exist yet - default to employee
      return { role: 'employee' as const, employeeId: undefined, name: undefined, photoUrl: undefined };
    }

    return { 
      role: employee.role as 'employee' | 'rig_admin' | 'super_admin', 
      employeeId: employee.id,
      name: employee.name,
      photoUrl: employee.photo_url 
    };
  }, [supabase]);

  // Function to manually refresh role (useful after role changes)
  const refreshRole = useCallback(async () => {
    if (!user) return;
    const employeeData = await fetchEmployeeRole(user.id);
    setUserMetadata(prev => ({
      ...prev,
      role: employeeData.role,
      employeeId: employeeData.employeeId,
    }));
  }, [user, fetchEmployeeRole]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Fetch role from employees table
        const employeeData = await fetchEmployeeRole(session.user.id);
        setUserMetadata({
          firstName: session.user.user_metadata?.first_name,
          lastName: session.user.user_metadata?.last_name,
          role: employeeData.role,
          avatarUrl: employeeData.photoUrl || session.user.user_metadata?.avatar_url,
          employeeId: employeeData.employeeId,
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
          // Fetch role from employees table
          const employeeData = await fetchEmployeeRole(session.user.id);
          setUserMetadata({
            firstName: session.user.user_metadata?.first_name,
            lastName: session.user.user_metadata?.last_name,
            role: employeeData.role,
            avatarUrl: employeeData.photoUrl || session.user.user_metadata?.avatar_url,
            employeeId: employeeData.employeeId,
          });
        } else {
          setUserMetadata({});
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth, fetchEmployeeRole]);

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

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    return { error: error as Error | null };
  }, [supabase.auth]);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error: error as Error | null };
  }, [supabase.auth]);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });
    return { error: error as Error | null };
  }, [supabase.auth]);

  const resendSignUpOtp = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    return { error: error as Error | null };
  }, [supabase.auth]);

  const value = {
    user,
    session,
    loading,
    userMetadata,
    refreshRole,
    signOut,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    updatePassword,
    verifyOtp,
    resendSignUpOtp,
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
