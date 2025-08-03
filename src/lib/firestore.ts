import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  limit,
  where
} from 'firebase/firestore';
import { db } from './firebase';
import type { User, Skill } from './types';

// User operations
export const saveUserToFirestore = async (user: User): Promise<void> => {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, user, { merge: true });
  } catch (error) {
    console.error('Error saving user to Firestore:', error);
    throw error;
  }
};

export const updateUserProgress = async (
  userId: string, 
  competenceId: string, 
  progress: { level: number; completed: boolean }
): Promise<void> => {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      [`competences.${competenceId}`]: progress
    });
  } catch (error) {
    console.error('Error updating user progress:', error);
    throw error;
  }
};

export const updateUserPoints = async (userId: string, pointsToAdd: number): Promise<void> => {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'profile.totalPoints': pointsToAdd
    });
  } catch (error) {
    console.error('Error updating user points:', error);
    throw error;
  }
};

// Skills operations
export const saveSkillsToFirestore = async (skills: Skill[]): Promise<void> => {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
    const firestore = db; // TypeScript type narrowing
    const batch = skills.map(async (skill) => {
      const skillRef = doc(firestore, 'skills', skill.id);
      await setDoc(skillRef, skill);
    });
    await Promise.all(batch);
  } catch (error) {
    console.error('Error saving skills to Firestore:', error);
    throw error;
  }
};

export const getSkillsFromFirestore = async (): Promise<Skill[]> => {
  try {
    if (!db) {
      console.warn('Firestore is not initialized');
      return [];
    }
    const skillsCol = collection(db, 'skills');
    const skillSnapshot = await getDocs(skillsCol);
    return skillSnapshot.docs.map(doc => doc.data() as Skill);
  } catch (error) {
    console.error('Error getting skills from Firestore:', error);
    return [];
  }
};

// Leaderboard operations
export const getLeaderboard = async (limitCount: number = 10): Promise<User[]> => {
  try {
    if (!db) {
      console.warn('Firestore is not initialized');
      return [];
    }
    const usersCol = collection(db, 'users');
    const leaderboardQuery = query(
      usersCol,
      orderBy('profile.totalPoints', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(leaderboardQuery);
    return snapshot.docs.map(doc => doc.data() as User);
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
};

// Real-time listeners
export const subscribeToUserUpdates = (
  userId: string,
  callback: (user: User | null) => void
): (() => void) => {
  if (!db) {
    console.warn('Firestore is not initialized');
    return () => {};
  }
  const userRef = doc(db, 'users', userId);
  return onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data() as User);
    } else {
      callback(null);
    }
  });
};

export const subscribeToLeaderboard = (
  callback: (users: User[]) => void,
  limitCount: number = 10
): (() => void) => {
  if (!db) {
    console.warn('Firestore is not initialized');
    return () => {};
  }
  const usersCol = collection(db, 'users');
  const leaderboardQuery = query(
    usersCol,
    orderBy('profile.totalPoints', 'desc'),
    limit(limitCount)
  );
  
  return onSnapshot(leaderboardQuery, (snapshot) => {
    const users = snapshot.docs.map(doc => doc.data() as User);
    callback(users);
  });
};