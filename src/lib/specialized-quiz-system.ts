import type { User, Skill } from '@/lib/types';
import type { QuizValidationResult } from '@/lib/quiz-system';
import type { GenerateSpecializedQuizzesInput, GenerateSpecializedQuizzesOutput } from '@/ai/flows/generate-specialized-quizzes';

export interface SpecializedQuiz {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  difficulty: 'intermediate' | 'advanced' | 'expert';
  estimatedTime: number;
  prerequisites: string[];
  cost: number;
  unlockMessage: string;
  specialization: {
    domain: string;
    depth: string;
    practicalApplications: string[];
    nextSteps: string[];
  };
  position?: { x: number; y: number };
  isNew?: boolean;
  unlockedAt?: Date;
}

export interface QuizProgression {
  userId: string;
  completedSkillId: string;
  specializedQuizzes: SpecializedQuiz[];
  progressionRationale: string;
  unlockCelebration: {
    title: string;
    message: string;
    motivationalQuote: string;
  };
  createdAt: Date;
  status: 'generated' | 'presented' | 'in_progress' | 'completed';
}

export interface SkillTreeExpansion {
  newSkills: Skill[];
  expansionReason: string;
  parentSkillId: string;
  createdAt: Date;
}

/**
 * Service de gestion des quiz spécialisés et progression de l'arbre de compétences
 */
export class SpecializedQuizManager {
  private static instance: SpecializedQuizManager;
  private progressions: Map<string, QuizProgression[]> = new Map();
  private skillTreeExpansions: Map<string, SkillTreeExpansion[]> = new Map();

  static getInstance(): SpecializedQuizManager {
    if (!SpecializedQuizManager.instance) {
      SpecializedQuizManager.instance = new SpecializedQuizManager();
    }
    return SpecializedQuizManager.instance;
  }

  /**
   * Génère automatiquement 3 quiz spécialisés après completion réussie
   */
  async generateProgressionAfterSuccess(
    user: User,
    completedSkill: Skill,
    validationResult: QuizValidationResult
  ): Promise<QuizProgression | null> {
    try {
      console.log(`Generating specialized quizzes for user ${user.id} after completing ${completedSkill.id}`);

      // Ne générer que si la validation est réussie avec un bon score
      if (!validationResult.isValidated || validationResult.validationScore < 70) {
        console.log('Quiz validation not sufficient for progression generation');
        return null;
      }

      // Éviter les duplicatas
      const existingProgressions = this.getUserProgressions(user.id);
      const alreadyGenerated = existingProgressions.some(p => p.completedSkillId === completedSkill.id);
      
      if (alreadyGenerated) {
        console.log('Specialized quizzes already generated for this skill');
        return existingProgressions.find(p => p.completedSkillId === completedSkill.id) || null;
      }
      
      // Importer et utiliser le flow IA
      const { generateSpecializedQuizzes } = await import('@/ai/flows/generate-specialized-quizzes');
      
      const input: GenerateSpecializedQuizzesInput = {
        completedSkillId: completedSkill.id,
        userId: user.id,
        userLevel: user.profile.level,
        userPreferences: {
          learningStyle: user.preferences.learningStyle,
          favoriteTopics: user.preferences.favoriteTopics,
          language: user.preferences.language
        },
        completedSkillDetails: {
          name: completedSkill.name,
          category: completedSkill.category,
          description: completedSkill.description
        }
      };

      const result = await generateSpecializedQuizzes(input);
      
      // Convertir en format interne et calculer positions
      const specializedQuizzes = result.specializedQuizzes.map((quiz, index) => 
        this.convertToSpecializedQuiz(quiz, completedSkill, index)
      );

      // Créer la progression
      const progression: QuizProgression = {
        userId: user.id,
        completedSkillId: completedSkill.id,
        specializedQuizzes,
        progressionRationale: result.progressionRationale,
        unlockCelebration: result.unlockCelebration,
        createdAt: new Date(),
        status: 'generated'
      };

      // Stocker la progression
      this.storeProgression(user.id, progression);

      // Étendre l'arbre de compétences
      await this.expandSkillTree(user, completedSkill, specializedQuizzes);

      console.log(`Generated ${specializedQuizzes.length} specialized quizzes for progression`);
      return progression;

    } catch (error) {
      console.error('Failed to generate specialized quizzes:', error);
      return null;
    }
  }

  /**
   * Convertit un quiz IA en SpecializedQuiz avec position calculée
   */
  private convertToSpecializedQuiz(
    aiQuiz: any, 
    parentSkill: Skill, 
    index: number
  ): SpecializedQuiz {
    // Calculer la position basée sur la position du parent
    const baseX = parentSkill.position.x;
    const baseY = parentSkill.position.y;
    
    // Disposition en éventail sous le skill parent
    const positions = [
      { x: baseX - 200, y: baseY + 150 }, // Gauche
      { x: baseX, y: baseY + 200 },       // Centre
      { x: baseX + 200, y: baseY + 150 }  // Droite
    ];

    return {
      id: aiQuiz.id || `${parentSkill.id}-spec-${index + 1}`,
      name: aiQuiz.name,
      description: aiQuiz.description,
      category: aiQuiz.category,
      icon: aiQuiz.icon,
      difficulty: aiQuiz.difficulty,
      estimatedTime: aiQuiz.estimatedTime,
      prerequisites: [parentSkill.id, ...aiQuiz.prerequisites],
      cost: aiQuiz.cost,
      unlockMessage: aiQuiz.unlockMessage,
      specialization: aiQuiz.specialization,
      position: positions[index] || { x: baseX, y: baseY + 150 },
      isNew: true,
      unlockedAt: new Date()
    };
  }

