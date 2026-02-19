'use client';

import { createContext, useContext, useEffect, useState } from 'react';

// Mock types formerly from @supabase/supabase-js
interface User {
  id: string;
  email?: string;
}

interface Session {
  user: User;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock successful authentication for demo purposes
    const mockUser: User = { id: 'mock-user-id', email: 'owner@example.com' };
    const mockSession: Session = { user: mockUser };

    setSession(mockSession);
    setUser(mockUser);
    setIsLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('Mock signIn:', email);
    return { error: null };
  };

  const signUp = async (email: string, password: string) => {
    console.log('Mock signUp:', email);
    return { error: null };
  };

  const signOut = async () => {
    console.log('Mock signOut');
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isLoading,
      signIn,
      signUp,
      signOut,
    }}>
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

