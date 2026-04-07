import React, { createContext, useContext, useEffect, useState } from 'react';
import { Profile, Family } from '@/lib/database.types';

// Mock data for development — replace with Supabase auth later
const MOCK_FAMILIES: Family[] = [
  {
    id: 'family-1',
    name: 'The Kumars',
    invite_code: 'HIVE2024',
    created_at: new Date().toISOString(),
  },
];

const MOCK_PROFILES: Profile[] = [
  {
    id: 'user-1',
    family_id: 'family-1',
    display_name: 'Arjun',
    avatar_url: null,
    role_label: 'Dad',
    phone: '+1234567890',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-2',
    family_id: 'family-1',
    display_name: 'Priya',
    avatar_url: null,
    role_label: 'Mom',
    phone: '+1234567891',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-3',
    family_id: 'family-1',
    display_name: 'Riya',
    avatar_url: null,
    role_label: 'Kid',
    phone: null,
    created_at: new Date().toISOString(),
  },
];

interface AuthContextType {
  user: Profile | null;
  family: Family | null;
  familyMembers: Profile[];
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  createFamily: (name: string) => Promise<string>;
  joinFamily: (inviteCode: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [familyMembers, setFamilyMembers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Auto-login with mock data for development
    setTimeout(() => {
      setUser(MOCK_PROFILES[0]);
      setFamily(MOCK_FAMILIES[0]);
      setFamilyMembers(MOCK_PROFILES);
      setIsLoading(false);
    }, 500);
  }, []);

  const signIn = async (email: string, password: string) => {
    setUser(MOCK_PROFILES[0]);
    setFamily(MOCK_FAMILIES[0]);
    setFamilyMembers(MOCK_PROFILES);
  };

  const signUp = async (email: string, password: string, name: string) => {
    setUser(MOCK_PROFILES[0]);
  };

  const signOut = async () => {
    setUser(null);
    setFamily(null);
    setFamilyMembers([]);
  };

  const createFamily = async (name: string): Promise<string> => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFamily({ id: 'new-family', name, invite_code: code, created_at: new Date().toISOString() });
    return code;
  };

  const joinFamily = async (inviteCode: string) => {
    setFamily(MOCK_FAMILIES[0]);
    setFamilyMembers(MOCK_PROFILES);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        family,
        familyMembers,
        isLoading,
        isAuthenticated: !!user && !!family,
        signIn,
        signUp,
        signOut,
        createFamily,
        joinFamily,
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
