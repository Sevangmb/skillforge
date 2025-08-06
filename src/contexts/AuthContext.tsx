"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChange, getUserProfile, createUserProfile } from '@/lib/auth';
import type { User } from '@/lib/types';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  user: null,
  loading: true,
  error: null,
  refreshUser: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = async () => {
    if (firebaseUser) {
      try {
        const userProfile = await getUserProfile(firebaseUser.uid);
        setUser(userProfile);
        setError(null);
      } catch (err) {
        console.error('Error refreshing user:', err);
        setError('Failed to load user profile');
      }
    }
  };

  useEffect(() => {
    // Only set up auth listener in browser environment
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          let userProfile = await getUserProfile(firebaseUser.uid);
          
          // If user profile doesn't exist, create a new one
          if (!userProfile) {
            console.log('User profile not found, creating new profile for:', firebaseUser.email);
            userProfile = await createUserProfile(firebaseUser);
          }
          
          setUser(userProfile);
          setError(null);
        } catch (err) {
          console.error('Error loading user profile:', err);
          setError('Failed to load user profile');
          setUser(null);
        }
      } else {
        setUser(null);
        setError(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    firebaseUser,
    user,
    loading,
    error,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};