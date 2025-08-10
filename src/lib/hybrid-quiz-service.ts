/**
 * Service hybride qui utilise Firebase pour les données de production
 */

import { db } from './firebase';
import { quizPathService } from './quiz-path-service';
import { productionDataService } from './production-data-service';
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
    // Initialiser avec Firebase pour les données de production
    this.checkFirebaseAvailability();
    console.log('🎮 SkillForge démarré avec le système de production');
    console.log('📋 Toutes les fonctionnalités sont disponibles !');
    console.log('🔧 Utilise Firebase pour les données réelles');
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
   * Génère un nouveau parcours de quiz basé sur les compétences de production
   */
  async generateDynamicQuizPath(
    userId: string, 
    userSkills: string[], 
    difficulty: 'beginner' | 'intermediate' | 'advanced'
  ): Promise<QuizPath> {
    try {
      logger.info('Generating quiz path with production data', {
        action: 'generate_quiz_path',
        context: { userId, difficulty, skillsCount: userSkills.length }
      });

      // Créer un parcours basique basé sur les compétences de production
      const skills = await productionDataService.getSkills();
      const availableSkills = skills.filter(skill => {
        const difficultyMap = { beginner: [1, 2], intermediate: [3, 4], advanced: [5, 6] };
        return difficultyMap[difficulty].includes(skill.level);
      });

      return {
        id: `path_${userId}_${Date.now()}`,
        name: `Parcours ${difficulty}`,
        description: `Parcours personnalisé de niveau ${difficulty}`,
        steps: availableSkills.slice(0, 3).map((skill, index) => ({
          id: `step_${skill.id}`,
          skillId: skill.id,
          order: index + 1,
          isCompleted: false,
          estimatedDuration: 15
        })),
        createdAt: new Date(),
        isCompleted: false,
        difficulty: difficulty
      };
    } catch (error) {
      logger.error('Failed to generate quiz path', {
        action: 'generate_quiz_path_error',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Récupère le défi quotidien basé sur les compétences de production
   */
  async getDailyChallenge(userId: string): Promise<DailyQuizChallenge | null> {
    try {
      logger.info('Generating daily challenge with production data', {
        action: 'get_daily_challenge',
        context: { userId }
      });

      const skills = await productionDataService.getSkills();
      const randomSkill = skills[Math.floor(Math.random() * skills.length)];

      return {
        id: `daily_${userId}_${new Date().toISOString().split('T')[0]}`,
        skillId: randomSkill.id,
        skillName: randomSkill.name,
        challengeDate: new Date(),
        isCompleted: false,
        pointsReward: 50,
        description: `Défi quotidien: ${randomSkill.description}`
      };
    } catch (error) {
      logger.error('Failed to generate daily challenge', {
        action: 'daily_challenge_error',
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Termine un défi quotidien
   */
  async completeDailyChallenge(challengeId: string, score: number): Promise<void> {
    try {
      logger.info('Completing daily challenge', {
        action: 'complete_daily_challenge',
        context: { challengeId, score }
      });
      // Dans le futur, sauvegarder la complétion en Firebase
      // Pour l'instant, juste logger l'événement
    } catch (error) {
      logger.error('Failed to complete daily challenge', {
        action: 'complete_challenge_error',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Récupère les parcours actifs basés sur les compétences de production
   */
  async getActivePaths(limit: number = 3): Promise<QuizPath[]> {
    try {
      logger.info('Getting active paths with production data', {
        action: 'get_active_paths',
        context: { limit }
      });

      const skills = await productionDataService.getSkills();
      const categories = [...new Set(skills.map(s => s.category))];
      
      return categories.slice(0, limit).map((category, index) => ({
        id: `path_${category.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
        name: `Parcours ${category}`,
        description: `Maîtrisez les compétences en ${category}`,
        steps: skills.filter(s => s.category === category).slice(0, 3).map((skill, stepIndex) => ({
          id: `step_${skill.id}`,
          skillId: skill.id,
          order: stepIndex + 1,
          isCompleted: false,
          estimatedDuration: 15
        })),
        createdAt: new Date(),
        isCompleted: false,
        difficulty: 'intermediate' as const
      }));
    } catch (error) {
      logger.error('Failed to get active paths', {
        action: 'get_active_paths_error',
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  /**
   * Récupère les détails d'une étape basée sur les compétences de production
   */
  async getStepDetails(stepId: string): Promise<QuizStep | null> {
    try {
      logger.info('Getting step details with production data', {
        action: 'get_step_details',
        context: { stepId }
      });

      // Validation de base
      if (!stepId || typeof stepId !== 'string') {
        logger.warn('Invalid stepId provided', {
          action: 'get_step_details_invalid_id',
          stepId
        });
        return null;
      }

      // Extraire le skillId du stepId (format: step_skillId)
      const skillId = stepId.replace('step_', '');
      
      if (!skillId || skillId === stepId) {
        logger.warn('Could not extract skillId from stepId', {
          action: 'get_step_details_invalid_format',
          stepId,
          extractedSkillId: skillId
        });
        return null;
      }

      const skills = await productionDataService.getSkills();
      
      if (!skills || skills.length === 0) {
        logger.warn('No skills available from production service', {
          action: 'get_step_details_no_skills',
          stepId,
          skillId
        });
        return null;
      }

      const skill = skills.find(s => s.id === skillId);

      if (!skill) {
        logger.warn('Skill not found for step', {
          action: 'get_step_details_skill_not_found',
          stepId,
          skillId,
          availableSkills: skills.map(s => s.id)
        });
        return null;
      }

      logger.info('Step details found successfully', {
        action: 'get_step_details_success',
        stepId,
        skillId,
        skillName: skill.name
      });

      return {
        id: stepId,
        skillId: skill.id,
        order: 1,
        isCompleted: false,
        estimatedDuration: 15
      };
    } catch (error) {
      logger.error('Failed to get step details', {
        action: 'get_step_details_error',
        stepId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return null;
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