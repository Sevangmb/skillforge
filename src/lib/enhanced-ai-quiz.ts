import type { User, Skill, QuizQuestion } from '@/lib/types';
import type { QuizSession, QuizConfig } from '@/lib/quiz-system';
import type { AIQuizValidation, AIQuizMetrics } from '@/lib/ai-quiz-validator';
import { aiQuizValidator } from '@/lib/ai-quiz-validator';
import { generateQuizQuestionAction } from '@/app/actions';

export interface EnhancedQuizQuestion extends QuizQuestion {
  difficultyScore: number;
  conceptTags: string[];
  adaptiveHints: string[];
  followUpQuestions?: string[];
  estimatedTime: number;
  masteryIndicators: string[];
}

export interface AIQuizPersonalization {
  preferredQuestionTypes: string[];
  difficultyPreference: 'adaptive' | 'challenging' | 'comfortable';
  learningFocus: string[];
  weaknessTargeting: boolean;
  contextualHints: boolean;
}

export interface QuizAdaptationStrategy {
  nextDifficulty: number;
  questionType: string;
  focusAreas: string[];
  hintLevel: number;
  timeAllocation: number;
}

export class EnhancedAIQuizSystem {
  private static instance: EnhancedAIQuizSystem;
  private quizHistory: Map<string, QuizSession[]> = new Map();
  private userAdaptations: Map<string, AIQuizPersonalization> = new Map();

  static getInstance(): EnhancedAIQuizSystem {
    if (!EnhancedAIQuizSystem.instance) {
      EnhancedAIQuizSystem.instance = new EnhancedAIQuizSystem();
    }
    return EnhancedAIQuizSystem.instance;
  }

  /**
   * Génère une question adaptée avec IA contextuelle
   */
  async generateAdaptiveQuestion(
    user: User,
    skill: Skill,
    session: QuizSession,
    config: QuizConfig
  ): Promise<EnhancedQuizQuestion> {
    // Obtenir l'historique et les préférences
    const history = this.getQuizHistory(user.id, skill.id);
    const adaptation = this.getUserAdaptation(user.id);
    const strategy = this.calculateAdaptationStrategy(user, skill, session, history, adaptation);

    // Générer la question de base
    const baseQuestion = await generateQuizQuestionAction({
      competenceId: skill.id,
      userId: user.id,
      userLevel: strategy.nextDifficulty,
      learningStyle: user.preferences.learningStyle,
      language: 'fr'
    });

    // Enrichir la question avec l'IA
    return this.enhanceQuestion(baseQuestion, strategy, skill, user);
  }

  /**
   * Calcule la stratégie d'adaptation basée sur les performances
   */
  private calculateAdaptationStrategy(
    user: User,
    skill: Skill,
    session: QuizSession,
    history: QuizSession[],
    adaptation: AIQuizPersonalization
  ): QuizAdaptationStrategy {
    const skillLevel = user.competences[skill.id]?.level || 0;
    const accuracy = history.length > 0 
      ? history.reduce((sum, s) => sum + s.correctAnswers, 0) / history.reduce((sum, s) => sum + s.questionsAnswered, 0)
      : session.correctAnswers / session.questionsAnswered;

    // Adaptation de difficulté
    let nextDifficulty = skillLevel;
    if (adaptation.difficultyPreference === 'adaptive') {
      if (accuracy >= 0.8 && session.streak >= 3) {
        nextDifficulty = Math.min(10, skillLevel + 1);
      } else if (accuracy < 0.6) {
        nextDifficulty = Math.max(1, skillLevel - 1);
      }
    } else if (adaptation.difficultyPreference === 'challenging') {
      nextDifficulty = Math.min(10, skillLevel + 2);
    }

    // Type de question adaptatif
    const questionType = this.selectOptimalQuestionType(adaptation, session, history);

    // Zones de focus basées sur les faiblesses
    const focusAreas = adaptation.weaknessTargeting 
      ? this.identifyWeakAreas(history, skill)
      : [skill.category];

    // Niveau d'aide contextuelle
    const hintLevel = adaptation.contextualHints 
      ? this.calculateHintLevel(accuracy, session.streak)
      : 1;

    // Allocation de temps dynamique
    const timeAllocation = this.calculateTimeAllocation(nextDifficulty, questionType, user);

    return {
      nextDifficulty,
      questionType,
      focusAreas,
      hintLevel,
      timeAllocation
    };
  }

