/**
 * Smart AI Learning Coach
 * Assistant IA personnalisé exploitant Analytics + Achievements pour coaching adaptatif temps réel
 */

import { logger } from './logger';
import { performanceMonitor } from './performance-monitor';
import type { 
  LearningMetrics, 
  LearningSession, 
  CategoryStats, 
  WeeklyData 
} from '../stores/useAppStore';
import type { SmartAchievement } from './smart-achievements';
import type { User, Skill } from './types';

// Types pour l'AI Learning Coach
export interface CoachInsight {
  id: string;
  type: CoachInsightType;
  category: CoachCategory;
  priority: CoachPriority;
  title: string;
  message: string;
  actionable: boolean;
  actions?: CoachAction[];
  timing: CoachTiming;
  context: CoachContext;
  validUntil: number; // timestamp
  seenAt?: number;
}

export type CoachInsightType = 
  | 'motivation_boost'      // Encouragement motivant
  | 'performance_tip'       // Conseil d'amélioration 
  | 'timing_optimization'   // Suggestion de timing
  | 'skill_focus'          // Recommandation de focus
  | 'habit_formation'      // Aide à la formation d'habitude
  | 'fatigue_detection'    // Détection de fatigue
  | 'achievement_nudge'    // Poussée vers achievement
  | 'learning_strategy'    // Stratégie d'apprentissage
  | 'social_encouragement' // Encouragement social
  | 'progress_celebration'; // Célébration des progrès

export type CoachCategory = 
  | 'engagement'     // Motivation et engagement
  | 'performance'    // Amélioration des performances
  | 'efficiency'     // Optimisation de l'efficacité
  | 'wellbeing'      // Bien-être dans l'apprentissage
  | 'strategy'       // Stratégies d'apprentissage
  | 'social';        // Aspects sociaux

export type CoachPriority = 'low' | 'medium' | 'high' | 'urgent';

export type CoachTiming = 
  | 'immediate'      // À afficher immédiatement
  | 'session_start'  // Début de session
  | 'session_end'    // Fin de session
  | 'daily_summary'  // Résumé quotidien
  | 'weekly_review'  // Révision hebdomadaire
  | 'idle_moment'    // Moment d'inactivité
  | 'optimal_window'; // Fenêtre optimale détectée

export interface CoachAction {
  id: string;
  label: string;
  type: 'navigate' | 'start_session' | 'take_break' | 'adjust_settings' | 'share' | 'dismiss';
  payload?: any;
  icon?: string;
}

export interface CoachContext {
  triggerMetrics: Record<string, number>;
  sessionState?: LearningSession;
  userState: UserLearningState;
  environmentalFactors: EnvironmentalFactors;
  historicalPatterns: HistoricalPatterns;
}

export interface UserLearningState {
  currentStreak: number;
  energyLevel: EnergyLevel; // Calculé algorithmiquement
  focusLevel: FocusLevel;   // Basé sur performance récente
  motivationLevel: MotivationLevel; // Basé sur patterns engagement
  learningVelocity: number;
  retentionRate: number;
  strugglingAreas: string[];
  strengthAreas: string[];
}

export type EnergyLevel = 'low' | 'medium' | 'high' | 'peak';
export type FocusLevel = 'distracted' | 'moderate' | 'focused' | 'deep_focus';
export type MotivationLevel = 'discouraged' | 'neutral' | 'motivated' | 'enthusiastic';

export interface EnvironmentalFactors {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: string;
  appPerformance: {
    loadTime: number;
    responsiveness: number;
  };
  recentAchievements: SmartAchievement[];
  sessionDuration: number;
  questionsAnswered: number;
}

export interface HistoricalPatterns {
  bestPerformanceTimeSlots: string[];
  averageSessionDuration: number;
  preferredCategories: string[];
  consistencyPattern: 'regular' | 'irregular' | 'weekend_warrior' | 'daily_habit';
  improvementTrend: 'improving' | 'stable' | 'declining';
}

