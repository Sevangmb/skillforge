import type { User, Skill, QuizQuestion } from '@/lib/types';
import type { QuizSession } from '@/lib/quiz-system';

export interface AIQuizValidation {
  isValidated: boolean;
  confidenceScore: number;
  skillMastery: SkillMasteryLevel;
  recommendedNextLevel: number;
  strengthAreas: string[];
  improvementAreas: string[];
  validationReason: string;
}

export type SkillMasteryLevel = 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface ValidationCriteria {
  minimumScore: number;
  minimumQuestions: number;
  consistencyThreshold: number;
  masteryIndicators: {
    speed: number;
    accuracy: number;
    difficulty: number;
  };
}

export interface AIQuizMetrics {
  totalQuestions: number;
  correctAnswers: number;
  averageResponseTime: number;
  difficultyProgression: number[];
  accuracyByDifficulty: Record<string, number>;
  streakRecord: number;
  timeEfficiency: number;
}

export class AIQuizValidator {
  private static instance: AIQuizValidator;

  static getInstance(): AIQuizValidator {
    if (!AIQuizValidator.instance) {
      AIQuizValidator.instance = new AIQuizValidator();
    }
    return AIQuizValidator.instance;
  }

  /**
   * Critères de validation intelligents basés sur le niveau de compétence
   */
  getValidationCriteria(skillLevel: number, difficulty: string): ValidationCriteria {
    const baseThresholds = {
      novice: { score: 60, questions: 3, consistency: 0.6 },
      beginner: { score: 70, questions: 5, consistency: 0.7 },
      intermediate: { score: 80, questions: 7, consistency: 0.8 },
      advanced: { score: 85, questions: 10, consistency: 0.85 },
      expert: { score: 90, questions: 12, consistency: 0.9 }
    };

    const level = this.getSkillMastery(skillLevel, difficulty);
    const threshold = baseThresholds[level];

    return {
      minimumScore: threshold.score,
      minimumQuestions: threshold.questions,
      consistencyThreshold: threshold.consistency,
      masteryIndicators: {
        speed: level === 'expert' ? 0.8 : level === 'advanced' ? 0.7 : 0.6,
        accuracy: threshold.score / 100,
        difficulty: level === 'expert' ? 0.9 : level === 'advanced' ? 0.8 : 0.7
      }
    };
  }

  /**
   * Calcul du score de validation IA avec pondération intelligente
   */
  calculateValidationScore(
    session: QuizSession,
    metrics: AIQuizMetrics,
    criteria: ValidationCriteria
  ): number {
    // Précision de base (40%)
    const accuracyScore = (session.correctAnswers / session.questionsAnswered) * 0.4;

    // Consistance dans le temps (25%)
    const consistencyScore = this.calculateConsistencyScore(metrics) * 0.25;

    // Progression de difficulté (20%)
    const difficultyScore = this.calculateDifficultyProgressionScore(metrics) * 0.2;

    // Efficacité temporelle (15%)
    const timeEfficiencyScore = Math.min(metrics.timeEfficiency, 1.0) * 0.15;

    const totalScore = accuracyScore + consistencyScore + difficultyScore + timeEfficiencyScore;
    
    return Math.round(totalScore * 100);
  }

  /**
   * Validation IA complète d'une session de quiz
   */
  async validateQuizSession(
    user: User,
    skill: Skill,
    session: QuizSession,
    recentSessions: QuizSession[] = []
  ): Promise<AIQuizValidation> {
    const skillLevel = user.competences[skill.id]?.level || 0;
    const difficulty = skillLevel <= 3 ? 'beginner' : skillLevel <= 7 ? 'intermediate' : 'advanced';
    
    const criteria = this.getValidationCriteria(skillLevel, difficulty);
    const metrics = this.calculateMetrics(session, recentSessions);
    const validationScore = this.calculateValidationScore(session, metrics, criteria);

    // Analyse des forces et faiblesses
    const analysis = this.analyzePerformance(session, metrics, skill);

    // Détermination du niveau de maîtrise
    const masteryLevel = this.determineMasteryLevel(validationScore, metrics, criteria);

    // Calcul de la confiance
    const confidenceScore = this.calculateConfidenceScore(session, metrics, criteria);

    // Décision de validation
    const isValidated = this.makeValidationDecision(validationScore, session, criteria, metrics);

    return {
      isValidated,
      confidenceScore,
      skillMastery: masteryLevel,
      recommendedNextLevel: isValidated ? skillLevel + 1 : skillLevel,
      strengthAreas: analysis.strengths,
      improvementAreas: analysis.weaknesses,
      validationReason: this.generateValidationReason(
        isValidated,
        validationScore,
        session,
        metrics,
        criteria
      )
    };
  }

