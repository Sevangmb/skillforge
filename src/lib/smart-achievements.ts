/**
 * Smart Achievement Engine
 * Système d'achievements intelligents basé sur les analytics temps réel
 */

import { logger } from './logger';
import type { LearningMetrics, LearningSession, CategoryStats, WeeklyData } from '../stores/useAppStore';
import type { User, Skill } from './types';

// Types pour le Smart Achievement Engine
export interface SmartAchievement {
  id: string;
  name: string;
  description: string;
  type: AchievementType;
  category: AchievementCategory;
  icon: string;
  rarity: AchievementRarity;
  
  // Intelligence analytics
  trigger: AchievementTrigger;
  requirement: AchievementRequirement;
  progress: number;
  
  // Metadata
  unlocked: boolean;
  unlockedAt?: Date;
  xpReward: number;
  shareMessage?: string;
}

export type AchievementType = 
  | 'streak' 
  | 'velocity' 
  | 'accuracy' 
  | 'endurance' 
  | 'consistency' 
  | 'improvement' 
  | 'exploration' 
  | 'mastery'
  | 'social'
  | 'milestone';

export type AchievementCategory = 
  | 'behavioral'    // Patterns d'usage
  | 'performance'   // Métriques de performance
  | 'engagement'    // Niveau d'engagement
  | 'learning'      // Progrès d'apprentissage
  | 'technical'     // Performance technique app
  | 'special';      // Events spéciaux

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface AchievementTrigger {
  event: 'session_complete' | 'streak_updated' | 'metrics_calculated' | 'skill_mastered' | 'category_completed';
  conditions: AchievementCondition[];
  cooldown?: number; // Minutes avant re-trigger
}

export interface AchievementCondition {
  metric: string;
  operator: 'gte' | 'lte' | 'eq' | 'gt' | 'lt';
  value: number | string;
  timeWindow?: 'session' | 'day' | 'week' | 'month' | 'all-time';
}

export interface AchievementRequirement {
  description: string;
  steps: AchievementStep[];
}

export interface AchievementStep {
  metric: string;
  target: number;
  current: number;
  description: string;
}