// Templates d'insights contextuels
export const COACH_INSIGHT_TEMPLATES: Array<{
  id: string;
  conditions: (context: CoachContext) => boolean;
  generator: (context: CoachContext) => Omit<CoachInsight, 'id' | 'validUntil' | 'seenAt'>;
}> = [
  // Motivation Boosts
  {
    id: 'streak_celebration',
    conditions: (ctx) => ctx.userState.currentStreak >= 3 && ctx.userState.motivationLevel !== 'discouraged',
    generator: (ctx) => ({
      type: 'motivation_boost',
      category: 'engagement',
      priority: 'medium',
      title: 'Série Impressionnante ! 🔥',
      message: `Fantastique ! Tu maintiens une série de ${ctx.userState.currentStreak} jours. Continue sur cette lancée !`,
      actionable: true,
      actions: [
        { id: 'continue', label: 'Continuer l\'élan', type: 'start_session', icon: 'play' },
        { id: 'share', label: 'Partager ma série', type: 'share', icon: 'share' }
      ],
      timing: 'session_start',
      context: ctx
    })
  },

  // Performance Tips
  {
    id: 'accuracy_improvement',
    conditions: (ctx) => ctx.userState.retentionRate < 70 && ctx.userState.retentionRate > 0,
    generator: (ctx) => ({
      type: 'performance_tip',
      category: 'performance',
      priority: 'high',
      title: 'Améliore Ta Précision 🎯',
      message: `Ton taux de réussite est à ${Math.round(ctx.userState.retentionRate)}%. Essaie de ralentir et bien réfléchir avant de répondre.`,
      actionable: true,
      actions: [
        { id: 'practice_mode', label: 'Mode pratique ciblé', type: 'start_session', payload: { mode: 'practice' }, icon: 'target' },
        { id: 'tips', label: 'Voir les conseils', type: 'navigate', payload: { route: '/tips' }, icon: 'lightbulb' }
      ],
      timing: 'session_start',
      context: ctx
    })
  },

  // Timing Optimization
  {
    id: 'optimal_time_detected',
    conditions: (ctx) => {
      const currentHour = new Date().getHours();
      return ctx.historicalPatterns.bestPerformanceTimeSlots.some(slot => {
        const slotHour = parseInt(slot.split(':')[0]);
        return Math.abs(currentHour - slotHour) <= 1;
      });
    },
    generator: (ctx) => ({
      type: 'timing_optimization',
      category: 'efficiency', 
      priority: 'medium',
      title: 'Moment Idéal Détecté ⏰',
      message: 'Nos données montrent que tu performes généralement mieux à cette heure-ci. Parfait timing !',
      actionable: true,
      actions: [
        { id: 'start_focused', label: 'Session intensive', type: 'start_session', payload: { intensity: 'high' }, icon: 'zap' }
      ],
      timing: 'immediate',
      context: ctx
    })
  },

  // Skill Focus
  {
    id: 'weakness_focus',
    conditions: (ctx) => ctx.userState.strugglingAreas.length > 0,
    generator: (ctx) => ({
      type: 'skill_focus',
      category: 'strategy',
      priority: 'high',
      title: 'Focus Stratégique 🎯',
      message: `Tu pourrais progresser en travaillant ${ctx.userState.strugglingAreas[0]}. Un petit effort maintenant, un grand progrès demain !`,
      actionable: true,
      actions: [
        { 
          id: 'targeted_practice', 
          label: `Pratiquer ${ctx.userState.strugglingAreas[0]}`, 
          type: 'start_session', 
          payload: { category: ctx.userState.strugglingAreas[0] }, 
          icon: 'target' 
        }
      ],
      timing: 'session_start',
      context: ctx
    })
  },

  // Habit Formation
  {
    id: 'consistency_nudge',
    conditions: (ctx) => {
      const hoursSinceLastSession = ctx.environmentalFactors.sessionDuration > 0 ? 0 : 24;
      return hoursSinceLastSession > 24 && ctx.historicalPatterns.consistencyPattern !== 'daily_habit';
    },
    generator: (ctx) => ({
      type: 'habit_formation',
      category: 'engagement',
      priority: 'medium',
      title: 'Moment de Revenir 📚',
      message: 'Une petite session maintenant peut t\'aider à maintenir ton rythme d\'apprentissage !',
      actionable: true,
      actions: [
        { id: 'quick_session', label: 'Session rapide (5min)', type: 'start_session', payload: { duration: 'short' }, icon: 'clock' },
        { id: 'remind_later', label: 'Me rappeler plus tard', type: 'dismiss', payload: { remindIn: 2 * 60 * 60 * 1000 }, icon: 'bell' }
      ],
      timing: 'idle_moment',
      context: ctx
    })
  },

  // Fatigue Detection
  {
    id: 'fatigue_detected',
    conditions: (ctx) => ctx.userState.energyLevel === 'low' && ctx.environmentalFactors.sessionDuration > 30 * 60 * 1000,
    generator: (ctx) => ({
      type: 'fatigue_detection',
      category: 'wellbeing',
      priority: 'high',
      title: 'Pause Recommandée 😴',
      message: 'Je détecte que tu pourrais être fatigué. Une pause de 5-10 minutes pourrait améliorer tes performances !',
      actionable: true,
      actions: [
        { id: 'short_break', label: 'Pause 5min', type: 'take_break', payload: { duration: 5 }, icon: 'pause' },
        { id: 'end_session', label: 'Finir pour aujourd\'hui', type: 'dismiss', icon: 'stop' }
      ],
      timing: 'immediate',
      context: ctx
    })
  },

  // Achievement Nudges
  {
    id: 'achievement_close',
    conditions: (ctx) => {
      return ctx.environmentalFactors.recentAchievements.some(achievement => 
        !achievement.unlocked && achievement.progress > 80
      );
    },
    generator: (ctx) => {
      const closeAchievement = ctx.environmentalFactors.recentAchievements.find(a => 
        !a.unlocked && a.progress > 80
      );
      return {
        type: 'achievement_nudge',
        category: 'engagement',
        priority: 'medium',
        title: 'Achievement Proche ! 🏆',
        message: `Tu es à ${100 - (closeAchievement?.progress || 0)}% de débloquer "${closeAchievement?.name}" !`,
        actionable: true,
        actions: [
          { id: 'push_for_achievement', label: 'Y aller !', type: 'start_session', icon: 'trophy' }
        ],
        timing: 'session_start',
        context: ctx
      };
    }
  },

  // Learning Strategy
  {
    id: 'strength_amplification',
    conditions: (ctx) => ctx.userState.strengthAreas.length > 0 && ctx.userState.motivationLevel === 'motivated',
    generator: (ctx) => ({
      type: 'learning_strategy',
      category: 'strategy',
      priority: 'low',
      title: 'Exploite Tes Forces 💪',
      message: `Tu excelles en ${ctx.userState.strengthAreas[0]} ! Que dirais-tu d'explorer des sujets avancés dans ce domaine ?`,
      actionable: true,
      actions: [
        { 
          id: 'advanced_practice', 
          label: 'Défis avancés', 
          type: 'start_session', 
          payload: { category: ctx.userState.strengthAreas[0], difficulty: 'advanced' }, 
          icon: 'trending-up' 
        }
      ],
      timing: 'session_start',
      context: ctx
    })
  },

  // Progress Celebration
  {
    id: 'weekly_progress_celebration',
    conditions: (ctx) => {
      const improvementTrend = ctx.historicalPatterns.improvementTrend;
      return improvementTrend === 'improving' && ctx.userState.learningVelocity > 0;
    },
    generator: (ctx) => ({
      type: 'progress_celebration',
      category: 'engagement',
      priority: 'low',
      title: 'Progrès Remarquable ! 🎉',
      message: `Tes performances s'améliorent constamment. Tu apprends ${ctx.userState.learningVelocity.toFixed(1)} compétences par semaine en moyenne !`,
      actionable: true,
      actions: [
        { id: 'view_progress', label: 'Voir mes progrès', type: 'navigate', payload: { route: '/analytics' }, icon: 'bar-chart' },
        { id: 'share_success', label: 'Partager ma réussite', type: 'share', icon: 'share' }
      ],
      timing: 'weekly_review',
      context: ctx
    })
  }
];