  private calculateMetrics(session: QuizSession, recentSessions: QuizSession[]): AIQuizMetrics {
    const allSessions = [session, ...recentSessions];
    
    const totalQuestions = allSessions.reduce((sum, s) => sum + s.questionsAnswered, 0);
    const totalCorrect = allSessions.reduce((sum, s) => sum + s.correctAnswers, 0);
    
    // Calcul de l'efficacité temporelle (temps restant moyen)
    const sessionDuration = new Date().getTime() - session.startTime.getTime();
    const expectedTime = session.questionsAnswered * 30000; // 30s par question
    const timeEfficiency = Math.max(0, 1 - (sessionDuration / expectedTime));

    return {
      totalQuestions,
      correctAnswers: totalCorrect,
      averageResponseTime: sessionDuration / session.questionsAnswered,
      difficultyProgression: allSessions.map(s => s.currentLevel),
      accuracyByDifficulty: this.calculateAccuracyByDifficulty(allSessions),
      streakRecord: Math.max(...allSessions.map(s => s.streak)),
      timeEfficiency
    };
  }

  private calculateConsistencyScore(metrics: AIQuizMetrics): number {
    if (metrics.totalQuestions < 3) return 0.5;

    // Variance de précision sur les sessions
    const accuracy = metrics.correctAnswers / metrics.totalQuestions;
    const difficultyVariance = this.calculateVariance(metrics.difficultyProgression);
    
    // Score de consistance basé sur la régularité des performances
    return Math.max(0, 1 - (difficultyVariance * 0.3));
  }

  private calculateDifficultyProgressionScore(metrics: AIQuizMetrics): number {
    const progression = metrics.difficultyProgression;
    if (progression.length < 2) return 0.5;

    // Évalue si l'utilisateur progresse vers des niveaux plus difficiles
    const trend = this.calculateTrend(progression);
    return Math.max(0, Math.min(1, 0.5 + (trend * 0.5)));
  }

  private calculateAccuracyByDifficulty(sessions: QuizSession[]): Record<string, number> {
    const groups = {
      beginner: { correct: 0, total: 0 },
      intermediate: { correct: 0, total: 0 },
      advanced: { correct: 0, total: 0 }
    };

    sessions.forEach(session => {
      const difficulty = session.currentLevel <= 3 ? 'beginner' : 
                        session.currentLevel <= 7 ? 'intermediate' : 'advanced';
      
      groups[difficulty].correct += session.correctAnswers;
      groups[difficulty].total += session.questionsAnswered;
    });

    return {
      beginner: groups.beginner.total > 0 ? groups.beginner.correct / groups.beginner.total : 0,
      intermediate: groups.intermediate.total > 0 ? groups.intermediate.correct / groups.intermediate.total : 0,
      advanced: groups.advanced.total > 0 ? groups.advanced.correct / groups.advanced.total : 0
    };
  }

  private analyzePerformance(
    session: QuizSession, 
    metrics: AIQuizMetrics, 
    skill: Skill
  ): { strengths: string[], weaknesses: string[] } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    const accuracy = session.correctAnswers / session.questionsAnswered;
    
    // Analyse des forces
    if (accuracy >= 0.9) strengths.push('Excellente précision');
    if (session.streak >= 5) strengths.push('Forte consistance');
    if (metrics.timeEfficiency >= 0.8) strengths.push('Rapidité d\'exécution');
    if (metrics.streakRecord >= 10) strengths.push('Endurance mentale');

    // Analyse des faiblesses
    if (accuracy < 0.7) weaknesses.push('Précision à améliorer');
    if (session.streak <= 2) weaknesses.push('Consistance variable');
    if (metrics.timeEfficiency < 0.5) weaknesses.push('Gestion du temps');
    if (session.questionsAnswered < 5) weaknesses.push('Volume de pratique insuffisant');

    // Analyse spécifique par catégorie de compétence
    const categoryWeakness = this.analyzeCategorySpecific(skill.category, accuracy);
    if (categoryWeakness) weaknesses.push(categoryWeakness);

