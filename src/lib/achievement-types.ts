/**
 * SkillForge AI - Smart Achievement System Types
 * Comprehensive type definitions for intelligent achievement system
 */

import { SkillId, UserId } from './types';

export type AchievementId = string & { readonly _brand: unique symbol };
export type BadgeId = string & { readonly _brand: unique symbol };

export enum AchievementCategory {
  LEARNING = 'learning',
  PROGRESS = 'progress', 
  STREAK = 'streak',
  MASTERY = 'mastery',
  SOCIAL = 'social',
  SPECIAL = 'special',
  MILESTONE = 'milestone'
}

export enum AchievementRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon', 
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export enum AchievementType {
  // Learning achievements
  FIRST_SKILL_COMPLETED = 'first_skill_completed',
  SKILLS_COMPLETED = 'skills_completed',
  CATEGORY_MASTERY = 'category_mastery',
  PERFECT_SCORE = 'perfect_score',
  RAPID_LEARNER = 'rapid_learner',
  
  // Progress achievements  
  DAILY_GOAL = 'daily_goal',
  WEEKLY_GOAL = 'weekly_goal',
  MONTHLY_GOAL = 'monthly_goal',
  TOTAL_XP = 'total_xp',
  LEVEL_UP = 'level_up',
  
  // Streak achievements
  LEARNING_STREAK = 'learning_streak',
  PERFECT_WEEK = 'perfect_week',
  CONSISTENCY_CHAMPION = 'consistency_champion',
  
  // Mastery achievements
  SKILL_TREE_COMPLETE = 'skill_tree_complete',
  EXPERTISE_UNLOCKED = 'expertise_unlocked',
  KNOWLEDGE_MASTER = 'knowledge_master',
  
  // Social achievements
  COMMUNITY_HELPER = 'community_helper',
  TOP_PERFORMER = 'top_performer',
  MENTOR = 'mentor',
  
  // Special achievements
  SPEED_DEMON = 'speed_demon',
  PERFECTIONIST = 'perfectionist',
  EXPLORER = 'explorer',
  EARLY_ADOPTER = 'early_adopter',
  
  // Milestone achievements
  FIRST_100 = 'first_100',
  SKILL_COLLECTOR = 'skill_collector',
  DEDICATION = 'dedication'
}

export interface AchievementCriteria {
  readonly type: AchievementType;
  readonly target?: number;
  readonly category?: string;
  readonly skillIds?: SkillId[];
  readonly timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  readonly conditions?: Record<string, any>;
}

export interface Achievement {
  readonly id: AchievementId;
  readonly type: AchievementType;
  readonly category: AchievementCategory;
  readonly rarity: AchievementRarity;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly badgeIcon?: string;
  readonly points: number;
  readonly criteria: AchievementCriteria;
  readonly unlocksAt?: number; // User level requirement
  readonly prerequisiteAchievements?: AchievementId[];
  readonly isHidden?: boolean; // Secret achievements
  readonly isRepeatable?: boolean;
  readonly maxRepeats?: number;
  readonly createdAt: Date;
  readonly metadata?: Record<string, any>;
}

export interface UserAchievement {
  readonly id: string;
  readonly userId: UserId;
  readonly achievementId: AchievementId;
  readonly unlockedAt: Date;
  readonly progress: number; // 0-100 percentage
  readonly isCompleted: boolean;
  readonly repeatCount?: number;
  readonly metadata?: Record<string, any>;
  readonly notificationShown?: boolean;
}

export interface AchievementProgress {
  readonly achievementId: AchievementId;
  readonly currentValue: number;
  readonly targetValue: number;
  readonly progress: number; // 0-100 percentage
  readonly isCompleted: boolean;
  readonly estimatedCompletion?: Date;
}

export interface AchievementStats {
  readonly totalAchievements: number;
  readonly totalUnlocked: number;
  readonly totalPoints: number;
  readonly completionRate: number;
  readonly rareAchievements: number;
  readonly streakAchievements: number;
  readonly recentUnlocks: UserAchievement[];
  readonly nextToUnlock: Achievement[];
  readonly categoryBreakdown: Record<AchievementCategory, number>;
}

export interface AchievementNotification {
  readonly id: string;
  readonly userId: UserId;
  readonly achievement: Achievement;
  readonly type: 'unlock' | 'progress' | 'milestone';
  readonly message: string;
  readonly timestamp: Date;
  readonly isRead: boolean;
  readonly priority: 'low' | 'medium' | 'high';
}

// Smart achievement recommendation system
export interface AchievementRecommendation {
  readonly achievement: Achievement;
  readonly difficulty: 'easy' | 'medium' | 'hard';
  readonly estimatedTime: number; // hours
  readonly reasoning: string;
  readonly priority: number; // 1-10
  readonly prerequisites: Achievement[];
}

// Achievement unlock detection events
export interface AchievementTrigger {
  readonly userId: UserId;
  readonly eventType: 'skill_completed' | 'quiz_finished' | 'streak_updated' | 'xp_gained' | 'level_up';
  readonly eventData: Record<string, any>;
  readonly timestamp: Date;
}

// Leaderboard integration
export interface AchievementLeaderboardEntry {
  readonly userId: UserId;
  readonly username: string;
  readonly avatar?: string;
  readonly totalAchievements: number;
  readonly totalPoints: number;
  readonly rareAchievements: number;
  readonly rank: number;
}

// Badge system for displaying achievements
export interface Badge {
  readonly id: BadgeId;
  readonly achievementId: AchievementId;
  readonly name: string;
  readonly icon: string;
  readonly color: string;
  readonly shape: 'circle' | 'shield' | 'star' | 'hexagon';
  readonly animated?: boolean;
  readonly glowEffect?: boolean;
}