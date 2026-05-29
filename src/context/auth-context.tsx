
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { User } from '@/lib/types';
import { users } from '@/lib/data';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged, signInAnonymously, type User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (userId: string) => void;
  logout: () => void;
  setCurrentUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      console.log("[AuthContext] Starting auth initialization...");
      setLoading(true);
      
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        console.log("[AuthContext] onAuthStateChanged callback fired. fbUser:", fbUser);
        if (fbUser) {
          setFirebaseUser(fbUser);
          
          // Try to load user from localStorage first
          const storedUserJson = localStorage.getItem('faminance-user');
          console.log("[AuthContext] Stored user in localStorage:", storedUserJson);
          if (storedUserJson) {
            try {
              const storedUser: Omit<User, 'role'> = JSON.parse(storedUserJson);
              const initialUser = users.find(u => u.id === storedUser.id);
              if (initialUser) {
                console.log("[AuthContext] Found initial user matching localStorage:", initialUser);
                setCurrentUserState({ ...initialUser, name: storedUser.name });
              } else {
                console.log("[AuthContext] Stored user not found in initial users list, removing.");
                localStorage.removeItem('faminance-user');
                setCurrentUserState(null);
              }
            } catch (e) {
              console.error("[AuthContext] Error parsing stored user:", e);
              localStorage.removeItem('faminance-user');
              setCurrentUserState(null);
            }
          }
          // Only after checking local storage and firebase user, we can say we are done loading.
          console.log("[AuthContext] Setting loading to false.");
          setLoading(false);

        } else {
          // If there's no Firebase user, attempt to sign in anonymously
          try {
            console.log("[AuthContext] No fbUser. Attempting anonymous sign-in...");
            const credential = await signInAnonymously(auth);
            console.log("[AuthContext] Anonymous sign-in succeeded:", credential.user);
            // The onAuthStateChanged listener will be called again with the new user,
            // so we don't need to set loading to false here.
          } catch (error) {
            console.error("[AuthContext] Anonymous sign-in failed:", error);
            setCurrentUserState(null);
            setLoading(false); // Stop loading if sign-in fails
          }
        }
      });
      
      return unsubscribe;
    };

    const unsubscribePromise = initializeAuth();

    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
    };
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
  }

  const value = {
    currentUser,
    loading,
    login,
    logout,
    setCurrentUser
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
