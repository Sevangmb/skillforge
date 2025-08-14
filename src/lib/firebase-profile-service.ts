/**
 * Firebase Profile Service
 * Service pour la gestion des profils utilisateur avec Firebase Firestore
 */

import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { logger } from './logger';
import type { User, UserProfile, UserPreferences, UserId, Result } from './types';
import { z } from 'zod';

// Validation schemas
const UserPreferencesSchema = z.object({
  learningStyle: z.enum(['Visual', 'Auditory', 'Kinesthetic', 'Reading']),
  favoriteTopics: z.array(z.enum(['Évaluation', 'Mathématiques', 'Sciences', 'Informatique', 'Langues', 'Compétences transversales'])),
  adaptiveMode: z.enum(['Focus', 'Explore', 'Challenge', 'Default']),
  language: z.enum(['en', 'fr', 'es', 'de']),
  notificationsEnabled: z.boolean().optional(),
  dailyChallengeReminder: z.boolean().optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    achievements: z.boolean().optional(),
    reminders: z.boolean().optional(),
  }).optional(),
});

const UserProfileSchema = z.object({
  displayName: z.string().min(1).max(100),
  email: z.string().email(),
  avatar: z.string().url().optional(),
  totalPoints: z.number().min(0).optional(),
  level: z.number().min(1).optional(),
});

export interface ProfileUpdateData {
  profile?: Partial<UserProfile>;
  preferences?: Partial<UserPreferences>;
}

export class FirebaseProfileService {
  private static instance: FirebaseProfileService;

  public static getInstance(): FirebaseProfileService {
    if (!this.instance) {
      this.instance = new FirebaseProfileService();
    }
    return this.instance;
  }

  /**
   * Met à jour le profil utilisateur dans Firestore
   */
  async updateUserProfile(
    userId: UserId,
    updateData: ProfileUpdateData
  ): Promise<Result<void, Error>> {
    try {
      // Validation des données
      if (updateData.profile) {
        const profileValidation = UserProfileSchema.partial().safeParse(updateData.profile);
        if (!profileValidation.success) {
          throw new Error(`Invalid profile data: ${profileValidation.error.message}`);
        }
      }

      if (updateData.preferences) {
        const preferencesValidation = UserPreferencesSchema.partial().safeParse(updateData.preferences);
        if (!preferencesValidation.success) {
          throw new Error(`Invalid preferences data: ${preferencesValidation.error.message}`);
        }
      }

      const userRef = doc(db, 'users', userId);
      
      // Vérifier si l'utilisateur existe
      const userSnapshot = await getDoc(userRef);
      if (!userSnapshot.exists()) {
        throw new Error('User not found');
      }

      // Préparer les données de mise à jour
      const updatePayload: Record<string, any> = {
        updatedAt: serverTimestamp(),
      };

      if (updateData.profile) {
        Object.entries(updateData.profile).forEach(([key, value]) => {
          updatePayload[`profile.${key}`] = value;
        });
      }

      if (updateData.preferences) {
        Object.entries(updateData.preferences).forEach(([key, value]) => {
          updatePayload[`preferences.${key}`] = value;
        });
      }

      // Mise à jour dans Firestore
      await updateDoc(userRef, updatePayload);

      logger.info('Profile updated successfully', {
        userId,
        updatedFields: Object.keys(updatePayload),
        timestamp: new Date().toISOString(),
      });

      return { success: true, data: undefined };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error('Failed to update user profile', {
        userId,
        error: errorMessage,
        updateData,
        timestamp: new Date().toISOString(),
      });

      return {
        success: false,
        error: new Error(`Failed to update profile: ${errorMessage}`)
      };
    }
  }

  /**
   * Récupère le profil complet d'un utilisateur
   */
  async getUserProfile(userId: UserId): Promise<Result<User, Error>> {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnapshot = await getDoc(userRef);

      if (!userSnapshot.exists()) {
        throw new Error('User not found');
      }

      const userData = userSnapshot.data() as User;
      
      logger.debug('Profile retrieved successfully', {
        userId,
        hasProfile: !!userData.profile,
        hasPreferences: !!userData.preferences,
      });

      return { success: true, data: userData };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error('Failed to retrieve user profile', {
        userId,
        error: errorMessage,
      });

      return {
        success: false,
        error: new Error(`Failed to retrieve profile: ${errorMessage}`)
      };
    }
  }

  /**
   * Met à jour uniquement les préférences utilisateur
   */
  async updateUserPreferences(
    userId: UserId,
    preferences: Partial<UserPreferences>
  ): Promise<Result<void, Error>> {
    return this.updateUserProfile(userId, { preferences });
  }

  /**
   * Met à jour uniquement le profil utilisateur (sans préférences)
   */
  async updateProfileInfo(
    userId: UserId,
    profile: Partial<UserProfile>
  ): Promise<Result<void, Error>> {
    return this.updateUserProfile(userId, { profile });
  }

  /**
   * Met à jour l'avatar utilisateur
   */
  async updateUserAvatar(
    userId: UserId,
    avatarUrl: string
  ): Promise<Result<void, Error>> {
    try {
      // Validation de l'URL
      new URL(avatarUrl); // Throws if invalid

      return this.updateProfileInfo(userId, { avatar: avatarUrl });
    } catch (error) {
      return {
        success: false,
        error: new Error('Invalid avatar URL provided')
      };
    }
  }
}

// Export singleton instance
export const profileService = FirebaseProfileService.getInstance();