/**
 * Service de données de production pour SkillForge AI
 * Remplace complètement le système de mocks et démonstration
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  writeBatch,
  query,
  where
} from 'firebase/firestore';
import { db } from './firebase';
import { productionSkills, productionUsers, ProductionDataManager } from './production-data';
import type { Skill, User } from './types';
import { logger } from './logger';
import { ErrorHandler, withRetry } from './error-handler';
import type { Result } from './types';

export class ProductionDataService {
  private static instance: ProductionDataService;
  private initialized = false;
  private skillsCache: Skill[] | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): ProductionDataService {
    if (!ProductionDataService.instance) {
      ProductionDataService.instance = new ProductionDataService();
    }
    return ProductionDataService.instance;
  }

  /**
   * Initialise la base de données avec les données de production
   */
  async initializeProductionData(): Promise<void> {
    if (this.initialized) {
      logger.info('Production data already initialized');
      return;
    }

    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      logger.info('Starting production data initialization', {
        action: 'prod_data_init_start',
        skillsCount: productionSkills.length,
        usersCount: productionUsers.length
      });

      // Valider la cohérence des données avant l'insertion
      const validation = ProductionDataManager.validateSkillTree();
      if (!validation.isValid) {
        throw new Error(`Invalid skill tree: ${validation.errors.join(', ')}`);
      }

      // Utiliser une transaction batch pour l'atomicité
      const batch = writeBatch(db);

      // 1. Insérer les compétences
      for (const skill of productionSkills) {
        const skillRef = doc(db, 'skills', skill.id);
        batch.set(skillRef, skill);
      }

      // 2. Insérer les utilisateurs
      for (const user of productionUsers) {
        const userRef = doc(db, 'users', user.id);
        batch.set(userRef, user);
      }

      // 3. Créer la configuration système
      const configRef = doc(db, 'system', 'config');
      batch.set(configRef, {
        initialized: true,
        version: '1.0.0',
        skillTreeStats: ProductionDataManager.getSkillTreeStats(),
        lastUpdate: new Date(),
        environment: 'production'
      });

      // Exécuter la transaction
      await batch.commit();

      this.initialized = true;

      logger.info('Production data initialization completed', {
        action: 'prod_data_init_success',
        skillsInserted: productionSkills.length,
        usersInserted: productionUsers.length,
        stats: ProductionDataManager.getSkillTreeStats()
      });

    } catch (error) {
      logger.error('Failed to initialize production data', {
        action: 'prod_data_init_error',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Vérifie si la base de données est initialisée
   */
  async isInitialized(): Promise<boolean> {
    if (!db) return false;

    try {
      const configRef = doc(db, 'system', 'config');
      const configSnap = await getDoc(configRef);
      
      if (!configSnap.exists()) return false;
      
      const config = configSnap.data();
      return config?.initialized === true && config?.environment === 'production';
    } catch (error) {
      logger.warn('Failed to check initialization status', {
        action: 'prod_data_check_init_error',
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Charge les compétences depuis la base de données avec mise en cache et fallback local
   */
  async getSkills(): Promise<Skill[]> {
    // Vérifier le cache d'abord
    const now = Date.now();
    if (this.skillsCache && now < this.cacheExpiry) {
      logger.debug('Returning cached skills', {
        action: 'skills_cache_hit',
        count: this.skillsCache.length
      });
      return this.skillsCache;
    }

    // Si Firebase n'est pas disponible, utiliser les données locales
    if (!db) {
      logger.warn('Firebase not available, using local production data', {
        action: 'firebase_fallback_local',
        skillsCount: productionSkills.length
      });
      
      // Mettre à jour le cache avec les données locales
      this.skillsCache = productionSkills;
      this.cacheExpiry = now + this.CACHE_DURATION;
      
      return productionSkills;
    }

    try {
      return await withRetry(
        async () => {
          // Vérifier si la DB est initialisée, sinon l'initialiser
          const isInit = await this.isInitialized();
          if (!isInit) {
            logger.info('Database not initialized, initializing with production data');
            await this.initializeProductionData();
          }

          const skillsCol = collection(db, 'skills');
          const skillSnapshot = await getDocs(skillsCol);
          
          if (skillSnapshot.empty) {
            throw ErrorHandler.createFirebaseError('firestore/no-data', 'No skills found in database');
          }

          const skills = skillSnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          } as Skill));

          // Mettre à jour le cache
          this.skillsCache = skills;
          this.cacheExpiry = now + this.CACHE_DURATION;

          logger.info('Production skills loaded and cached from Firebase', {
            action: 'prod_skills_loaded_firebase',
            count: skills.length,
            cacheExpiry: new Date(this.cacheExpiry).toISOString()
          });

          return skills;
        },
        {
          maxRetries: 2,
          delay: 1000,
          backoff: 1.5,
          context: 'getSkills'
        }
      );
    } catch (error) {
      // En cas d'échec Firebase, utiliser les données locales comme fallback
      logger.warn('Firebase failed, falling back to local production data', {
        action: 'firebase_fallback_error',
        error: error instanceof Error ? error.message : String(error),
        skillsCount: productionSkills.length
      });
      
      // Mettre à jour le cache avec les données locales
      this.skillsCache = productionSkills;
      this.cacheExpiry = now + this.CACHE_DURATION;
      
      return productionSkills;
    }
  }

  /**
   * Charge un utilisateur spécifique
   */
  async getUser(userId: string): Promise<User | null> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return null;
      }

      return { ...userSnap.data(), id: userSnap.id } as User;
    } catch (error) {
      logger.error('Failed to load user', {
        action: 'prod_user_load_error',
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Crée un nouvel utilisateur avec le profil de base
   */
  async createUser(userProfile: {
    id: string;
    displayName: string;
    email: string;
  }): Promise<User> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    const newUser: User = {
      id: userProfile.id,
      profile: {
        displayName: userProfile.displayName,
        email: userProfile.email,
        totalPoints: 0,
        level: 1,
        isAdmin: false
      },
      competences: {},
      preferences: {
        learningStyle: 'Visual',
        favoriteTopics: [],
        adaptiveMode: 'Default',
        language: 'fr'
      }
    };

    try {
      const userRef = doc(db, 'users', userProfile.id);
      await setDoc(userRef, newUser);

      logger.info('New user created', {
        action: 'prod_user_created',
        userId: userProfile.id,
        email: userProfile.email
      });

      return newUser;
    } catch (error) {
      logger.error('Failed to create user', {
        action: 'prod_user_create_error',
        userId: userProfile.id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Met à jour le progrès d'un utilisateur
   */
  async updateUserProgress(
    userId: string, 
    skillId: string, 
    progress: { level: number; completed: boolean }
  ): Promise<void> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        throw new Error('User not found');
      }

      const user = userSnap.data() as User;
      user.competences[skillId] = progress;

      // Recalculer les points et le niveau
      const totalPoints = Object.values(user.competences)
        .reduce((sum, comp) => sum + (comp.completed ? comp.level : 0), 0);
      
      user.profile.totalPoints = totalPoints;
      user.profile.level = Math.floor(totalPoints / 100) + 1;

      await setDoc(userRef, user);

      logger.info('User progress updated', {
        action: 'prod_user_progress_updated',
        userId,
        skillId,
        newLevel: progress.level,
        completed: progress.completed,
        totalPoints
      });

    } catch (error) {
      logger.error('Failed to update user progress', {
        action: 'prod_user_progress_error',
        userId,
        skillId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Obtient les statistiques globales du système
   */
  async getSystemStats(): Promise<any> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const configRef = doc(db, 'system', 'config');
      const configSnap = await getDoc(configRef);

      if (!configSnap.exists()) {
        return null;
      }

      return configSnap.data();
    } catch (error) {
      logger.error('Failed to load system stats', {
        action: 'prod_stats_error',
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Force la réinitialisation des données (admin uniquement)
   */
  async resetProductionData(): Promise<void> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    logger.warn('Resetting production data', {
      action: 'prod_data_reset'
    });

    // Vider le cache
    this.invalidateCache();
    this.initialized = false;
    await this.initializeProductionData();
  }

  /**
   * Invalide le cache des compétences
   */
  invalidateCache(): void {
    this.skillsCache = null;
    this.cacheExpiry = 0;
    logger.debug('Skills cache invalidated', {
      action: 'cache_invalidated'
    });
  }

  /**
   * Vérifie si le cache est valide
   */
  isCacheValid(): boolean {
    return this.skillsCache !== null && Date.now() < this.cacheExpiry;
  }
}

// Export de l'instance singleton
export const productionDataService = ProductionDataService.getInstance();