// Smart Achievement Templates
export const SMART_ACHIEVEMENT_TEMPLATES: Omit<SmartAchievement, 'progress' | 'unlocked' | 'unlockedAt'>[] = [
  // Behavioral Achievements
  {
    id: 'streak_fire',
    name: 'En Feu ! 🔥',
    description: 'Maintenez une série de 7 jours consécutifs d\'apprentissage',
    type: 'streak',
    category: 'behavioral',
    icon: 'flame',
    rarity: 'rare',
    trigger: {
      event: 'metrics_calculated',
      conditions: [
        { metric: 'currentStreak', operator: 'gte', value: 7, timeWindow: 'all-time' }
      ]
    },
    requirement: {
      description: 'Apprenez chaque jour pendant 7 jours consécutifs',
      steps: [
        { metric: 'currentStreak', target: 7, current: 0, description: 'Jours consécutifs' }
      ]
    },
    xpReward: 100,
    shareMessage: 'Je maintiens une série de 7 jours d\'apprentissage ! 🔥'
  },
  {
    id: 'speed_demon',
    name: 'Démon de Vitesse ⚡',
    description: 'Complétez 5 questions en moins de 2 minutes',
    type: 'velocity',
    category: 'performance',
    icon: 'zap',
    rarity: 'common',
    trigger: {
      event: 'session_complete',
      conditions: [
        { metric: 'questionsAnswered', operator: 'gte', value: 5, timeWindow: 'session' },
        { metric: 'averageTimePerQuestion', operator: 'lt', value: 24000, timeWindow: 'session' } // 24s en ms
      ]
    },
    requirement: {
      description: 'Répondre rapidement à 5 questions dans une session',
      steps: [
        { metric: 'questionsAnswered', target: 5, current: 0, description: 'Questions répondues' },
        { metric: 'averageTime', target: 120000, current: 0, description: 'Temps total (< 2min)' }
      ]
    },
    xpReward: 50
  },
  {
    id: 'accuracy_master',
    name: 'Maître de Précision 🎯',
    description: 'Atteignez 90% de précision sur 10 questions',
    type: 'accuracy',
    category: 'performance',
    icon: 'target',
    rarity: 'epic',
    trigger: {
      event: 'session_complete',
      conditions: [
        { metric: 'questionsAnswered', operator: 'gte', value: 10, timeWindow: 'session' },
        { metric: 'accuracyRate', operator: 'gte', value: 90, timeWindow: 'session' }
      ]
    },
    requirement: {
      description: 'Maintenir une précision exceptionnelle',
      steps: [
        { metric: 'questionsAnswered', target: 10, current: 0, description: 'Questions minimum' },
        { metric: 'accuracy', target: 90, current: 0, description: 'Taux de réussite (%)' }
      ]
    },
    xpReward: 200
  },
  {
    id: 'endurance_warrior',
    name: 'Guerrier d\'Endurance 💪',
    description: 'Session d\'apprentissage de plus de 30 minutes',
    type: 'endurance',
    category: 'engagement',
    icon: 'trending',
    rarity: 'rare',
    trigger: {
      event: 'session_complete',
      conditions: [
        { metric: 'sessionDuration', operator: 'gt', value: 1800000, timeWindow: 'session' } // 30min en ms
      ]
    },
    requirement: {
      description: 'Maintenir une session longue et productive',
      steps: [
        { metric: 'sessionDuration', target: 1800000, current: 0, description: 'Durée session (30+ min)' }
      ]
    },
    xpReward: 150
  },
  {
    id: 'consistency_champion',
    name: 'Champion de Consistance 📈',
    description: 'Complétez au moins 3 compétences par semaine pendant 4 semaines',
    type: 'consistency',
    category: 'behavioral',
    icon: 'calendar',
    rarity: 'legendary',
    trigger: {
      event: 'metrics_calculated',
      conditions: [
        { metric: 'consistentWeeks', operator: 'gte', value: 4, timeWindow: 'month' },
        { metric: 'minSkillsPerWeek', operator: 'gte', value: 3, timeWindow: 'week' }
      ]
    },
    requirement: {
      description: 'Apprentissage régulier et soutenu',
      steps: [
        { metric: 'consistentWeeks', target: 4, current: 0, description: 'Semaines consistantes' },
        { metric: 'minSkillsPerWeek', target: 3, current: 0, description: 'Compétences par semaine' }
      ]
    },
    xpReward: 500,
    shareMessage: 'J\'ai maintenu un rythme d\'apprentissage constant pendant 4 semaines ! 📈'
  },
  {
    id: 'improvement_curve',
    name: 'Courbe d\'Amélioration 📊',
    description: 'Améliorez votre taux de réussite de 20% en une semaine',
    type: 'improvement',
    category: 'learning',
    icon: 'trending',
    rarity: 'epic',
    trigger: {
      event: 'metrics_calculated',
      conditions: [
        { metric: 'accuracyImprovement', operator: 'gte', value: 20, timeWindow: 'week' }
      ]
    },
    requirement: {
      description: 'Progression mesurable de vos performances',
      steps: [
        { metric: 'accuracyImprovement', target: 20, current: 0, description: 'Amélioration du taux (%)' }
      ]
    },
    xpReward: 300
  },
  {
    id: 'explorer_badge',
    name: 'Badge d\'Explorateur 🗺️',
    description: 'Découvrez et pratiquez toutes les catégories disponibles',
    type: 'exploration',
    category: 'learning',
    icon: 'star',
    rarity: 'rare',
    trigger: {
      event: 'metrics_calculated',
      conditions: [
        { metric: 'categoriesExplored', operator: 'eq', value: -1, timeWindow: 'all-time' } // -1 = toutes les catégories
      ]
    },
    requirement: {
      description: 'Exploration complète de tous les domaines',
      steps: [
        { metric: 'categoriesExplored', target: 0, current: 0, description: 'Catégories découvertes' }
      ]
    },
    xpReward: 250
  },
  {
    id: 'category_master',
    name: 'Maître de Domaine 👑',
    description: 'Complétez 100% d\'une catégorie de compétences',
    type: 'mastery',
    category: 'learning',
    icon: 'crown',
    rarity: 'legendary',
    trigger: {
      event: 'metrics_calculated',
      conditions: [
        { metric: 'categoryCompletion', operator: 'eq', value: 100, timeWindow: 'all-time' }
      ]
    },
    requirement: {
      description: 'Maîtrise complète d\'un domaine de compétences',
      steps: [
        { metric: 'categoryCompletion', target: 100, current: 0, description: 'Complétion catégorie (%)' }
      ]
    },
    xpReward: 1000,
    shareMessage: 'J\'ai maîtrisé une catégorie complète de compétences ! 👑'
  },
  {
    id: 'performance_guru',
    name: 'Guru de Performance ⚡',
    description: 'Utilisez l\'app avec un temps de chargement < 1s',
    type: 'milestone',
    category: 'technical',
    icon: 'zap',
    rarity: 'rare',
    trigger: {
      event: 'metrics_calculated',
      conditions: [
        { metric: 'averageLoadTime', operator: 'lt', value: 1000, timeWindow: 'week' }
      ]
    },
    requirement: {
      description: 'Expérience utilisateur optimale',
      steps: [
        { metric: 'averageLoadTime', target: 1000, current: 0, description: 'Temps de chargement (ms)' }
      ]
    },
    xpReward: 75
  }
];

