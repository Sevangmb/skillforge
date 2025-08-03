import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { User, CompetenceStatus } from './types';

// Server-side version of getUserProfile
export const getServerUserProfile = async (uid: string): Promise<User | null> => {
  try {
    if (!db) {
      console.error('Firestore is not initialized');
      return null;
    }
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as User;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

// Server-side version of createUserProfile
export const createServerUserProfile = async (uid: string, email?: string, displayName?: string): Promise<User> => {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
    
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const newUser: User = {
        id: uid,
        profile: {
          displayName: displayName || 'Anonymous User',
          email: email || '',
          totalPoints: 0,
          level: 1,
          isAdmin: email === 'sevans@hotmail.fr',
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
      console.log('Created new user profile for:', uid);
      return newUser;
    } else {
      // If user exists, check if we need to update the admin status
      const existingUser = userSnap.data() as User;
      if (existingUser.profile.email === 'sevans@hotmail.fr' && !existingUser.profile.isAdmin) {
        await updateDoc(userRef, { 'profile.isAdmin': true });
        existingUser.profile.isAdmin = true;
      }
      return existingUser;
    }
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

// Server-side version of updateUserProfile
export const updateServerUserProfile = async (uid: string, updates: Partial<User>): Promise<void> => {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}; 