    return { strengths, weaknesses };
  }

  private analyzeCategorySpecific(category: string, accuracy: number): string | null {
    const categoryThresholds = {
      'frontend': 0.75,
      'backend': 0.8,
      'database': 0.85,
      'devops': 0.8,
      'security': 0.9
    };

    const threshold = categoryThresholds[category as keyof typeof categoryThresholds] || 0.75;
    
    if (accuracy < threshold) {
      return `Maîtrise ${category} nécessite plus de pratique`;
    }
    
    return null;
  }

  private determineMasteryLevel(
    score: number, 
    metrics: AIQuizMetrics, 
    criteria: ValidationCriteria
  ): SkillMasteryLevel {
    if (score >= 90 && metrics.streakRecord >= 10 && metrics.timeEfficiency >= 0.8) {
      return 'expert';
    } else if (score >= 85 && metrics.streakRecord >= 7) {
      return 'advanced';
    } else if (score >= 75 && metrics.streakRecord >= 5) {
      return 'intermediate';
    } else if (score >= 65) {
      return 'beginner';
    } else {
      return 'novice';
    }
  }

  private calculateConfidenceScore(
    session: QuizSession, 
    metrics: AIQuizMetrics, 
    criteria: ValidationCriteria
  ): number {
    let confidence = 0.5; // Base confidence

    // Facteurs augmentant la confiance
    if (session.questionsAnswered >= criteria.minimumQuestions) confidence += 0.2;
    if (metrics.totalQuestions >= 10) confidence += 0.1;
    if (metrics.streakRecord >= 5) confidence += 0.1;
    if (metrics.timeEfficiency >= 0.7) confidence += 0.1;

    return Math.min(1.0, confidence);
  }

  private makeValidationDecision(
    score: number,
    session: QuizSession,
    criteria: ValidationCriteria,
    metrics: AIQuizMetrics
  ): boolean {
    // Critères de base
    const meetsScoreThreshold = score >= criteria.minimumScore;
    const meetsQuestionThreshold = session.questionsAnswered >= criteria.minimumQuestions;
    const meetsConsistencyThreshold = metrics.streakRecord >= 3;

    // Critères avancés
    const hasGoodTimeManagement = metrics.timeEfficiency >= 0.5;
    const showsProgression = metrics.difficultyProgression.length >= 2;

    return meetsScoreThreshold && 
           meetsQuestionThreshold && 
           meetsConsistencyThreshold &&
           hasGoodTimeManagement;
  }

  private generateValidationReason(
    isValidated: boolean,
    score: number,
    session: QuizSession,
    metrics: AIQuizMetrics,
    criteria: ValidationCriteria
  ): string {
    if (isValidated) {
      const reasons = [];
      
      if (score >= 90) reasons.push('score exceptionnel');
      else if (score >= 80) reasons.push('très bonne performance');
      else reasons.push('performance satisfaisante');

      if (session.streak >= 7) reasons.push('excellente consistance');
      if (metrics.timeEfficiency >= 0.8) reasons.push('gestion du temps optimale');
      
      return `Validation réussie : ${reasons.join(', ')}. Prêt pour le niveau suivant !`;
    } else {
      const issues = [];
      
      if (score < criteria.minimumScore) {
        issues.push(`score insuffisant (${score}% vs ${criteria.minimumScore}% requis)`);
      }
      if (session.questionsAnswered < criteria.minimumQuestions) {
        issues.push(`questions insuffisantes (${session.questionsAnswered} vs ${criteria.minimumQuestions} requises)`);
      }
      if (metrics.timeEfficiency < 0.5) {
        issues.push('gestion du temps à améliorer');
      }

      return `Validation échouée : ${issues.join(', ')}. Continuez la pratique pour vous améliorer.`;
    }
  }

  private getSkillMastery(skillLevel: number, difficulty: string): SkillMasteryLevel {
    if (skillLevel >= 9) return 'expert';
    if (skillLevel >= 7) return 'advanced';
    if (skillLevel >= 5) return 'intermediate';
    if (skillLevel >= 2) return 'beginner';
    return 'novice';
  }

  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance);
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    let trend = 0;
    for (let i = 1; i < values.length; i++) {
      trend += values[i] - values[i - 1];
    }
    
    return trend / (values.length - 1);
  }
}

// Export singleton instance
export const aiQuizValidator = AIQuizValidator.getInstance();