  /**
   * Enrichit une question avec des métadonnées IA
   */
  private enhanceQuestion(
    baseQuestion: QuizQuestion,
    strategy: QuizAdaptationStrategy,
    skill: Skill,
    user: User
  ): EnhancedQuizQuestion {
    const difficultyScore = this.calculateDifficultyScore(baseQuestion, strategy.nextDifficulty);
    const conceptTags = this.extractConceptTags(baseQuestion, skill);
    const adaptiveHints = this.generateAdaptiveHints(baseQuestion, strategy.hintLevel, user);
    const masteryIndicators = this.identifyMasteryIndicators(baseQuestion, skill);

    return {
      ...baseQuestion,
      difficultyScore,
      conceptTags,
      adaptiveHints,
      estimatedTime: strategy.timeAllocation,
      masteryIndicators,
      followUpQuestions: this.generateFollowUpQuestions(baseQuestion, strategy.focusAreas)
    };
  }

  /**
   * Valide une session avec le système IA
   */
  async validateSessionWithAI(
    user: User,
    skill: Skill,
    session: QuizSession
  ): Promise<AIQuizValidation> {
    const history = this.getQuizHistory(user.id, skill.id);
    const validation = await aiQuizValidator.validateQuizSession(user, skill, session, history);
    
    // Mettre à jour l'historique
    this.updateQuizHistory(user.id, skill.id, session);
    
    // Adapter les préférences utilisateur basées sur les résultats
    this.updateUserAdaptation(user.id, session, validation);

    return validation;
  }

  /**
   * Génère des recommandations pour la prochaine session
   */
  generateNextSessionRecommendations(
    user: User,
    skill: Skill,
    validation: AIQuizValidation
  ): {
    recommendedDuration: number;
    suggestedQuestionCount: number;
    focusAreas: string[];
    difficultyAdjustment: string;
    studyTips: string[];
  } {
    const skillLevel = user.competences[skill.id]?.level || 0;
    
    const recommendations = {
      recommendedDuration: validation.skillMastery === 'expert' ? 15 : 
                           validation.skillMastery === 'advanced' ? 20 : 25,
      
      suggestedQuestionCount: validation.isValidated ? 
        Math.min(15, skillLevel + 5) : Math.max(5, skillLevel + 2),
      
      focusAreas: validation.improvementAreas.length > 0 ? 
        validation.improvementAreas : [skill.category],
      
      difficultyAdjustment: validation.isValidated ? 
        'Augmenter légèrement la difficulté' : 
        'Maintenir le niveau actuel',
      
      studyTips: this.generateStudyTips(validation, skill, user)
    };

    return recommendations;
  }

  // Helper methods
  private getQuizHistory(userId: string, skillId: string): QuizSession[] {
    const key = `${userId}-${skillId}`;
    return this.quizHistory.get(key) || [];
  }

  private updateQuizHistory(userId: string, skillId: string, session: QuizSession): void {
    const key = `${userId}-${skillId}`;
    const history = this.getQuizHistory(userId, skillId);
    history.push(session);
    
    // Garder seulement les 20 dernières sessions
    if (history.length > 20) {
      history.shift();
    }
    
    this.quizHistory.set(key, history);
  }

  private getUserAdaptation(userId: string): AIQuizPersonalization {
    return this.userAdaptations.get(userId) || {
      preferredQuestionTypes: ['multiple_choice', 'true_false'],
      difficultyPreference: 'adaptive',
      learningFocus: [],
      weaknessTargeting: true,
      contextualHints: true
    };
  }

  private updateUserAdaptation(
    userId: string, 
    session: QuizSession, 
    validation: AIQuizValidation
  ): void {
    const current = this.getUserAdaptation(userId);
    
    // Adapter les préférences basées sur les performances
    if (validation.confidenceScore > 0.8) {
      current.difficultyPreference = 'challenging';
    } else if (validation.confidenceScore < 0.5) {
      current.difficultyPreference = 'comfortable';
    }

    // Cibler les faiblesses si nécessaire
    current.weaknessTargeting = validation.improvementAreas.length > 0;
    current.learningFocus = validation.strengthAreas;

    this.userAdaptations.set(userId, current);
  }

