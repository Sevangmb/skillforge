/**
 * SkillForge AI - Smart Achievement Engine
 * Intelligent system for detecting, awarding, and managing user achievements
 */

import { logger } from './logger';
import {
  Achievement,
  AchievementId,
  AchievementType,
  AchievementCategory,
  AchievementTrigger,
  UserAchievement,
  AchievementProgress,
  AchievementStats,
  AchievementNotification,
  AchievementRecommendation
} from './achievement-types';
import { ACHIEVEMENTS } from './achievement-definitions';
import { User, SkillId, UserId } from './types';

export class AchievementEngine {
  private userAchievements: Map<UserId, UserAchievement[]> = new Map();
  private achievementProgress: Map<UserId, Map<AchievementId, AchievementProgress>> = new Map();

  /**
   * Initialize achievement engine with user data
   */
  async initialize(userId: UserId): Promise<void> {
    try {
      // Load user achievements from storage
      await this.loadUserAchievements(userId);
      
      logger.info('Achievement engine initialized', {
        action: 'achievement_engine_init',
        userId
      });
    } catch (error) {
      logger.error('Failed to initialize achievement engine', {
        action: 'achievement_engine_init_error',
        userId,
        error
      });
    }
  }

  /**
   * Process achievement trigger events
   */
  async processTrigger(trigger: AchievementTrigger): Promise<UserAchievement[]> {
    const newAchievements: UserAchievement[] = [];

    try {
      // Get relevant achievements for this trigger type
      const relevantAchievements = this.getRelevantAchievements(trigger.eventType);

      for (const achievement of relevantAchievements) {
        const isUnlocked = await this.checkAchievementCriteria(trigger, achievement);
        
        if (isUnlocked) {
          const userAchievement = await this.unlockAchievement(trigger.userId, achievement);
          if (userAchievement) {
            newAchievements.push(userAchievement);
          }
        } else {
          // Update progress for incomplete achievements
          await this.updateAchievementProgress(trigger.userId, achievement, trigger);
        }
      }

      if (newAchievements.length > 0) {
        logger.info('Achievements unlocked', {
          action: 'achievements_unlocked',
          userId: trigger.userId,
          count: newAchievements.length,
          achievementIds: newAchievements.map(a => a.achievementId)
        });
      }

    } catch (error) {
      logger.error('Failed to process achievement trigger', {
        action: 'achievement_trigger_error',
        userId: trigger.userId,
        error
      });
    }

    return newAchievements;
  }

  /**
   * Check if achievement criteria is met
   */
  private async checkAchievementCriteria(
    trigger: AchievementTrigger, 
    achievement: Achievement
  ): Promise<boolean> {
    const { criteria } = achievement;
    const { eventData } = trigger;

    // Check if already unlocked (unless repeatable)
    if (!achievement.isRepeatable && this.isAchievementUnlocked(trigger.userId, achievement.id)) {
      return false;
    }

    // Check repeat limits
    if (achievement.isRepeatable && achievement.maxRepeats) {
      const currentRepeats = this.getAchievementRepeatCount(trigger.userId, achievement.id);
      if (currentRepeats >= achievement.maxRepeats) {
        return false;
      }
    }

    // Check level requirements
    if (achievement.unlocksAt && eventData.userLevel < achievement.unlocksAt) {
      return false;
    }

    // Check prerequisites
    if (achievement.prerequisiteAchievements) {
      const hasPrerequisites = achievement.prerequisiteAchievements.every(prereqId =>
        this.isAchievementUnlocked(trigger.userId, prereqId)
      );
      if (!hasPrerequisites) {
        return false;
      }
    }

    // Type-specific criteria checks
    switch (achievement.type) {
      case AchievementType.FIRST_SKILL_COMPLETED:
        return eventData.skillsCompleted >= 1;

      case AchievementType.SKILLS_COMPLETED:
        return eventData.skillsCompleted >= (criteria.target || 0);

      case AchievementType.PERFECT_SCORE:
        return this.checkPerfectScoreAchievement(trigger.userId, criteria);

      case AchievementType.CATEGORY_MASTERY:
        return this.checkCategoryMasteryAchievement(trigger.userId, eventData, criteria);

      case AchievementType.LEARNING_STREAK:
        return eventData.currentStreak >= (criteria.target || 0);

      case AchievementType.TOTAL_XP:
        return eventData.totalXP >= (criteria.target || 0);

      case AchievementType.LEVEL_UP:
        return eventData.leveledUp === true;

      case AchievementType.DAILY_GOAL:
        return eventData.dailyGoalCompleted === true;

      case AchievementType.WEEKLY_GOAL:
        return eventData.weeklyGoalCompleted === true;

      case AchievementType.RAPID_LEARNER:
        return this.checkRapidLearnerAchievement(trigger.userId, criteria);

      default:
        return false;
    }
  }

