"use client";

import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { User } from './types';
import { logger } from './logger';

export interface AuthError {
  code: string;
  message: string;
}

// Create user profile in Firestore
// Environment-based admin configuration
const getAdminEmails = (): string[] => {
  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS || 'sevans@hotmail.fr';
  return adminEmails.split(',').map(email => email.trim());
};

export const createUserProfile = async (firebaseUser: FirebaseUser): Promise<User> => {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }
  const userRef = doc(db, 'users', firebaseUser.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const adminEmails = getAdminEmails();
    const newUser: User = {
      id: firebaseUser.uid,
      profile: {
        displayName: firebaseUser.displayName || 'Anonymous User',
        email: firebaseUser.email || '',
        totalPoints: 0,
        level: 1,
        isAdmin: firebaseUser.email ? adminEmails.includes(firebaseUser.email) : false,
      },
      competences: {},
      preferences: {
        learningStyle: 'Visual',
        favoriteTopics: [],
        adaptiveMode: 'Default',
        language: 'en',
      },
    };

    await setDoc(userRef, newUser);
    logger.info('User profile created', {
      action: 'create_user_profile',
      userId: firebaseUser.uid,
      context: { isAdmin: newUser.profile.isAdmin }
    });
    return newUser;
  } else {
    const existingUser = userSnap.data() as User;
    const adminEmails = getAdminEmails();
    const shouldBeAdmin = existingUser.profile.email ? adminEmails.includes(existingUser.profile.email) : false;
    
    if (shouldBeAdmin !== existingUser.profile.isAdmin) {
      await updateDoc(userRef, { 'profile.isAdmin': shouldBeAdmin });
      existingUser.profile.isAdmin = shouldBeAdmin;
      logger.info('Admin status updated', {
        action: 'update_admin_status',
        userId: firebaseUser.uid,
        context: { isAdmin: shouldBeAdmin }
      });
    }
    return existingUser;
  }
};

// Get user profile from Firestore
export const getUserProfile = async (uid: string): Promise<User | null> => {
  try {
    if (!db) {
      logger.error('Firestore not initialized for user profile fetch', {
        action: 'get_user_profile',
        userId: uid
      });
      return null;
    }
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as User;
    }
    // If profile doesn't exist, it might be a new sign-in, try creating it
    if (auth.currentUser && auth.currentUser.uid === uid) {
      return await createUserProfile(auth.currentUser);
    }
    return null;
  } catch (error) {
    logger.error('Failed to fetch user profile', {
      action: 'get_user_profile',
      userId: uid,
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (uid: string, updates: Partial<User>): Promise<void> => {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, updates);
  } catch (error) {
    logger.error('Failed to update user profile', {
      action: 'update_user_profile',
      userId: uid,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
};

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string, displayName: string) => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized');
    }
    logger.info('User signup initiated', {
      action: 'signup_start',
      context: { email }
    });
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    logger.info('Firebase user created successfully', {
      action: 'firebase_user_created',
      userId: user.uid
    });
    
    // Update display name
    await updateProfile(user, { displayName });
    logger.info('User display name updated', {
      action: 'update_display_name',
      userId: user.uid
    });
    
    // Create user profile in Firestore
    await createUserProfile(user);
    logger.info('User profile created in Firestore', {
      action: 'create_user_profile',
      userId: user.uid
    });
    
    return { user, error: null };
  } catch (error: any) {
    logger.error('User signup failed', {
      action: 'signup_failed',
      error: error.message || String(error),
      context: { email }
    });
    return { user: null, error: error as AuthError };
  }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized');
    }
    logger.info('User signin initiated', {
      action: 'signin_start',
      context: { email }
    });
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Ensure profile exists on sign-in
    await getUserProfile(userCredential.user.uid);
    
    logger.info('User signin successful', {
      action: 'signin_success',
      userId: userCredential.user.uid
    });
    
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    logger.error('User signin failed', {
      action: 'signin_failed',
      error: error.message || String(error),
      context: { email }
    });
    return { user: null, error: error as AuthError };
  }
};


// Sign out
export const logOut = async () => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized');
    }
    await signOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error: error as AuthError };
  }
};

// Auth state listener
export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  if (!auth) {
    console.error('Firebase Auth is not initialized');
    return () => {}; // Return empty unsubscribe function
  }
  return onAuthStateChanged(auth, callback);
};