// Smart AI Learning Coach Engine
export class AILearningCoach {
  private static instance: AILearningCoach;
  private insights: Map<string, CoachInsight> = new Map();
  private userState: UserLearningState | null = null;
  private lastAnalysis: number = 0;
  private analysisInterval = 5 * 60 * 1000; // 5 minutes

  static getInstance(): AILearningCoach {
    if (!AILearningCoach.instance) {
      AILearningCoach.instance = new AILearningCoach();
    }
    return AILearningCoach.instance;
  }

  // Analyse l'état utilisateur et génère des insights personnalisés
  analyzeAndGenerateInsights(
    learningMetrics: LearningMetrics,
    recentSession?: LearningSession,
    achievements?: SmartAchievement[],
    user?: User,
    skills?: Skill[]
  ): CoachInsight[] {
    const now = Date.now();
    
    // Éviter les analyses trop fréquentes
    if (now - this.lastAnalysis < this.analysisInterval) {
      return Array.from(this.insights.values()).filter(insight => 
        insight.validUntil > now && !insight.seenAt
      );
    }

    // Analyser l'état utilisateur
    this.userState = this.analyzeUserState(learningMetrics, recentSession, achievements, skills);
    
    // Générer le contexte d'analyse
    const context = this.generateContext(learningMetrics, recentSession, achievements, this.userState);
    
    // Nettoyer les insights expirés
    this.cleanupExpiredInsights(now);
    
    // Générer de nouveaux insights
    const newInsights = this.generateContextualInsights(context);
    
    // Stocker les insights
    newInsights.forEach(insight => {
      this.insights.set(insight.id, insight);
    });
    
    this.lastAnalysis = now;
    
    logger.info('AI Coach analysis completed', {
      action: 'ai_coach_analysis',
      context: {
        userState: this.userState,
        newInsightsCount: newInsights.length,
        totalInsights: this.insights.size
      }
    });

    return Array.from(this.insights.values()).filter(insight => 
      insight.validUntil > now && !insight.seenAt
    );
  }

