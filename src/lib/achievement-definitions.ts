/**
 * SkillForge AI - Achievement Definitions
 * Complete catalog of achievements available in the learning system
 */

import {
  Achievement,
  AchievementId,
  AchievementType,
  AchievementCategory,
  AchievementRarity,
  AchievementCriteria
} from './achievement-types';

export const ACHIEVEMENTS: Record<AchievementType, Achievement> = {
  // Learning Achievements
  [AchievementType.FIRST_SKILL_COMPLETED]: {
    id: 'ach_first_skill' as AchievementId,
    type: AchievementType.FIRST_SKILL_COMPLETED,
    category: AchievementCategory.LEARNING,
    rarity: AchievementRarity.COMMON,
    title: 'First Steps',
    description: 'Complete your first skill and begin your learning journey',
    icon: '🎯',
    badgeIcon: '🥇',
    points: 50,
    criteria: {
      type: AchievementType.FIRST_SKILL_COMPLETED,
      target: 1
    },
    createdAt: new Date()
  },

  [AchievementType.SKILLS_COMPLETED]: {
    id: 'ach_skills_5' as AchievementId,
    type: AchievementType.SKILLS_COMPLETED,
    category: AchievementCategory.LEARNING,
    rarity: AchievementRarity.COMMON,
    title: 'Quick Learner',
    description: 'Master 5 different skills',
    icon: '📚',
    points: 100,
    criteria: {
      type: AchievementType.SKILLS_COMPLETED,
      target: 5
    },
    isRepeatable: true,
    maxRepeats: 10,
    createdAt: new Date()
  },

  [AchievementType.CATEGORY_MASTERY]: {
    id: 'ach_category_master' as AchievementId,
    type: AchievementType.CATEGORY_MASTERY,
    category: AchievementCategory.MASTERY,
    rarity: AchievementRarity.RARE,
    title: 'Category Master',
    description: 'Complete all skills in a single category',
    icon: '👑',
    points: 300,
    criteria: {
      type: AchievementType.CATEGORY_MASTERY,
      target: 100 // 100% of category completed
    },
    isRepeatable: true,
    createdAt: new Date()
  },

  [AchievementType.PERFECT_SCORE]: {
    id: 'ach_perfect_score' as AchievementId,
    type: AchievementType.PERFECT_SCORE,
    category: AchievementCategory.LEARNING,
    rarity: AchievementRarity.UNCOMMON,
    title: 'Perfectionist',
    description: 'Achieve a perfect score on 3 different quizzes',
    icon: '⭐',
    points: 150,
    criteria: {
      type: AchievementType.PERFECT_SCORE,
      target: 3,
      conditions: { minScore: 100 }
    },
    createdAt: new Date()
  },

  [AchievementType.RAPID_LEARNER]: {
    id: 'ach_rapid_learner' as AchievementId,
    type: AchievementType.RAPID_LEARNER,
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.EPIC,
    title: 'Speed Demon',
    description: 'Complete 3 skills in under 30 minutes each',
    icon: '⚡',
    points: 250,
    criteria: {
      type: AchievementType.RAPID_LEARNER,
      target: 3,
      conditions: { maxTimeMinutes: 30 }
    },
    createdAt: new Date()
  },

  // Progress Achievements
  [AchievementType.DAILY_GOAL]: {
    id: 'ach_daily_goal' as AchievementId,
    type: AchievementType.DAILY_GOAL,
    category: AchievementCategory.PROGRESS,
    rarity: AchievementRarity.COMMON,
    title: 'Daily Achiever',
    description: 'Complete your daily learning goal',
    icon: '☀️',
    points: 25,
    criteria: {
      type: AchievementType.DAILY_GOAL,
      target: 1,
      timeframe: 'daily'
    },
    isRepeatable: true,
    createdAt: new Date()
  },

  [AchievementType.WEEKLY_GOAL]: {
    id: 'ach_weekly_goal' as AchievementId,
    type: AchievementType.WEEKLY_GOAL,
    category: AchievementCategory.PROGRESS,
    rarity: AchievementRarity.UNCOMMON,
    title: 'Week Warrior',
    description: 'Complete your weekly learning goal',
    icon: '📅',
    points: 100,
    criteria: {
      type: AchievementType.WEEKLY_GOAL,
      target: 5,
      timeframe: 'weekly'
    },
    isRepeatable: true,
    createdAt: new Date()
  },

  [AchievementType.TOTAL_XP]: {
    id: 'ach_total_xp_1000' as AchievementId,
    type: AchievementType.TOTAL_XP,
    category: AchievementCategory.MILESTONE,
    rarity: AchievementRarity.UNCOMMON,
    title: 'Knowledge Seeker',
    description: 'Earn 1,000 total experience points',
    icon: '💎',
    points: 200,
    criteria: {
      type: AchievementType.TOTAL_XP,
      target: 1000
    },
    isRepeatable: true,
    maxRepeats: 20,
    createdAt: new Date()
  },

  [AchievementType.LEVEL_UP]: {
    id: 'ach_level_up' as AchievementId,
    type: AchievementType.LEVEL_UP,
    category: AchievementCategory.PROGRESS,
    rarity: AchievementRarity.COMMON,
    title: 'Level Up!',
    description: 'Advance to the next learning level',
    icon: '🆙',
    points: 75,
    criteria: {
      type: AchievementType.LEVEL_UP,
      target: 1
    },
    isRepeatable: true,
    createdAt: new Date()
  },

  [AchievementType.MONTHLY_GOAL]: {
    id: 'ach_monthly_goal' as AchievementId,
    type: AchievementType.MONTHLY_GOAL,
    category: AchievementCategory.PROGRESS,
    rarity: AchievementRarity.RARE,
    title: 'Month Master',
    description: 'Complete your monthly learning goal',
    icon: '🏆',
    points: 500,
    criteria: {
      type: AchievementType.MONTHLY_GOAL,
      target: 20,
      timeframe: 'monthly'
    },
    isRepeatable: true,
    createdAt: new Date()
  },

  // Streak Achievements
  [AchievementType.LEARNING_STREAK]: {
    id: 'ach_streak_7' as AchievementId,
    type: AchievementType.LEARNING_STREAK,
    category: AchievementCategory.STREAK,
    rarity: AchievementRarity.UNCOMMON,
    title: 'Week Streak',
    description: 'Learn for 7 consecutive days',
    icon: '🔥',
    points: 150,
    criteria: {
      type: AchievementType.LEARNING_STREAK,
      target: 7
    },
    isRepeatable: true,
    maxRepeats: 10,
    createdAt: new Date()
  },

  [AchievementType.PERFECT_WEEK]: {
    id: 'ach_perfect_week' as AchievementId,
    type: AchievementType.PERFECT_WEEK,
    category: AchievementCategory.STREAK,
    rarity: AchievementRarity.RARE,
    title: 'Perfect Week',
    description: 'Complete daily goals for 7 straight days',
    icon: '💫',
    points: 300,
    criteria: {
      type: AchievementType.PERFECT_WEEK,
      target: 7,
      conditions: { consecutiveDays: true }
    },
    isRepeatable: true,
    createdAt: new Date()
  },

  [AchievementType.CONSISTENCY_CHAMPION]: {
    id: 'ach_consistency' as AchievementId,
    type: AchievementType.CONSISTENCY_CHAMPION,
    category: AchievementCategory.STREAK,
    rarity: AchievementRarity.EPIC,
    title: 'Consistency Champion',
    description: 'Maintain a 30-day learning streak',
    icon: '🏅',
    points: 750,
    criteria: {
      type: AchievementType.CONSISTENCY_CHAMPION,
      target: 30
    },
    isRepeatable: true,
    maxRepeats: 5,
    createdAt: new Date()
  },

  // Mastery Achievements
  [AchievementType.SKILL_TREE_COMPLETE]: {
    id: 'ach_tree_complete' as AchievementId,
    type: AchievementType.SKILL_TREE_COMPLETE,
    category: AchievementCategory.MASTERY,
    rarity: AchievementRarity.LEGENDARY,
    title: 'Tree Master',
    description: 'Complete an entire skill tree',
    icon: '🌟',
    points: 1000,
    criteria: {
      type: AchievementType.SKILL_TREE_COMPLETE,
      target: 1
    },
    createdAt: new Date()
  },

  [AchievementType.EXPERTISE_UNLOCKED]: {
    id: 'ach_expertise' as AchievementId,
    type: AchievementType.EXPERTISE_UNLOCKED,
    category: AchievementCategory.MASTERY,
    rarity: AchievementRarity.RARE,
    title: 'Expert Status',
    description: 'Reach expert level in any skill category',
    icon: '🎓',
    points: 400,
    criteria: {
      type: AchievementType.EXPERTISE_UNLOCKED,
      target: 1,
      conditions: { minLevel: 5 }
    },
    isRepeatable: true,
    createdAt: new Date()
  },

  [AchievementType.KNOWLEDGE_MASTER]: {
    id: 'ach_knowledge_master' as AchievementId,
    type: AchievementType.KNOWLEDGE_MASTER,
    category: AchievementCategory.MASTERY,
    rarity: AchievementRarity.LEGENDARY,
    title: 'Knowledge Master',
    description: 'Achieve mastery in 3 different categories',
    icon: '🧠',
    points: 1500,
    criteria: {
      type: AchievementType.KNOWLEDGE_MASTER,
      target: 3,
      conditions: { categoryMastery: true }
    },
    createdAt: new Date()
  },

  // Social Achievements
  [AchievementType.COMMUNITY_HELPER]: {
    id: 'ach_community_helper' as AchievementId,
    type: AchievementType.COMMUNITY_HELPER,
    category: AchievementCategory.SOCIAL,
    rarity: AchievementRarity.UNCOMMON,
    title: 'Community Helper',
    description: 'Help other learners by sharing knowledge',
    icon: '🤝',
    points: 200,
    criteria: {
      type: AchievementType.COMMUNITY_HELPER,
      target: 5,
      conditions: { helpActions: true }
    },
    isRepeatable: true,
    createdAt: new Date()
  },

  [AchievementType.TOP_PERFORMER]: {
    id: 'ach_top_performer' as AchievementId,
    type: AchievementType.TOP_PERFORMER,
    category: AchievementCategory.SOCIAL,
    rarity: AchievementRarity.EPIC,
    title: 'Top Performer',
    description: 'Reach top 10 on the leaderboard',
    icon: '🥇',
    points: 500,
    criteria: {
      type: AchievementType.TOP_PERFORMER,
      target: 10,
      conditions: { leaderboardRank: true }
    },
    createdAt: new Date()
  },

  [AchievementType.MENTOR]: {
    id: 'ach_mentor' as AchievementId,
    type: AchievementType.MENTOR,
    category: AchievementCategory.SOCIAL,
    rarity: AchievementRarity.RARE,
    title: 'Mentor',
    description: 'Guide and inspire 10 other learners',
    icon: '👨‍🏫',
    points: 400,
    criteria: {
      type: AchievementType.MENTOR,
      target: 10,
      conditions: { mentoredUsers: true }
    },
    createdAt: new Date()
  },

  // Special Achievements
  [AchievementType.SPEED_DEMON]: {
    id: 'ach_speed_demon' as AchievementId,
    type: AchievementType.SPEED_DEMON,
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.RARE,
    title: 'Speed Demon',
    description: 'Complete 5 quizzes in record time',
    icon: '💨',
    points: 350,
    criteria: {
      type: AchievementType.SPEED_DEMON,
      target: 5,
      conditions: { recordTime: true }
    },
    createdAt: new Date()
  },

  [AchievementType.PERFECTIONIST]: {
    id: 'ach_perfectionist' as AchievementId,
    type: AchievementType.PERFECTIONIST,
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.EPIC,
    title: 'Absolute Perfectionist',
    description: 'Achieve perfect scores on 10 consecutive quizzes',
    icon: '💯',
    points: 600,
    criteria: {
      type: AchievementType.PERFECTIONIST,
      target: 10,
      conditions: { consecutive: true, perfectScore: true }
    },
    createdAt: new Date()
  },

  [AchievementType.EXPLORER]: {
    id: 'ach_explorer' as AchievementId,
    type: AchievementType.EXPLORER,
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.UNCOMMON,
    title: 'Explorer',
    description: 'Try skills from 5 different categories',
    icon: '🗺️',
    points: 250,
    criteria: {
      type: AchievementType.EXPLORER,
      target: 5,
      conditions: { differentCategories: true }
    },
    createdAt: new Date()
  },

  [AchievementType.EARLY_ADOPTER]: {
    id: 'ach_early_adopter' as AchievementId,
    type: AchievementType.EARLY_ADOPTER,
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.LEGENDARY,
    title: 'Early Adopter',
    description: 'One of the first 100 users to join SkillForge',
    icon: '🚀',
    points: 1000,
    criteria: {
      type: AchievementType.EARLY_ADOPTER,
      target: 1,
      conditions: { userRegistrationOrder: 100 }
    },
    isHidden: true,
    createdAt: new Date()
  },

  // Milestone Achievements
  [AchievementType.FIRST_100]: {
    id: 'ach_first_100' as AchievementId,
    type: AchievementType.FIRST_100,
    category: AchievementCategory.MILESTONE,
    rarity: AchievementRarity.UNCOMMON,
    title: 'Centurion',
    description: 'Earn your first 100 experience points',
    icon: '💯',
    points: 50,
    criteria: {
      type: AchievementType.FIRST_100,
      target: 100
    },
    createdAt: new Date()
  },

  [AchievementType.SKILL_COLLECTOR]: {
    id: 'ach_collector' as AchievementId,
    type: AchievementType.SKILL_COLLECTOR,
    category: AchievementCategory.MILESTONE,
    rarity: AchievementRarity.RARE,
    title: 'Skill Collector',
    description: 'Complete 25 different skills',
    icon: '🎁',
    points: 500,
    criteria: {
      type: AchievementType.SKILL_COLLECTOR,
      target: 25
    },
    isRepeatable: true,
    maxRepeats: 4,
    createdAt: new Date()
  },

  [AchievementType.DEDICATION]: {
    id: 'ach_dedication' as AchievementId,
    type: AchievementType.DEDICATION,
    category: AchievementCategory.MILESTONE,
    rarity: AchievementRarity.LEGENDARY,
    title: 'Dedication',
    description: 'Spend 100 hours learning on SkillForge',
    icon: '⏰',
    points: 2000,
    criteria: {
      type: AchievementType.DEDICATION,
      target: 100,
      conditions: { totalHours: true }
    },
    createdAt: new Date()
  }
};

// Helper functions
export function getAchievementById(id: AchievementId): Achievement | null {
  return Object.values(ACHIEVEMENTS).find(achievement => achievement.id === id) || null;
}

export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return Object.values(ACHIEVEMENTS).filter(achievement => achievement.category === category);
}

export function getAchievementsByRarity(rarity: AchievementRarity): Achievement[] {
  return Object.values(ACHIEVEMENTS).filter(achievement => achievement.rarity === rarity);
}

export function getVisibleAchievements(): Achievement[] {
  return Object.values(ACHIEVEMENTS).filter(achievement => !achievement.isHidden);
}

export function getRepeatableAchievements(): Achievement[] {
  return Object.values(ACHIEVEMENTS).filter(achievement => achievement.isRepeatable);
}