// Smart Achievement Engine
export class SmartAchievementEngine {
  private static instance: SmartAchievementEngine;
  private achievements: SmartAchievement[] = [];
  private cooldowns: Map<string, number> = new Map();

  static getInstance(): SmartAchievementEngine {
    if (!SmartAchievementEngine.instance) {
      SmartAchievementEngine.instance = new SmartAchievementEngine();
    }
    return SmartAchievementEngine.instance;
  }

  constructor() {
    this.initializeAchievements();
  }

  private initializeAchievements() {
    this.achievements = SMART_ACHIEVEMENT_TEMPLATES.map(template => ({
      ...template,
      progress: 0,
      unlocked: false
    }));

    logger.info('Smart Achievement Engine initialized', {
      action: 'achievement_engine_init',
      context: { achievementCount: this.achievements.length }
    });
  }

  // Évaluer les achievements basés sur les métriques
  evaluateAchievements(
    learningMetrics: LearningMetrics,
    recentSession?: LearningSession,
    user?: User,
    skills?: Skill[]
  ): SmartAchievement[] {
    const newlyUnlocked: SmartAchievement[] = [];
    const now = Date.now();

    for (const achievement of this.achievements) {
      // Skip si déjà débloqué ou en cooldown
      if (achievement.unlocked) continue;
      
      const cooldownKey = `${achievement.id}_${achievement.trigger.event}`;
      if (this.cooldowns.has(cooldownKey)) {
        const cooldownEnd = this.cooldowns.get(cooldownKey)!;
        if (now < cooldownEnd) continue;
      }

      // Calculer les métriques pour ce achievement
      const metrics = this.calculateMetricsForAchievement(
        achievement,
        learningMetrics,
        recentSession,
        user,
        skills
      );

      // Vérifier les conditions
      const conditionsMet = achievement.trigger.conditions.every(condition =>
        this.checkCondition(condition, metrics)
      );

      if (conditionsMet) {
        // Débloquer l'achievement
        achievement.unlocked = true;
        achievement.unlockedAt = new Date();
        achievement.progress = 100;

        newlyUnlocked.push({ ...achievement });

        // Appliquer cooldown si spécifié
        if (achievement.trigger.cooldown) {
          this.cooldowns.set(
            cooldownKey,
            now + achievement.trigger.cooldown * 60 * 1000
          );
        }

        logger.info('Achievement unlocked', {
          action: 'achievement_unlocked',
          context: {
            achievementId: achievement.id,
            name: achievement.name,
            rarity: achievement.rarity,
            xpReward: achievement.xpReward
          }
        });
      } else {
        // Mettre à jour le progress
        achievement.progress = this.calculateProgress(achievement, metrics);
      }
    }

    return newlyUnlocked;
  }