  /**
   * Étend l'arbre de compétences avec les nouveaux quiz
   */
  private async expandSkillTree(
    user: User, 
    parentSkill: Skill, 
    specializedQuizzes: SpecializedQuiz[]
  ): Promise<void> {
    try {
      // Convertir les quiz spécialisés en Skills
      const newSkills: Skill[] = specializedQuizzes.map(quiz => ({
        id: quiz.id,
        name: quiz.name,
        description: quiz.description,
        icon: quiz.icon,
        cost: quiz.cost,
        category: quiz.category,
        position: quiz.position!,
        prereqs: quiz.prerequisites,
        level: this.calculateSkillLevel(quiz.difficulty),
        isSecret: false
      }));

      // Créer l'expansion
      const expansion: SkillTreeExpansion = {
        newSkills,
        expansionReason: `Specialized progression after completing ${parentSkill.name}`,
        parentSkillId: parentSkill.id,
        createdAt: new Date()
      };

      // Stocker l'expansion
      const userExpansions = this.skillTreeExpansions.get(user.id) || [];
      userExpansions.push(expansion);
      this.skillTreeExpansions.set(user.id, userExpansions);

      console.log(`Expanded skill tree with ${newSkills.length} new specialized skills`);
    } catch (error) {
      console.error('Failed to expand skill tree:', error);
    }
  }

  /**
   * Calcule le niveau de skill basé sur la difficulté
   */
  private calculateSkillLevel(difficulty: string): number {
    switch (difficulty) {
      case 'intermediate': return 2;
      case 'advanced': return 3;
      case 'expert': return 4;
      default: return 2;
    }
  }

  /**
   * Stocke une progression pour un utilisateur
   */
  private storeProgression(userId: string, progression: QuizProgression): void {
    const userProgressions = this.progressions.get(userId) || [];
    userProgressions.push(progression);
    this.progressions.set(userId, userProgressions);
  }

  /**
   * Récupère les progressions d'un utilisateur
   */
  getUserProgressions(userId: string): QuizProgression[] {
    return this.progressions.get(userId) || [];
  }

  /**
   * Récupère la dernière progression générée
   */
  getLatestProgression(userId: string): QuizProgression | null {
    const progressions = this.getUserProgressions(userId);
    return progressions.length > 0 ? progressions[progressions.length - 1] : null;
  }

  /**
   * Marque une progression comme présentée à l'utilisateur
   */
  markProgressionAsPresented(userId: string, completedSkillId: string): void {
    const progressions = this.progressions.get(userId) || [];
    const progression = progressions.find(p => p.completedSkillId === completedSkillId);
    if (progression) {
      progression.status = 'presented';
    }
  }

  /**
   * Récupère les nouvelles compétences générées pour un utilisateur
   */
  getNewSkillsForUser(userId: string): Skill[] {
    const expansions = this.skillTreeExpansions.get(userId) || [];
    return expansions.flatMap(e => e.newSkills);
  }

  /**
   * Nettoie les anciennes progressions (garde les 10 plus récentes)
   */
  cleanup(): void {
    for (const [userId, progressions] of this.progressions.entries()) {
      if (progressions.length > 10) {
        const recent = progressions.slice(-10);
        this.progressions.set(userId, recent);
      }
    }

    for (const [userId, expansions] of this.skillTreeExpansions.entries()) {
      if (expansions.length > 5) {
        const recent = expansions.slice(-5);
        this.skillTreeExpansions.set(userId, recent);
      }
    }
  }

  /**
   * Statistiques sur les progressions
   */
  getProgressionStats(userId: string): {
    totalProgressions: number;
    specializedQuizzesUnlocked: number;
    newSkillsCreated: number;
    averageValidationScore: number;
  } {
    const progressions = this.getUserProgressions(userId);
    const newSkills = this.getNewSkillsForUser(userId);

    return {
      totalProgressions: progressions.length,
      specializedQuizzesUnlocked: progressions.reduce((sum, p) => sum + p.specializedQuizzes.length, 0),
      newSkillsCreated: newSkills.length,
      averageValidationScore: 0 // À implémenter si nécessaire
    };
  }
}

// Nettoie automatiquement toutes les 30 minutes
if (typeof window === 'undefined') { // Côté serveur seulement
  setInterval(() => {
    SpecializedQuizManager.getInstance().cleanup();
  }, 30 * 60 * 1000);
}

// Export singleton
export const specializedQuizManager = SpecializedQuizManager.getInstance();