  /**
   * Check perfect score achievement criteria
   */
  private checkPerfectScoreAchievement(userId: UserId, criteria: any): boolean {
    const userProgress = this.achievementProgress.get(userId);
    if (!userProgress) return false;

    // Mock implementation - would check actual perfect scores from user data
    return Math.random() > 0.7; // 30% chance for demo
  }

  /**
   * Check category mastery achievement
   */
  private checkCategoryMasteryAchievement(userId: UserId, eventData: any, criteria: any): boolean {
    if (!eventData.categoryCompletion) return false;
    
    return Object.values(eventData.categoryCompletion).some(
      (completion: any) => completion >= 100
    );
  }

  /**
   * Check rapid learner achievement
   */
  private checkRapidLearnerAchievement(userId: UserId, criteria: any): boolean {
    // Mock implementation - would check actual completion times
    return Math.random() > 0.8; // 20% chance for demo
  }

  /**
   * Unlock achievement for user
   */
  private async unlockAchievement(
    userId: UserId, 
    achievement: Achievement
  ): Promise<UserAchievement | null> {
    try {
      const userAchievement: UserAchievement = {
        id: `ua_${userId}_${achievement.id}_${Date.now()}`,
        userId,
        achievementId: achievement.id,
        unlockedAt: new Date(),
        progress: 100,
        isCompleted: true,
        repeatCount: achievement.isRepeatable 
          ? this.getAchievementRepeatCount(userId, achievement.id) + 1 
          : undefined,
        notificationShown: false
      };

      // Add to user achievements
      const userAchievements = this.userAchievements.get(userId) || [];
      userAchievements.push(userAchievement);
      this.userAchievements.set(userId, userAchievements);

      // Save to persistent storage (would integrate with Firebase)
      await this.saveUserAchievement(userAchievement);

      logger.info('Achievement unlocked', {
        action: 'achievement_unlocked',
        userId,
        achievementId: achievement.id,
        achievementTitle: achievement.title,
        points: achievement.points
      });

      return userAchievement;

    } catch (error) {
      logger.error('Failed to unlock achievement', {
        action: 'achievement_unlock_error',
        userId,
        achievementId: achievement.id,
        error
      });
      return null;
    }
  }

  /**
   * Update achievement progress for incomplete achievements
   */
  private async updateAchievementProgress(
    userId: UserId,
    achievement: Achievement,
    trigger: AchievementTrigger
  ): Promise<void> {
    try {
      const currentValue = this.calculateCurrentProgress(achievement, trigger.eventData);
      const targetValue = achievement.criteria.target || 100;
      const progress = Math.min((currentValue / targetValue) * 100, 100);

      const achievementProgress: AchievementProgress = {
        achievementId: achievement.id,
        currentValue,
        targetValue,
        progress,
        isCompleted: progress >= 100,
        estimatedCompletion: this.estimateCompletionDate(achievement, currentValue, targetValue)
      };

      // Update progress map
      let userProgressMap = this.achievementProgress.get(userId);
      if (!userProgressMap) {
        userProgressMap = new Map();
        this.achievementProgress.set(userId, userProgressMap);
      }
      userProgressMap.set(achievement.id, achievementProgress);

      // Save progress (would integrate with Firebase)
      await this.saveAchievementProgress(userId, achievementProgress);

    } catch (error) {
      logger.error('Failed to update achievement progress', {
        action: 'achievement_progress_error',
        userId,
        achievementId: achievement.id,
        error
      });
    }
  }

  /**
   * Calculate current progress value for an achievement
   */
  private calculateCurrentProgress(achievement: Achievement, eventData: any): number {
    switch (achievement.type) {
      case AchievementType.SKILLS_COMPLETED:
        return eventData.skillsCompleted || 0;
      
      case AchievementType.LEARNING_STREAK:
        return eventData.currentStreak || 0;
      
      case AchievementType.TOTAL_XP:
        return eventData.totalXP || 0;
      
      case AchievementType.PERFECT_SCORE:
        return eventData.perfectScores || 0;
      
      default:
        return 0;
    }
  }

