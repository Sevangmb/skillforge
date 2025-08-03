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

export const getSkillsFromFirestore = async (retries = 2): Promise<Skill[]> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (!db) {
        console.warn('Firestore is not initialized');
        return [];
      }
      
      const skillsCol = collection(db, 'skills');
      const skillSnapshot = await getDocs(skillsCol);
      const skills = skillSnapshot.docs.map(doc => doc.data() as Skill);
      
      if (skills.length === 0 && attempt < retries) {
        console.warn(`No skills found, attempt ${attempt + 1}/${retries + 1}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      
      return skills;
    } catch (error) {
      console.error(`Error getting skills from Firestore (attempt ${attempt + 1}):`, error);
      
      if (attempt === retries) {
        // On final attempt, return empty array instead of throwing
        return [];
      }
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }
  
  return [];
};

// Leaderboard operations
export const getLeaderboard = async (limitCount: number = 10, retries = 2): Promise<User[]> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
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
      console.error(`Error getting leaderboard (attempt ${attempt + 1}):`, error);
      
      if (attempt === retries) {
        return [];
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  
  return [];
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