  private calculateMetricsForAchievement(
    achievement: SmartAchievement,
    learningMetrics: LearningMetrics,
    recentSession?: LearningSession,
    user?: User,
    skills?: Skill[]
  ): Record<string, number> {
    const metrics: Record<string, number> = {};

    // Métriques de base depuis learningMetrics
    metrics.currentStreak = learningMetrics.currentStreak;
    metrics.learningVelocity = learningMetrics.learningVelocity;
    metrics.retentionRate = learningMetrics.retentionRate;
    metrics.totalSessions = learningMetrics.totalSessions;
    metrics.totalTimeSpent = learningMetrics.totalTimeSpent;
    metrics.averageSessionDuration = learningMetrics.averageSessionDuration;

    // Métriques de session si disponible
    if (recentSession) {
      metrics.questionsAnswered = recentSession.questionsAnswered;
      metrics.correctAnswers = recentSession.correctAnswers;
      metrics.sessionDuration = recentSession.timeSpent;
      metrics.accuracyRate = recentSession.questionsAnswered > 0 
        ? (recentSession.correctAnswers / recentSession.questionsAnswered) * 100 
        : 0;
      metrics.averageTimePerQuestion = recentSession.questionsAnswered > 0
        ? recentSession.timeSpent / recentSession.questionsAnswered
        : 0;
    }

    // Métriques de consistance
    if (learningMetrics.weeklyProgress) {
      const recentWeeks = learningMetrics.weeklyProgress.slice(-4);
      metrics.consistentWeeks = recentWeeks.filter(week => week.skillsCompleted >= 3).length;
      metrics.minSkillsPerWeek = Math.min(...recentWeeks.map(week => week.skillsCompleted));
      
      // Amélioration d'accuracy
      if (recentWeeks.length >= 2) {
        const currentWeek = recentWeeks[recentWeeks.length - 1];
        const previousWeek = recentWeeks[recentWeeks.length - 2];
        // Simplification : utiliser le ratio de sessions réussies
        const currentAccuracy = currentWeek.sessionsCount > 0 ? (currentWeek.xpGained / (currentWeek.sessionsCount * 100)) * 100 : 0;
        const previousAccuracy = previousWeek.sessionsCount > 0 ? (previousWeek.xpGained / (previousWeek.sessionsCount * 100)) * 100 : 0;
        metrics.accuracyImprovement = currentAccuracy - previousAccuracy;
      }
    }

    // Métriques d'exploration
    if (learningMetrics.categoryStats) {
      metrics.categoriesExplored = learningMetrics.categoryStats.filter(cat => cat.recentActivity > 0).length;
      const totalCategories = learningMetrics.categoryStats.length;
      
      // Catégorie complètement terminée
      const completedCategories = learningMetrics.categoryStats.filter(cat => cat.percentage === 100);
      metrics.categoryCompletion = completedCategories.length > 0 ? 100 : 0;
      
      // Ajuster le target pour l'exploration
      if (achievement.id === 'explorer_badge') {
        achievement.requirement.steps[0].target = totalCategories;
      }
    }

    // Métriques techniques (simulated for now)
    metrics.averageLoadTime = 800; // Placeholder - would come from performance monitor

    return metrics;
  }

  private checkCondition(condition: AchievementCondition, metrics: Record<string, number>): boolean {
    const value = metrics[condition.metric];
    if (value === undefined) return false;

    const target = typeof condition.value === 'number' ? condition.value : parseFloat(condition.value as string);

    switch (condition.operator) {
      case 'gte': return value >= target;
      case 'lte': return value <= target;
      case 'eq': 
        // Pour les catégories explorées, -1 signifie "toutes"
        if (condition.value === -1 && condition.metric === 'categoriesExplored') {
          return value === metrics.totalCategories;
        }
        return value === target;
      case 'gt': return value > target;
      case 'lt': return value < target;
      default: return false;
    }
  }

  private calculateProgress(achievement: SmartAchievement, metrics: Record<string, number>): number {
    const steps = achievement.requirement.steps;
    let totalProgress = 0;

    for (const step of steps) {
      const current = metrics[step.metric] || 0;
      const progress = Math.min((current / step.target) * 100, 100);
      totalProgress += progress;
      
      // Mettre à jour le step
      step.current = current;
    }

    return Math.round(totalProgress / steps.length);
  }

  // Getters
  getAchievements(): SmartAchievement[] {
    return [...this.achievements];
  }

  getUnlockedAchievements(): SmartAchievement[] {
    return this.achievements.filter(a => a.unlocked);
  }

  getInProgressAchievements(): SmartAchievement[] {
    return this.achievements.filter(a => !a.unlocked && a.progress > 0);
  }

  getAchievementsByCategory(category: AchievementCategory): SmartAchievement[] {
    return this.achievements.filter(a => a.category === category);
  }

  getAchievementsByRarity(rarity: AchievementRarity): SmartAchievement[] {
    return this.achievements.filter(a => a.rarity === rarity);
  }

  // Reset pour debug/test
  reset() {
    this.achievements = SMART_ACHIEVEMENT_TEMPLATES.map(template => ({
      ...template,
      progress: 0,
      unlocked: false
    }));
    this.cooldowns.clear();
  }
}

// Export singleton instance
export const smartAchievementEngine = SmartAchievementEngine.getInstance();