  /**
   * Get user achievement statistics
   */
  getUserStats(userId: UserId): AchievementStats {
    const userAchievements = this.userAchievements.get(userId) || [];
    const allAchievements = Object.values(ACHIEVEMENTS);

    const totalUnlocked = userAchievements.length;
    const totalPoints = userAchievements.reduce((sum, ua) => {
      const achievement = ACHIEVEMENTS[Object.values(ACHIEVEMENTS).find(a => a.id === ua.achievementId)?.type || AchievementType.FIRST_SKILL_COMPLETED];
      return sum + (achievement?.points || 0);
    }, 0);

    const rareAchievements = userAchievements.filter(ua => {
      const achievement = Object.values(ACHIEVEMENTS).find(a => a.id === ua.achievementId);
      return achievement?.rarity === 'rare' || achievement?.rarity === 'epic' || achievement?.rarity === 'legendary';
    }).length;

    const streakAchievements = userAchievements.filter(ua => {
      const achievement = Object.values(ACHIEVEMENTS).find(a => a.id === ua.achievementId);
      return achievement?.category === AchievementCategory.STREAK;
    }).length;

    const categoryBreakdown: Record<AchievementCategory, number> = {
      [AchievementCategory.LEARNING]: 0,
      [AchievementCategory.PROGRESS]: 0,
      [AchievementCategory.STREAK]: 0,
      [AchievementCategory.MASTERY]: 0,
      [AchievementCategory.SOCIAL]: 0,
      [AchievementCategory.SPECIAL]: 0,
      [AchievementCategory.MILESTONE]: 0
    };

    userAchievements.forEach(ua => {
      const achievement = Object.values(ACHIEVEMENTS).find(a => a.id === ua.achievementId);
      if (achievement) {
        categoryBreakdown[achievement.category]++;
      }
    });

    return {
      totalAchievements: allAchievements.length,
      totalUnlocked,
      totalPoints,
      completionRate: (totalUnlocked / allAchievements.length) * 100,
      rareAchievements,
      streakAchievements,
      recentUnlocks: userAchievements.slice(-5),
      nextToUnlock: this.getNextUnlockableAchievements(userId),
      categoryBreakdown
    };
  }

  /**
   * Get achievements that are close to being unlocked
   */
  private getNextUnlockableAchievements(userId: UserId): Achievement[] {
    const userProgressMap = this.achievementProgress.get(userId);
    if (!userProgressMap) return [];

    const nextToUnlock: Achievement[] = [];
    
    Array.from(userProgressMap.entries())
      .filter(([_, progress]) => !progress.isCompleted && progress.progress > 50)
      .sort((a, b) => b[1].progress - a[1].progress)
      .slice(0, 3)
      .forEach(([achievementId, _]) => {
        const achievement = Object.values(ACHIEVEMENTS).find(a => a.id === achievementId);
        if (achievement) {
          nextToUnlock.push(achievement);
        }
      });

    return nextToUnlock;
  }

  /**
   * Get relevant achievements for a trigger event type
   */
  private getRelevantAchievements(eventType: string): Achievement[] {
    const typeMap: Record<string, AchievementType[]> = {
      'skill_completed': [
        AchievementType.FIRST_SKILL_COMPLETED,
        AchievementType.SKILLS_COMPLETED,
        AchievementType.CATEGORY_MASTERY,
        AchievementType.SKILL_COLLECTOR
      ],
      'quiz_finished': [
        AchievementType.PERFECT_SCORE,
        AchievementType.RAPID_LEARNER,
        AchievementType.SPEED_DEMON,
        AchievementType.PERFECTIONIST
      ],
      'streak_updated': [
        AchievementType.LEARNING_STREAK,
        AchievementType.PERFECT_WEEK,
        AchievementType.CONSISTENCY_CHAMPION
      ],
      'xp_gained': [
        AchievementType.TOTAL_XP,
        AchievementType.FIRST_100
      ],
      'level_up': [
        AchievementType.LEVEL_UP
      ]
    };

    const relevantTypes = typeMap[eventType] || [];
    return relevantTypes.map(type => ACHIEVEMENTS[type]).filter(Boolean);
  }

  /**
   * Check if achievement is already unlocked
   */
  private isAchievementUnlocked(userId: UserId, achievementId: AchievementId): boolean {
    const userAchievements = this.userAchievements.get(userId) || [];
    return userAchievements.some(ua => ua.achievementId === achievementId && ua.isCompleted);
  }

  /**
   * Get repeat count for repeatable achievement
   */
  private getAchievementRepeatCount(userId: UserId, achievementId: AchievementId): number {
    const userAchievements = this.userAchievements.get(userId) || [];
    const completed = userAchievements.filter(ua => ua.achievementId === achievementId && ua.isCompleted);
    return completed.length;
  }

  /**
   * Estimate completion date for achievement
   */
  private estimateCompletionDate(achievement: Achievement, currentValue: number, targetValue: number): Date | undefined {
    if (currentValue >= targetValue) return new Date();
    
    // Simple estimation based on current progress rate
    const remainingValue = targetValue - currentValue;
    const estimatedDays = Math.ceil(remainingValue / Math.max(currentValue / 7, 1)); // Assume current rate over 7 days
    
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + estimatedDays);
    