  private selectOptimalQuestionType(
    adaptation: AIQuizPersonalization,
    session: QuizSession,
    history: QuizSession[]
  ): string {
    // Logique de sélection intelligente du type de question
    const accuracy = session.correctAnswers / session.questionsAnswered;
    
    if (accuracy >= 0.9) {
      return 'scenario'; // Questions plus complexes pour les performants
    } else if (accuracy >= 0.7) {
      return 'fill_blank'; // Questions intermédiaires
    } else {
      return 'multiple_choice'; // Questions plus simples pour consolider
    }
  }

  private identifyWeakAreas(history: QuizSession[], skill: Skill): string[] {
    // Analyser l'historique pour identifier les zones faibles
    const weakAreas = [skill.category];
    
    const averageAccuracy = history.length > 0 
      ? history.reduce((sum, s) => sum + s.correctAnswers / s.questionsAnswered, 0) / history.length
      : 0;

    if (averageAccuracy < 0.7) {
      weakAreas.push('fundamentals');
    }

    return weakAreas;
  }

  private calculateHintLevel(accuracy: number, streak: number): number {
    if (accuracy >= 0.8 && streak >= 5) return 1; // Peu d'indices
    if (accuracy >= 0.6 && streak >= 3) return 2; // Indices modérés
    return 3; // Indices complets
  }

  private calculateTimeAllocation(difficulty: number, questionType: string, user: User): number {
    const baseTime = 30; // 30 secondes de base
    const difficultyMultiplier = 1 + (difficulty * 0.1);
    const typeMultiplier = questionType === 'scenario' ? 1.5 : 
                          questionType === 'fill_blank' ? 1.2 : 1.0;

    return Math.round(baseTime * difficultyMultiplier * typeMultiplier);
  }

  private calculateDifficultyScore(question: QuizQuestion, targetDifficulty: number): number {
    // Score de difficulté basé sur la complexité de la question
    let score = targetDifficulty * 10;
    
    if (question.options.length > 4) score += 5;
    if (question.question.length > 100) score += 10;
    
    return Math.min(100, score);
  }

  private extractConceptTags(question: QuizQuestion, skill: Skill): string[] {
    const tags = [skill.category];
    
    // Extraction simple de concepts basée sur le contenu
    if (question.question.toLowerCase().includes('function')) tags.push('functions');
    if (question.question.toLowerCase().includes('variable')) tags.push('variables');
    if (question.question.toLowerCase().includes('class')) tags.push('classes');
    
    return tags;
  }

  private generateAdaptiveHints(question: QuizQuestion, hintLevel: number, user: User): string[] {
    const hints = [];
    
    if (hintLevel >= 3) {
      hints.push(`💡 Conseil : ${question.explanation || 'Analysez attentivement chaque option'}`);
    }
    
    if (hintLevel >= 2 && question.options.length > 2) {
      const wrongOption = question.options.find((_, i) => i !== question.correctAnswer);
      if (wrongOption) {
        hints.push(`❌ "${wrongOption}" n'est probablement pas la bonne réponse`);
      }
    }
    
    if (hintLevel >= 1) {
      hints.push('🎯 Réfléchissez aux concepts fondamentaux');
    }

    return hints;
  }

  private identifyMasteryIndicators(question: QuizQuestion, skill: Skill): string[] {
    const indicators = [];
    
    // Indicateurs basés sur le skill
    indicators.push(`Maîtrise de ${skill.name}`);
    
    if (question.options.length > 4) {
      indicators.push('Discrimination fine entre concepts');
    }
    
    return indicators;
  }

  private generateFollowUpQuestions(question: QuizQuestion, focusAreas: string[]): string[] {
    return [
      `Comment appliquer ce concept dans ${focusAreas[0]} ?`,
      `Quelles sont les alternatives à cette approche ?`,
      `Dans quels cas cette solution ne serait pas optimale ?`
    ];
  }

  private generateStudyTips(
    validation: AIQuizValidation, 
    skill: Skill, 
    user: User
  ): string[] {
    const tips = [];
    
    if (!validation.isValidated) {
      tips.push(`Concentrez-vous sur ${validation.improvementAreas.join(' et ')}`);
      tips.push('Pratiquez régulièrement avec des questions plus simples');
    } else {
      tips.push('Excellent travail ! Explorez des concepts plus avancés');
      tips.push(`Vos forces en ${validation.strengthAreas.join(' et ')} vous aideront`);
    }
    
    if (validation.skillMastery === 'expert') {
      tips.push('Vous pourriez mentorer d\'autres apprenants sur ce sujet');
    }

    return tips;
  }
}

// Export singleton instance
export const enhancedAIQuizSystem = EnhancedAIQuizSystem.getInstance();