/**
 * Service pour gérer les parcours de quiz dynamiques avec IA
 */

import { collection, doc, getDocs, setDoc, updateDoc, query, where, orderBy, limit, addDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { logger } from './logger';
import { resilientAIService } from './resilient-ai-service';
import type { QuizPath, QuizStep, DailyQuizChallenge, QuizPathProgress, User, QuizQuestion } from './types';

export class QuizPathService {
  private static instance: QuizPathService;
  
  static getInstance(): QuizPathService {
    if (!QuizPathService.instance) {
      QuizPathService.instance = new QuizPathService();
    }
    return QuizPathService.instance;
  }

  private constructor() {}

  /**
   * Génère automatiquement un nouveau parcours de quiz basé sur les compétences de l'utilisateur
   */
  async generateDynamicQuizPath(userId: string, userSkills: string[], difficulty: 'beginner' | 'intermediate' | 'advanced'): Promise<QuizPath> {
    try {
      if (!db) throw new Error('Firestore not initialized');

      // Analyser les compétences existantes pour déterminer le prochain parcours
      const nextTopic = await this.determineNextTopic(userId, userSkills);
      
      const pathId = `path_${Date.now()}_${userId.slice(0, 8)}`;
      const unlockDate = new Date();
      
      // Créer le parcours de base
      const newPath: QuizPath = {
        id: pathId,
        title: `Parcours ${nextTopic.name}`,
        description: `Approfondissez vos connaissances en ${nextTopic.name} avec ce parcours adaptatif`,
        category: nextTopic.category,
        difficulty,
        estimatedDuration: this.calculateEstimatedDuration(difficulty),
        totalSteps: this.calculateTotalSteps(difficulty),
        currentStep: 0,
        isCompleted: false,
        unlockDate,
        createdByAI: true,
        prerequisites: nextTopic.prerequisites,
        tags: nextTopic.tags
      };

      // Sauvegarder le parcours dans Firestore
      await setDoc(doc(db, 'quiz_paths', pathId), {
        ...newPath,
        unlockDate: Timestamp.fromDate(unlockDate)
      });

      // Générer les premières étapes du parcours
      await this.generateInitialSteps(pathId, nextTopic, difficulty);

      logger.info('Dynamic quiz path generated', {
        action: 'generate_dynamic_path',
        context: { pathId, userId, topic: nextTopic.name }
      });

      return newPath;
    } catch (error) {
      logger.error('Failed to generate dynamic quiz path', {
        action: 'generate_dynamic_path',
        error: error instanceof Error ? error.message : String(error),
        context: { userId }
      });
      throw error;
    }
  }

  /**
   * Génère les étapes initiales d'un parcours
   */
  private async generateInitialSteps(pathId: string, topic: any, difficulty: string): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');

    const stepTypes = ['lesson', 'quiz', 'challenge'];
    const initialStepCount = 3;

    for (let i = 0; i < initialStepCount; i++) {
      const stepType = stepTypes[i % stepTypes.length] as QuizStep['type'];
      const stepId = `${pathId}_step_${i + 1}`;

      let questions: QuizQuestion[] = [];
      let content = '';

      if (stepType === 'quiz' || stepType === 'challenge') {
        // Générer des questions avec l'IA
        questions = await this.generateQuestionsForStep(topic.name, difficulty, stepType === 'challenge' ? 5 : 3);
      } else if (stepType === 'lesson') {
        content = await this.generateLessonContent(topic.name, difficulty);
      }

      const step: QuizStep = {
        id: stepId,
        pathId,
        stepNumber: i + 1,
        type: stepType,
        title: `${stepType === 'lesson' ? 'Leçon' : stepType === 'quiz' ? 'Quiz' : 'Défi'} ${i + 1}: ${topic.name}`,
        content: stepType === 'lesson' ? content : undefined,
        questions: questions.length > 0 ? questions : undefined,
        isCompleted: false,
        attempts: 0,
        maxAttempts: stepType === 'challenge' ? 3 : 5,
        pointsReward: this.calculatePointsReward(stepType, difficulty)
      };

      await setDoc(doc(db, 'quiz_steps', stepId), step);
    }
  }

  /**
   * Génère des questions pour une étape spécifique
   */
  private async generateQuestionsForStep(topic: string, difficulty: string, questionCount: number): Promise<QuizQuestion[]> {
    const questions: QuizQuestion[] = [];

    for (let i = 0; i < questionCount; i++) {
      try {
        const question = await resilientAIService.generateQuestion({
          competenceId: topic.toLowerCase().replace(/\s+/g, '_'),
          userId: 'system',
          userLevel: difficulty === 'beginner' ? 1 : difficulty === 'intermediate' ? 2 : 3,
          learningStyle: 'Visual',
          language: 'fr'
        });

        questions.push(question);
      } catch (error) {
        logger.warn('Failed to generate question, using fallback', {
          action: 'generate_question_fallback',
          context: { topic, questionIndex: i }
        });
        
        // Question de fallback
        questions.push({
          question: `Question sur ${topic} (niveau ${difficulty})`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 0,
          explanation: `Cette question porte sur les concepts de base de ${topic}.`
        });
      }
    }

    return questions;
  }

  /**
   * Génère le contenu d'une leçon
   */
  private async generateLessonContent(topic: string, difficulty: string): Promise<string> {
    // Pour l'instant, contenu simple. Peut être amélioré avec l'IA plus tard
    return `# Introduction à ${topic}\n\nCette leçon vous introduit aux concepts fondamentaux de ${topic}.\n\n## Objectifs d'apprentissage\n- Comprendre les bases\n- Appliquer les concepts\n- Développer vos compétences\n\nNiveau: ${difficulty}`;
  }

  /**
   * Obtient le défi quotidien pour un utilisateur
   */
  async getDailyChallenge(userId: string): Promise<DailyQuizChallenge | null> {
    try {
      if (!db) throw new Error('Firestore not initialized');

      const today = new Date().toISOString().split('T')[0];
      
      // Chercher le défi existant pour aujourd'hui
      const challengeQuery = query(
        collection(db, 'daily_challenges'),
        where('userId', '==', userId),
        where('date', '==', today),
        limit(1)
      );

      const challengeSnapshot = await getDocs(challengeQuery);
      
      if (!challengeSnapshot.empty) {
        const challengeData = challengeSnapshot.docs[0].data() as DailyQuizChallenge;
        return challengeData;
      }

      // Si pas de défi pour aujourd'hui, en créer un nouveau
      return await this.createDailyChallenge(userId, today);
    } catch (error) {
      logger.error('Failed to get daily challenge', {
        action: 'get_daily_challenge',
        error: error instanceof Error ? error.message : String(error),
        context: { userId }
      });
      return null;
    }
  }

  /**
   * Crée un nouveau défi quotidien
   */
  private async createDailyChallenge(userId: string, date: string): Promise<DailyQuizChallenge> {
    if (!db) throw new Error('Firestore not initialized');

    // Obtenir les parcours actifs de l'utilisateur
    const userPaths = await this.getUserActivePaths(userId);
    
    if (userPaths.length === 0) {
      // Créer un premier parcours pour l'utilisateur
      const user = await this.getUserData(userId);
      const userSkills = user ? Object.keys(user.competences) : [];
      const newPath = await this.generateDynamicQuizPath(userId, userSkills, 'beginner');
      userPaths.push(newPath);
    }

    // Sélectionner un parcours et une étape
    const selectedPath = userPaths[Math.floor(Math.random() * userPaths.length)];
    const availableSteps = await this.getAvailableSteps(selectedPath.id, userId);
    
    if (availableSteps.length === 0) {
      // Générer de nouvelles étapes si nécessaire
      await this.generateNextSteps(selectedPath.id, userId);
      const newSteps = await this.getAvailableSteps(selectedPath.id, userId);
      if (newSteps.length === 0) {
        throw new Error('No available steps for daily challenge');
      }
      availableSteps.push(...newSteps);
    }

    const selectedStep = availableSteps[0];
    
    // Calculer le streak
    const streakCount = await this.calculateUserStreak(userId);

    const dailyChallenge: DailyQuizChallenge = {
      id: `daily_${date}_${userId}`,
      date,
      userId,
      pathId: selectedPath.id,
      stepId: selectedStep.id,
      isCompleted: false,
      streakCount,
      bonusPointsEarned: 0
    };

    await setDoc(doc(db, 'daily_challenges', dailyChallenge.id), dailyChallenge);
    
    return dailyChallenge;
  }

  /**
   * Marque un défi quotidien comme terminé
   */
  async completeDailyChallenge(challengeId: string, score: number): Promise<void> {
    try {
      if (!db) throw new Error('Firestore not initialized');

      const bonusPoints = this.calculateBonusPoints(score);
      
      await updateDoc(doc(db, 'daily_challenges', challengeId), {
        isCompleted: true,
        completedAt: Timestamp.now(),
        score,
        bonusPointsEarned: bonusPoints
      });

      logger.info('Daily challenge completed', {
        action: 'complete_daily_challenge',
        context: { challengeId, score, bonusPoints }
      });
    } catch (error) {
      logger.error('Failed to complete daily challenge', {
        action: 'complete_daily_challenge',
        error: error instanceof Error ? error.message : String(error),
        context: { challengeId }
      });
      throw error;
    }
  }

  // Méthodes utilitaires privées

  private async determineNextTopic(userId: string, userSkills: string[]): Promise<any> {
    // Logique simple pour déterminer le prochain sujet
    // Peut être améliorée avec de l'IA plus sophistiquée
    const topics = [
      { name: 'JavaScript Avancé', category: 'programming', prerequisites: ['javascript_basics'], tags: ['js', 'advanced'] },
      { name: 'React Hooks', category: 'frontend', prerequisites: ['react_basics'], tags: ['react', 'hooks'] },
      { name: 'Node.js APIs', category: 'backend', prerequisites: ['nodejs_basics'], tags: ['nodejs', 'api'] },
      { name: 'Database Design', category: 'database', prerequisites: [], tags: ['sql', 'design'] },
      { name: 'Cybersécurité', category: 'security', prerequisites: [], tags: ['security', 'cyber'] }
    ];

    return topics[Math.floor(Math.random() * topics.length)];
  }

  private calculateEstimatedDuration(difficulty: string): number {
    return difficulty === 'beginner' ? 30 : difficulty === 'intermediate' ? 45 : 60;
  }

  private calculateTotalSteps(difficulty: string): number {
    return difficulty === 'beginner' ? 5 : difficulty === 'intermediate' ? 8 : 12;
  }

  private calculatePointsReward(stepType: string, difficulty: string): number {
    const basePoints = stepType === 'lesson' ? 10 : stepType === 'quiz' ? 20 : 30;
    const multiplier = difficulty === 'beginner' ? 1 : difficulty === 'intermediate' ? 1.5 : 2;
    return Math.floor(basePoints * multiplier);
  }

  private calculateBonusPoints(score: number): number {
    if (score >= 90) return 50;
    if (score >= 80) return 30;
    if (score >= 70) return 20;
    return 10;
  }

  private async getUserActivePaths(userId: string): Promise<QuizPath[]> {
    if (!db) return [];

    try {
      const pathsQuery = query(
        collection(db, 'quiz_paths'),
        where('isCompleted', '==', false),
        orderBy('unlockDate', 'desc')
      );

      const snapshot = await getDocs(pathsQuery);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        unlockDate: doc.data().unlockDate.toDate()
      })) as QuizPath[];
    } catch (error) {
      logger.error('Failed to get user active paths', {
        action: 'get_user_active_paths',
        error: error instanceof Error ? error.message : String(error),
        context: { userId }
      });
      return [];
    }
  }

  private async getAvailableSteps(pathId: string, userId: string): Promise<QuizStep[]> {
    if (!db) return [];

    try {
      const stepsQuery = query(
        collection(db, 'quiz_steps'),
        where('pathId', '==', pathId),
        where('isCompleted', '==', false),
        orderBy('stepNumber', 'asc'),
        limit(3)
      );

      const snapshot = await getDocs(stepsQuery);
      return snapshot.docs.map(doc => doc.data()) as QuizStep[];
    } catch (error) {
      logger.error('Failed to get available steps', {
        action: 'get_available_steps',
        error: error instanceof Error ? error.message : String(error),
        context: { pathId }
      });
      return [];
    }
  }

  private async generateNextSteps(pathId: string, userId: string): Promise<void> {
    // Logique pour générer de nouvelles étapes dynamiquement
    logger.info('Generating next steps for path', {
      action: 'generate_next_steps',
      context: { pathId, userId }
    });
    // Implémentation à compléter selon les besoins
  }

  private async calculateUserStreak(userId: string): Promise<number> {
    if (!db) return 0;

    try {
      // Calculer le streak en vérifiant les défis des jours précédents
      const challengesQuery = query(
        collection(db, 'daily_challenges'),
        where('userId', '==', userId),
        where('isCompleted', '==', true),
        orderBy('date', 'desc'),
        limit(30)
      );

      const snapshot = await getDocs(challengesQuery);
      let streak = 0;
      const today = new Date();

      for (const doc of snapshot.docs) {
        const challengeDate = new Date(doc.data().date);
        const daysDiff = Math.floor((today.getTime() - challengeDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === streak) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      logger.error('Failed to calculate user streak', {
        action: 'calculate_user_streak',
        error: error instanceof Error ? error.message : String(error),
        context: { userId }
      });
      return 0;
    }
  }

  private async getUserData(userId: string): Promise<User | null> {
    if (!db) return null;

    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.exists() ? userDoc.data() as User : null;
    } catch (error) {
      logger.error('Failed to get user data', {
        action: 'get_user_data',
        error: error instanceof Error ? error.message : String(error),
        context: { userId }
      });
      return null;
    }
  }
}

// Export de l'instance singleton
export const quizPathService = QuizPathService.getInstance();