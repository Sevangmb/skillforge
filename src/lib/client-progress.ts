import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import type { User, CompetenceStatus } from './types';

export type UpdateProgressInput = {
  skillId: string;
  pointsEarned: number;
};

export async function updateUserProgress(input: UpdateProgressInput): Promise<void> {
  try {
    if (!auth) {
      throw new Error("Firebase Auth is not initialized");
    }
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    if (!db) {
      throw new Error("Firestore is not initialized");
    }

    const userId = currentUser.uid;
    const { skillId, pointsEarned } = input;

    console.log("Updating user progress:", { userId, skillId, pointsEarned });

    // Get current user data
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    let user: User;

    if (!userSnap.exists()) {
      // Create new user profile
      user = {
        id: userId,
        profile: {
          displayName: currentUser.displayName || 'Anonymous User',
          email: currentUser.email || '',
          totalPoints: 0,
          level: 1,
          isAdmin: currentUser.email === 'sevans@hotmail.fr',
        },
        competences: {},
        preferences: {
          learningStyle: 'Visual',
          favoriteTopics: [],
          adaptiveMode: 'Default',
          language: 'en',
        },
      };
      await setDoc(userRef, user);
      console.log('Created new user profile for:', userId);
    } else {
      user = userSnap.data() as User;
    }

    console.log("Current user data:", {
      totalPoints: user.profile.totalPoints,
      level: user.profile.level,
      currentCompetence: user.competences[skillId]
    });

    // Calculate new total points and level
    const newTotalPoints = (user.profile.totalPoints || 0) + pointsEarned;
    const newLevel = Math.floor(newTotalPoints / 100) + 1;

    // Update competence
    const currentCompetence = user.competences[skillId] || { level: 0, completed: false };
    const newCompetenceLevel = currentCompetence.level + 1;
    const isCompleted = newCompetenceLevel >= 10; // Complete skill at level 10

    const updatedCompetence: CompetenceStatus = {
      level: newCompetenceLevel,
      completed: isCompleted,
    };

    console.log("Updated competence data:", {
      skillId,
      oldLevel: currentCompetence.level,
      newCompetenceLevel,
      isCompleted,
      newTotalPoints,
      newUserLevel: newLevel
    });

    // Prepare updates
    const updates: Partial<User> = {
      profile: {
        ...user.profile,
        totalPoints: newTotalPoints,
        level: newLevel,
      },
      competences: {
        ...user.competences,
        [skillId]: updatedCompetence,
      },
    };

    await updateDoc(userRef, updates);
    console.log("User progress updated successfully");

  } catch (error) {
    console.error("Error updating user progress:", error);
    throw new Error(`Failed to update user progress: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 