  private analyzeUserState(
    metrics: LearningMetrics, 
    session?: LearningSession, 
    achievements?: SmartAchievement[],
    skills?: Skill[]
  ): UserLearningState {
    const now = Date.now();
    
    // Calculer le niveau d'énergie basé sur performance récente et durée session
    const energyLevel = this.calculateEnergyLevel(metrics, session);
    
    // Calculer le niveau de focus basé sur précision récente
    const focusLevel = this.calculateFocusLevel(metrics, session);
    
    // Calculer le niveau de motivation basé sur patterns
    const motivationLevel = this.calculateMotivationLevel(metrics, achievements);
    
    // Identifier les zones de difficulté et de force
    const { strugglingAreas, strengthAreas } = this.identifySkillAreas(metrics, skills);

    return {
      currentStreak: metrics.currentStreak,
      energyLevel,
      focusLevel,
      motivationLevel,
      learningVelocity: metrics.learningVelocity,
      retentionRate: metrics.retentionRate,
      strugglingAreas,
      strengthAreas,
    };
  }

  private calculateEnergyLevel(metrics: LearningMetrics, session?: LearningSession): EnergyLevel {
    const sessionDuration = session?.timeSpent || 0;
    const avgSessionDuration = metrics.averageSessionDuration;
    
    // Si session très longue comparée à la moyenne, énergie probablement faible
    if (sessionDuration > avgSessionDuration * 1.5) {
      return 'low';
    }
    
    // Si performance récente en baisse, énergie moyenne
    if (metrics.retentionRate < 60) {
      return 'medium';
    }
    
    // Si streak élevé et bonnes performances, énergie élevée
    if (metrics.currentStreak > 7 && metrics.retentionRate > 80) {
      return 'peak';
    }
    
    return 'high';
  }

  private calculateFocusLevel(metrics: LearningMetrics, session?: LearningSession): FocusLevel {
    const retentionRate = metrics.retentionRate;
    
    if (retentionRate >= 90) return 'deep_focus';
    if (retentionRate >= 75) return 'focused';
    if (retentionRate >= 60) return 'moderate';
    return 'distracted';
  }

  private calculateMotivationLevel(metrics: LearningMetrics, achievements?: SmartAchievement[]): MotivationLevel {
    const streak = metrics.currentStreak;
    const velocity = metrics.learningVelocity;
    const recentAchievements = achievements?.filter(a => 
      a.unlocked && a.unlockedAt && 
      Date.now() - a.unlockedAt.getTime() < 7 * 24 * 60 * 60 * 1000 // 7 jours
    ).length || 0;
    
    if (streak === 0 && velocity < 0.5) return 'discouraged';
    if (streak < 3 && recentAchievements === 0) return 'neutral';
    if (streak >= 7 || recentAchievements > 2) return 'enthusiastic';
    return 'motivated';
  }

  private identifySkillAreas(metrics: LearningMetrics, skills?: Skill[]): {
    strugglingAreas: string[];
    strengthAreas: string[];
  } {
    if (!metrics.categoryStats || !skills) {
      return { strugglingAreas: [], strengthAreas: [] };
    }

    const struggling = metrics.categoryStats
      .filter(cat => cat.percentage < 40)
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 2)
      .map(cat => cat.category);