    return estimatedDate;
  }

  /**
   * Load user achievements from storage (mock implementation)
   */
  private async loadUserAchievements(userId: UserId): Promise<void> {
    // Mock implementation - would integrate with Firebase
    const mockAchievements: UserAchievement[] = [];
    this.userAchievements.set(userId, mockAchievements);
  }

  /**
   * Save user achievement to storage (mock implementation)
   */
  private async saveUserAchievement(userAchievement: UserAchievement): Promise<void> {
    // Mock implementation - would save to Firebase
    logger.info('Achievement saved', {
      action: 'achievement_saved',
      achievementId: userAchievement.achievementId
    });
  }

  /**
   * Save achievement progress to storage (mock implementation)
   */
  private async saveAchievementProgress(userId: UserId, progress: AchievementProgress): Promise<void> {
    // Mock implementation - would save to Firebase
    logger.info('Achievement progress saved', {
      action: 'achievement_progress_saved',
      userId,
      achievementId: progress.achievementId,
      progress: progress.progress
    });
  }

  /**
   * Generate smart achievement recommendations
   */
  generateRecommendations(userId: UserId): AchievementRecommendation[] {
    const userStats = this.getUserStats(userId);
    const userProgressMap = this.achievementProgress.get(userId);
    const recommendations: AchievementRecommendation[] = [];

    // Recommend achievements based on current progress
    Object.values(ACHIEVEMENTS).forEach(achievement => {
      if (this.isAchievementUnlocked(userId, achievement.id) && !achievement.isRepeatable) {
        return; // Skip completed non-repeatable achievements
      }

      const progress = userProgressMap?.get(achievement.id);
      if (progress && progress.progress > 25) {
        const difficulty = this.calculateAchievementDifficulty(achievement, progress);
        const estimatedTime = this.estimateTimeToComplete(achievement, progress);
        
        recommendations.push({
          achievement,
          difficulty,
          estimatedTime,
          reasoning: this.generateRecommendationReasoning(achievement, progress, userStats),
          priority: this.calculateRecommendationPriority(achievement, progress, userStats),
          prerequisites: this.getPrerequisiteAchievements(achievement)
        });
      }
    });

    // Sort by priority and return top recommendations
    return recommendations
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5);
  }

  private calculateAchievementDifficulty(achievement: Achievement, progress: AchievementProgress): 'easy' | 'medium' | 'hard' {
    if (progress.progress > 75) return 'easy';
    if (progress.progress > 25) return 'medium';
    return 'hard';
  }

  private estimateTimeToComplete(achievement: Achievement, progress: AchievementProgress): number {
    const remaining = 100 - progress.progress;
    const baseTime = achievement.rarity === 'common' ? 2 : 
                    achievement.rarity === 'uncommon' ? 5 : 
                    achievement.rarity === 'rare' ? 10 : 
                    achievement.rarity === 'epic' ? 20 : 50;
    
    return Math.ceil((remaining / 100) * baseTime);
  }

  private generateRecommendationReasoning(
    achievement: Achievement, 
    progress: AchievementProgress, 
    userStats: AchievementStats
  ): string {
    const progressPercent = Math.round(progress.progress);
    
    if (progressPercent > 75) {
      return `You're ${progressPercent}% complete! Just a little more effort to unlock this ${achievement.rarity} achievement.`;
    }
    
    if (achievement.category === AchievementCategory.STREAK && userStats.streakAchievements < 2) {
      return 'Building consistency in your learning routine will unlock powerful streak bonuses.';
    }
    
    return `This ${achievement.category} achievement will boost your learning profile and earn ${achievement.points} points.`;
  }

  private calculateRecommendationPriority(
    achievement: Achievement, 
    progress: AchievementProgress, 
    userStats: AchievementStats
  ): number {
    let priority = 5; // Base priority
    
    // Higher priority for nearly complete achievements
    priority += progress.progress * 0.05;
    
    // Higher priority for rare achievements
    const rarityBonus = achievement.rarity === 'legendary' ? 3 : 
                      achievement.rarity === 'epic' ? 2 : 
                      achievement.rarity === 'rare' ? 1 : 0;
    priority += rarityBonus;
    
    // Higher priority for categories user is weak in
    const categoryCount = userStats.categoryBreakdown[achievement.category];
    if (categoryCount === 0) priority += 2;
    
    return Math.min(priority, 10);
  }

  private getPrerequisiteAchievements(achievement: Achievement): Achievement[] {
    if (!achievement.prerequisiteAchievements) return [];
    
    return achievement.prerequisiteAchievements
      .map(id => Object.values(ACHIEVEMENTS).find(a => a.id === id))
      .filter(Boolean) as Achievement[];
  }
}

// Global achievement engine instance
export const achievementEngine = new AchievementEngine();