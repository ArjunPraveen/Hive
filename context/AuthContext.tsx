import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile, Family } from '@/lib/database.types';

interface AuthContextType {
  session: Session | null;
  user: Profile | null;
  family: Family | null;
  familyMembers: Profile[];
  initialLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string; needsFamily?: boolean }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  createFamily: (name: string, roleLabel?: string) => Promise<{ error?: string; inviteCode?: string }>;
  joinFamily: (inviteCode: string, roleLabel?: string) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [familyMembers, setFamilyMembers] = useState<Profile[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    // Validate session against server on app start
    supabase.auth.getUser().then(({ data: { user: authUser }, error }) => {
      if (error || !authUser) {
        supabase.auth.signOut();
        setSession(null);
        setInitialLoading(false);
        return;
      }
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session?.user) {
          loadUserData(session.user.id).finally(() => setInitialLoading(false));
        } else {
          setInitialLoading(false);
        }
      });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Only handle sign-out events here — sign-in navigation is handled by screens
      if (!session) {
        setSession(null);
        setUser(null);
        setFamily(null);
        setFamilyMembers([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserData(userId: string, retries = 3) {
    let profile = null;
    for (let i = 0; i < retries; i++) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (data) {
        profile = data;
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    if (profile) {
      setUser(profile);
      if (profile.family_id) {
        const [{ data: fam }, { data: members }] = await Promise.all([
          supabase.from('families').select('*').eq('id', profile.family_id).single(),
          supabase.from('profiles').select('*').eq('family_id', profile.family_id),
        ]);
        if (fam) setFamily(fam);
        if (members) setFamilyMembers(members);
      }
    }
  }

  const refreshProfile = async () => {
    if (session?.user) await loadUserData(session.user.id);
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (!data.user) return { error: 'Sign in failed' };

    setSession(data.session);

    // Load profile to determine where to navigate
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profile) {
      setUser(profile);
      if (profile.family_id) {
        const [{ data: fam }, { data: members }] = await Promise.all([
          supabase.from('families').select('*').eq('id', profile.family_id).single(),
          supabase.from('profiles').select('*').eq('family_id', profile.family_id),
        ]);
        if (fam) setFamily(fam);
        if (members) setFamilyMembers(members);
        return { needsFamily: false };
      }
    }
    return { needsFamily: true };
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    });
    if (error) return { error: error.message };
    if (data?.user && !data.session) {
      return { needsConfirmation: true };
    }
    if (data?.session && data?.user) {
      setSession(data.session);
      await loadUserData(data.user.id);
    }
    return {};
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Clear local state even if server request fails
    }
    setUser(null);
    setFamily(null);
    setFamilyMembers([]);
    setSession(null);
  };

  const createFamily = async (name: string, roleLabel?: string) => {
    if (!session?.user) return { error: 'Not authenticated' };

    const { data: fam, error: famError } = await supabase
      .from('families')
      .insert({ name })
      .select()
      .single();

    if (famError || !fam) return { error: famError?.message || 'Failed to create family' };

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ family_id: fam.id, role_label: roleLabel || null })
      .eq('id', session.user.id);

    if (profileError) return { error: profileError.message };

    // Update local state
    setFamily(fam);
    setUser((prev) => prev ? { ...prev, family_id: fam.id, role_label: roleLabel || prev.role_label } : prev);

    // Fetch fresh members list
    const { data: members } = await supabase
      .from('profiles')
      .select('*')
      .eq('family_id', fam.id);
    if (members) setFamilyMembers(members);

    return { inviteCode: fam.invite_code };
  };

  const joinFamily = async (inviteCode: string, roleLabel?: string) => {
    if (!session?.user) return { error: 'Not authenticated' };

    const { data: fam, error: findError } = await supabase
      .from('families')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase().trim())
      .single();

    if (findError || !fam) return { error: 'Invalid invite code' };

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ family_id: fam.id, role_label: roleLabel || null })
      .eq('id', session.user.id);

    if (profileError) return { error: profileError.message };

    setFamily(fam);
    await loadUserData(session.user.id);
    return {};
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        family,
        familyMembers,
        initialLoading,
        signIn,
        signUp,
        signOut,
        createFamily,
        joinFamily,
        refreshProfile,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