    const strength = metrics.categoryStats
      .filter(cat => cat.percentage > 70)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 2)
      .map(cat => cat.category);

    return {
      strugglingAreas: struggling,
      strengthAreas: strength,
    };
  }

  private generateContext(
    metrics: LearningMetrics,
    session?: LearningSession,
    achievements?: SmartAchievement[],
    userState?: UserLearningState
  ): CoachContext {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Déterminer le moment de la journée
    let timeOfDay: EnvironmentalFactors['timeOfDay'];
    if (currentHour < 12) timeOfDay = 'morning';
    else if (currentHour < 17) timeOfDay = 'afternoon'; 
    else if (currentHour < 22) timeOfDay = 'evening';
    else timeOfDay = 'night';

    // Récupérer les métriques de performance app
    const performanceData = performanceMonitor.generateReport();

    return {
      triggerMetrics: {
        currentStreak: metrics.currentStreak,
        learningVelocity: metrics.learningVelocity,
        retentionRate: metrics.retentionRate,
        sessionDuration: session?.timeSpent || 0,
        questionsAnswered: session?.questionsAnswered || 0,
      },
      sessionState: session,
      userState: userState || this.userState!,
      environmentalFactors: {
        timeOfDay,
        dayOfWeek: now.toLocaleDateString('en', { weekday: 'long' }),
        appPerformance: {
          loadTime: performanceData.vitals.lcp || 1000,
          responsiveness: performanceData.vitals.fid || 50,
        },
        recentAchievements: achievements || [],
        sessionDuration: session?.timeSpent || 0,
        questionsAnswered: session?.questionsAnswered || 0,
      },
      historicalPatterns: {
        bestPerformanceTimeSlots: ['14:00', '16:00'], // Placeholder - à calculer depuis historique
        averageSessionDuration: metrics.averageSessionDuration,
        preferredCategories: metrics.categoryStats
          ?.sort((a, b) => b.recentActivity - a.recentActivity)
          .slice(0, 2)
          .map(cat => cat.category) || [],
        consistencyPattern: metrics.currentStreak > 14 ? 'daily_habit' : 
                          metrics.currentStreak > 7 ? 'regular' : 'irregular',
        improvementTrend: metrics.learningVelocity > 2 ? 'improving' : 
                         metrics.learningVelocity > 1 ? 'stable' : 'declining',
      },
    };
  }

  private generateContextualInsights(context: CoachContext): CoachInsight[] {
    const insights: CoachInsight[] = [];
    const now = Date.now();

    for (const template of COACH_INSIGHT_TEMPLATES) {
      try {
        // Vérifier si les conditions sont remplies
        if (template.conditions(context)) {
          // Vérifier si cet insight n'existe pas déjà
          if (!this.insights.has(template.id)) {
            const insightData = template.generator(context);
            const insight: CoachInsight = {
              ...insightData,
              id: `${template.id}_${now}`,
              validUntil: now + this.getInsightValidityDuration(insightData.timing),
            };
            
            insights.push(insight);
          }
        }
      } catch (error) {
        logger.warn('Failed to generate insight', {
          action: 'coach_insight_generation_failed',
          context: { templateId: template.id, error: error instanceof Error ? error.message : String(error) }
        });
      }
    }

    return insights;
  }

  private getInsightValidityDuration(timing: CoachTiming): number {
    switch (timing) {
      case 'immediate': return 5 * 60 * 1000; // 5 minutes
      case 'session_start': return 30 * 60 * 1000; // 30 minutes
      case 'session_end': return 10 * 60 * 1000; // 10 minutes
      case 'daily_summary': return 24 * 60 * 60 * 1000; // 24 heures
      case 'weekly_review': return 7 * 24 * 60 * 60 * 1000; // 7 jours
      case 'idle_moment': return 2 * 60 * 60 * 1000; // 2 heures
      case 'optimal_window': return 60 * 60 * 1000; // 1 heure
      default: return 30 * 60 * 1000;
    }
  }

  private cleanupExpiredInsights(now: number) {
    const expiredKeys: string[] = [];
    
    this.insights.forEach((insight, key) => {
      if (insight.validUntil <= now) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => this.insights.delete(key));
  }

  // Marquer un insight comme vu
  markInsightAsSeen(insightId: string) {
    const insight = this.insights.get(insightId);
    if (insight) {
      insight.seenAt = Date.now();
      this.insights.set(insightId, insight);
    }
  }

  // Obtenir les insights actifs
  getActiveInsights(): CoachInsight[] {
    const now = Date.now();
    return Array.from(this.insights.values()).filter(insight => 
      insight.validUntil > now && !insight.seenAt
    );
  }

  // Obtenir les insights par priorité
  getInsightsByPriority(priority: CoachPriority): CoachInsight[] {
    return this.getActiveInsights().filter(insight => insight.priority === priority);
  }

  // Obtenir les insights par timing
  getInsightsByTiming(timing: CoachTiming): CoachInsight[] {
    return this.getActiveInsights().filter(insight => insight.timing === timing);
  }

  // Reset pour debug/test
  reset() {
    this.insights.clear();
    this.userState = null;
    this.lastAnalysis = 0;
  }
}

// Export singleton instance
export const aiLearningCoach = AILearningCoach.getInstance();