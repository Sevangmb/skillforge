import type { Skill, User, QuizQuestion } from '@/lib/types';

export interface QuizConfig {
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questionTypes: QuestionType[];
  timeLimit: number;
  pointsMultiplier: number;
  aiValidation?: boolean;
  adaptiveMode?: boolean;
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching' | 'scenario';

export interface QuizSession {
  skillId: string;
  currentLevel: number;
  questionsAnswered: number;
  correctAnswers: number;
  streak: number;
  totalPoints: number;
  startTime: Date;
  sessionId?: string;
  responseTimes?: number[];
  difficultyProgression?: number[];
}

export interface QuizValidationResult {
  isValidated: boolean;
  validationScore: number;
  masteryLevel: string;
  feedback: string;
  nextRecommendations: {
    difficulty: number;
    questionCount: number;
    focusAreas: string[];
  };
}

export function calculateDifficulty(userLevel: number, skillLevel: number, aiMode: boolean = false): QuizConfig {
  const baseLevel = Math.max(userLevel, skillLevel);
  
  if (baseLevel <= 3) {
    return {
      difficulty: 'beginner',
      questionTypes: ['multiple_choice', 'true_false'],
      timeLimit: aiMode ? 60 : 45, // Plus de temps pour l'IA
      pointsMultiplier: 1,
      aiValidation: aiMode,
      adaptiveMode: aiMode
    };
  } else if (baseLevel <= 7) {
    return {
      difficulty: 'intermediate',
      questionTypes: ['multiple_choice', 'true_false', 'fill_blank'],
      timeLimit: aiMode ? 50 : 35,
      pointsMultiplier: 1.5,
      aiValidation: aiMode,
      adaptiveMode: aiMode
    };
  } else {
    return {
      difficulty: 'advanced',
      questionTypes: ['multiple_choice', 'true_false', 'fill_blank', 'scenario'],
      timeLimit: aiMode ? 40 : 25,
      pointsMultiplier: 2,
      aiValidation: aiMode,
      adaptiveMode: aiMode
    };
  }
}

export function calculatePoints(
  isCorrect: boolean,
  timeLeft: number,
  totalTime: number,
  streak: number,
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): number {
  if (!isCorrect) return 0;

  const basePoints = {
    beginner: 10,
    intermediate: 15,
    advanced: 20
  }[difficulty];

  // Bonus pour rapidité (jusqu'à 50% de bonus)
  const timeBonus = Math.max(0, (timeLeft / totalTime) * 0.5);
  
  // Bonus pour streak (jusqu'à 100% de bonus)
  const streakBonus = Math.min(streak * 0.2, 1.0);
  
  // Bonus pour difficulté
  const difficultyBonus = {
    beginner: 0,
    intermediate: 0.25,
    advanced: 0.5
  }[difficulty];

  const totalMultiplier = 1 + timeBonus + streakBonus + difficultyBonus;
  
  return Math.round(basePoints * totalMultiplier);
}

export function generateHints(question: QuizQuestion, skillLevel: number): string[] {
  const hints: string[] = [];
  
  // Plus le niveau est élevé, moins d'indices
  const maxHints = Math.max(1, 3 - skillLevel);
  
  if (question.explanation) {
    hints.push("💡 " + question.explanation);
  }
  
  if (question.options && question.options.length > 2) {
    // Éliminer une mauvaise réponse
    const wrongOptions = question.options.filter((_, index) => index !== question.correctAnswer);
    if (wrongOptions.length > 0) {
      const eliminated = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
      hints.push(`❌ "${eliminated}" n'est pas la bonne réponse`);
    }
  }
  
  if (skillLevel <= 2) {
    hints.push("🎯 Concentrez-vous sur les concepts de base");
  }
  
  return hints.slice(0, maxHints);
}

export function getQuestionFeedback(
  isCorrect: boolean,
  timeLeft: number,
  totalTime: number,
  streak: number
): { title: string; description: string; variant: 'default' | 'destructive' | 'success' } {
  if (isCorrect) {
    const timeRatio = timeLeft / totalTime;
    
    if (timeRatio > 0.7) {
      return {
        title: "Excellent ! 🚀",
        description: `Rapide et précis ! Streak: ${streak}`,
        variant: 'success'
      };
    } else if (timeRatio > 0.3) {
      return {
        title: "Bien joué ! 👍",
        description: `Bonne réponse ! Streak: ${streak}`,
        variant: 'success'
      };
    } else {
      return {
        title: "Correct ! ⏰",
        description: `Juste à temps ! Streak: ${streak}`,
        variant: 'success'
      };
    }
  } else {
    return {
      title: "Incorrect 😔",
      description: "Ne vous inquiétez pas, c'est en forgeant qu'on devient forgeron !",
      variant: 'destructive'
    };
  }
}

/**
 * Valide une session de quiz avec l'IA
 */
export async function validateQuizWithAI(
  user: User,
  skill: Skill,
  session: QuizSession
): Promise<QuizValidationResult> {
  try {
    // Import dynamique pour éviter les dépendances circulaires
    const { enhancedAIQuizSystem } = await import('@/lib/enhanced-ai-quiz');
    const validation = await enhancedAIQuizSystem.validateSessionWithAI(user, skill, session);
    
    const recommendations = enhancedAIQuizSystem.generateNextSessionRecommendations(user, skill, validation);
    
    return {
      isValidated: validation.isValidated,
      validationScore: Math.round(validation.confidenceScore * 100),
      masteryLevel: validation.skillMastery,
      feedback: validation.validationReason,
      nextRecommendations: {
        difficulty: validation.recommendedNextLevel,
        questionCount: recommendations.suggestedQuestionCount,
        focusAreas: recommendations.focusAreas
      }
    };
  } catch (error) {
    console.error('AI validation failed:', error);
    
    // Fallback vers validation simple
    const accuracy = session.correctAnswers / session.questionsAnswered;
    const isValidated = accuracy >= 0.7 && session.questionsAnswered >= 5;
    
    return {
      isValidated,
      validationScore: Math.round(accuracy * 100),
      masteryLevel: accuracy >= 0.9 ? 'expert' : accuracy >= 0.8 ? 'advanced' : 'intermediate',
      feedback: isValidated 
        ? `Excellent ! Score de ${Math.round(accuracy * 100)}% validé.`
        : `Score de ${Math.round(accuracy * 100)}% nécessite plus de pratique.`,
      nextRecommendations: {
        difficulty: isValidated ? user.competences[skill.id]?.level + 1 : user.competences[skill.id]?.level,
        questionCount: 8,
        focusAreas: [skill.category]
      }
    };
  }
}

/**
 * Génère une question adaptative avec l'IA
 */
export async function generateAdaptiveAIQuestion(
  user: User,
  skill: Skill,
  session: QuizSession,
  config: QuizConfig
): Promise<QuizQuestion> {
  try {
    if (config.adaptiveMode) {
      const { enhancedAIQuizSystem } = await import('@/lib/enhanced-ai-quiz');
      const enhancedQuestion = await enhancedAIQuizSystem.generateAdaptiveQuestion(user, skill, session, config);
      return enhancedQuestion;
    }
  } catch (error) {
    console.error('AI question generation failed:', error);
  }
  
  // Fallback vers génération standard
  const { generateQuizQuestionAction } = await import('@/app/actions');
  return await generateQuizQuestionAction({
    competenceId: skill.id,
    userId: user.id,
    userLevel: user.competences[skill.id]?.level || 0,
    learningStyle: user.preferences.learningStyle,
    language: 'fr'
  });
}

/**
 * Calcul de score IA avec pondération avancée
 */
export function calculateAIEnhancedPoints(
  isCorrect: boolean,
  timeLeft: number,
  totalTime: number,
  streak: number,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  difficultyScore?: number,
  consistencyBonus?: number
): number {
  const basePoints = calculatePoints(isCorrect, timeLeft, totalTime, streak, difficulty);
  
  if (!isCorrect) return 0;
  
  // Bonus pour difficulté IA
  let aiBonus = 0;
  if (difficultyScore) {
    aiBonus += (difficultyScore / 100) * 0.2; // Bonus jusqu'à 20%
  }
  
  // Bonus pour consistance IA
  if (consistencyBonus) {
    aiBonus += consistencyBonus * 0.15; // Bonus jusqu'à 15%
  }
  
  return Math.round(basePoints * (1 + aiBonus));
}