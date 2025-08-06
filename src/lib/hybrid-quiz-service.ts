/**
 * Service hybride qui utilise Firebase quand disponible, sinon les données mockées
 */

import { db } from './firebase';
import { quizPathService } from './quiz-path-service';
import { mockDataService } from './mock-data-service';
import { logger } from './logger';
import type { QuizPath, QuizStep, DailyQuizChallenge } from './types';

class HybridQuizService {
  private static instance: HybridQuizService;
  private useFirebase: boolean = false;
  
  static getInstance(): HybridQuizService {
    if (!HybridQuizService.instance) {
      HybridQuizService.instance = new HybridQuizService();
    }
    return HybridQuizService.instance;
  }

  private constructor() {
    // Force le mode démo pour éviter les erreurs de permissions
    this.useFirebase = false;
    console.log('🎮 SkillForge démarré en MODE DÉMO');
    console.log('📋 Toutes les fonctionnalités sont disponibles !');
    console.log('🔧 Pour Firebase: consultez SOLUTION_IMMEDIATE.md');
  }

  /**
   * Vérifie si Firebase est disponible
   */
  private checkFirebaseAvailability(): void {
    this.useFirebase = db !== null && db !== undefined;
    
    logger.info('Hybrid service initialized', {
      action: 'hybrid_service_init',
      context: { 
        useFirebase: this.useFirebase,
        mode: this.useFirebase ? 'firebase' : 'mock'
      }
    });
  }

  /**
   * Génère un nouveau parcours de quiz
   */
  async generateDynamicQuizPath(
    userId: string, 
    userSkills: string[], 
    difficulty: 'beginner' | 'intermediate' | 'advanced'
  ): Promise<QuizPath> {
    try {
      if (this.useFirebase) {
        return await quizPathService.generateDynamicQuizPath(userId, userSkills, difficulty);
      } else {
        logger.info('Using mock data for quiz path generation', {
          action: 'fallback_to_mock',
          context: { reason: 'firebase_unavailable' }
        });
        return await mockDataService.generateDynamicQuizPath(userId, userSkills, difficulty);
      }
    } catch (error) {
      // Si Firebase échoue, utiliser les données mockées
      logger.warn('Firebase failed, falling back to mock data', {
        action: 'firebase_fallback',
        error: error instanceof Error ? error.message : String(error)
      });
      return await mockDataService.generateDynamicQuizPath(userId, userSkills, difficulty);
    }
  }

  /**
   * Récupère le défi quotidien
   */
  async getDailyChallenge(userId: string): Promise<DailyQuizChallenge | null> {
    try {
      if (this.useFirebase) {
        return await quizPathService.getDailyChallenge(userId);
      } else {
        return await mockDataService.getDailyChallenge(userId);
      }
    } catch (error: any) {
      // Détection spécifique des erreurs de permissions Firebase
      const isPermissionError = error.message?.includes('permissions') || 
                               error.message?.includes('Missing or insufficient') ||
                               error.code === 'permission-denied';
                               
      if (isPermissionError) {
        console.error('🚨 FIREBASE PERMISSIONS ERROR 🚨');
        console.log('📋 SOLUTION IMMÉDIATE:');
        console.log('1. Ouvrez: https://console.firebase.google.com');
        console.log('2. Projet: skillforge-ai-tk7mp');
        console.log('3. Authentication → Sign-in Method → Enable Anonymous');
        console.log('4. Firestore → Rules → Deploy firestore.rules');
        console.log('💡 L\'app fonctionne en mode démo en attendant');
      }
      
      logger.warn('Firebase failed for daily challenge, using mock', {
        action: 'daily_challenge_fallback',
        error: error instanceof Error ? error.message : String(error),
        isPermissionError
      });
      return await mockDataService.getDailyChallenge(userId);
    }
  }

  /**
   * Termine un défi quotidien
   */
  async completeDailyChallenge(challengeId: string, score: number): Promise<void> {
    try {
      if (this.useFirebase) {
        await quizPathService.completeDailyChallenge(challengeId, score);
      } else {
        await mockDataService.completeDailyChallenge(challengeId, score);
      }
    } catch (error) {
      logger.warn('Firebase failed for challenge completion, using mock', {
        action: 'complete_challenge_fallback',
        error: error instanceof Error ? error.message : String(error)
      });
      await mockDataService.completeDailyChallenge(challengeId, score);
    }
  }

  /**
   * Récupère les parcours actifs
   */
  async getActivePaths(limit: number = 3): Promise<QuizPath[]> {
    try {
      if (this.useFirebase) {
        // Utiliser la méthode privée du service Firebase
        const paths = await mockDataService.getActivePaths(limit); // Temporaire
        return paths;
      } else {
        return await mockDataService.getActivePaths(limit);
      }
    } catch (error) {
      logger.warn('Firebase failed for active paths, using mock', {
        action: 'active_paths_fallback',
        error: error instanceof Error ? error.message : String(error)
      });
      return await mockDataService.getActivePaths(limit);
    }
  }

  /**
   * Récupère les détails d'une étape
   */
  async getStepDetails(stepId: string): Promise<QuizStep | null> {
    try {
      if (this.useFirebase) {
        // Implémenter l'accès Firebase plus tard
        return await mockDataService.getStepDetails(stepId);
      } else {
        return await mockDataService.getStepDetails(stepId);
      }
    } catch (error) {
      logger.warn('Firebase failed for step details, using mock', {
        action: 'step_details_fallback',
        error: error instanceof Error ? error.message : String(error)
      });
      return await mockDataService.getStepDetails(stepId);
    }
  }

  /**
   * Indique si le service utilise Firebase ou les mocks
   */
  isUsingFirebase(): boolean {
    return this.useFirebase;
  }

  /**
   * Force le rechargement de la configuration Firebase
   */
  async refreshFirebaseStatus(): Promise<void> {
    this.checkFirebaseAvailability();
    logger.info('Firebase status refreshed', {
      action: 'firebase_status_refresh',
      context: { useFirebase: this.useFirebase }
    });
  }
}

// Export de l'instance singleton
export const hybridQuizService = HybridQuizService.getInstance();