
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User } from '@/lib/types';
import { users } from '@/lib/data';
import { getFirebaseAuth } from '@/lib/firebase/config';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

// Synchronous read from localStorage — no network, no blocking
const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const storedUserJson = localStorage.getItem('faminance-user');
    if (!storedUserJson) return null;
    const storedUser: Omit<User, 'role'> = JSON.parse(storedUserJson);
    const initialUser = users.find(u => u.id === storedUser.id);
    if (initialUser) return { ...initialUser, name: storedUser.name };
    localStorage.removeItem('faminance-user');
  } catch {
    localStorage.removeItem('faminance-user');
  }
  return null;
};

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  /** True once Firebase anonymous auth has resolved — needed by Firestore */
  firebaseReady: boolean;
  login: (userId: string) => void;
  logout: () => void;
  setCurrentUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Restore session synchronously — UI never blocked on first render
  const [currentUser, setCurrentUserState] = useState<User | null>(getStoredUser);
  // loading is only true when an authenticated user is redirecting (transition guard)
  const [loading, setLoading] = useState(false);
  // firebaseReady: Firebase anonymous auth is done → Firestore can be accessed
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseReady(true);
      } else {
        // No Firebase session yet — sign in anonymously for Firestore access
        try {
          await signInAnonymously(auth);
          // onAuthStateChanged will fire again with the new user
        } catch (error) {
          console.error('[AuthContext] Anonymous sign-in failed:', error);
          // Allow app to proceed; Firestore will fail gracefully with auth errors
          setFirebaseReady(true);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const login = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      localStorage.setItem('faminance-user', JSON.stringify(user));
      setCurrentUserState(user);
    }
  };

  const logout = () => {
    localStorage.removeItem('faminance-user');
    setCurrentUserState(null);
  };

  const setCurrentUser = (user: User) => {
    localStorage.setItem('faminance-user', JSON.stringify(user));
    setCurrentUserState(user);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, firebaseReady, login, logout, setCurrentUser }}>
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
