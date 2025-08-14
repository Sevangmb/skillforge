/**
 * Status states for skills in the learning tree
 */
export type SkillStatus = "completed" | "available" | "locked" | "secret";

/**
 * Categories for skill organization and filtering
 */
export type SkillCategory = "Évaluation" | "Mathématiques" | "Sciences" | "Informatique" | "Langues" | "Compétences transversales";

/**
 * Learning styles for user preferences
 */
export type LearningStyle = "Visual" | "Auditory" | "Kinesthetic" | "Reading";

/**
 * Adaptive modes for personalized learning
 */
export type AdaptiveMode = "Focus" | "Explore" | "Challenge" | "Default";

/**
 * Branded types for enhanced type safety
 */
export type SkillId = string & { readonly brand: unique symbol };
export type UserId = string & { readonly brand: unique symbol };
export type CategoryName = string & { readonly brand: unique symbol };

/**
 * Utility types for enhanced functionality
 */
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * Result type for error handling
 */
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * System error with additional context
 */
export interface SystemError extends Error {
  readonly id: string;
  readonly code: string;
  readonly context?: Record<string, unknown>;
  readonly timestamp: Date;
}

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  timing: {
    navigationStart: number;
    domContentLoaded: number;
    loadComplete: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
    firstInputDelay?: number;
    cumulativeLayoutShift?: number;
  };
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  network: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  };
}

/**
 * Position in the skill tree visualization
 */
export interface Position {
  readonly x: number;
  readonly y: number;
}

/**
 * Core skill entity representing a learning unit
 */
export interface Skill {
  readonly id: SkillId;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly cost: number;
  readonly category: SkillCategory;
  readonly position: Position;
  readonly prereqs: readonly SkillId[];
  readonly level: number;
  readonly isSecret: boolean;
  readonly difficulty?: DifficultyLevel;
}

/**
 * User's competence level and completion status for a skill
 */
export interface CompetenceStatus {
  readonly level: number;
  readonly completed: boolean;
  readonly completedAt?: Date;
  readonly lastAttempt?: Date;
  readonly averageScore?: number;
  readonly attempts?: number;
}

/**
 * User profile information
 */
export interface UserProfile {
  readonly displayName: string;
  readonly email: string;
  readonly totalPoints: number;
  readonly level: number;
  readonly isAdmin?: boolean;
  readonly createdAt?: Date;
  readonly lastLoginAt?: Date;
  readonly avatar?: string;
  readonly joinedAt?: Date;
  readonly lastLogin?: Date;
}

/**
 * User learning preferences and settings
 */
export interface UserPreferences {
  readonly learningStyle: LearningStyle;
  readonly favoriteTopics: readonly SkillCategory[];
  readonly adaptiveMode: AdaptiveMode;
  readonly language: 'en' | 'fr' | 'es' | 'de';
  readonly notificationsEnabled?: boolean;
  readonly dailyChallengeReminder?: boolean;
  readonly notifications?: {
    email?: boolean;
    push?: boolean;
    achievements?: boolean;
    reminders?: boolean;
  };
}

export type SupportedLanguage = 'en' | 'fr' | 'es' | 'de';

/**
 * Complete user entity with all associated data
 */
export interface User {
  readonly uid: UserId;
  readonly id: UserId;
  readonly profile: UserProfile;
  readonly competences: Readonly<Record<string, CompetenceStatus>>;
  readonly preferences: UserPreferences;
  readonly level?: number;
  readonly totalPoints?: number;
  readonly email?: string;
}

/**
 * Branded types for quiz system type safety
 */
export type QuizId = string & { readonly brand: unique symbol };
export type PathId = string & { readonly brand: unique symbol };
export type StepId = string & { readonly brand: unique symbol };
export type AchievementId = string & { readonly brand: unique symbol };

/**
 * Single quiz question with answer validation
 */
export interface QuizQuestion {
  readonly question: string;
  readonly options: readonly string[];
  readonly correctAnswer: number;
  readonly explanation: string;
}

/**
 * Difficulty levels for learning content
 */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * Dynamic quiz learning path with AI generation capabilities
 */
export interface QuizPath {
  readonly id: PathId;
  readonly title: string;
  readonly description: string;
  readonly category: SkillCategory;
  readonly difficulty: DifficultyLevel;
  /** Duration in minutes */
  readonly estimatedDuration: number;
  readonly totalSteps: number;
  readonly currentStep: number;
  readonly isCompleted: boolean;
  readonly steps: readonly QuizStep[];
  readonly pointsToEarn: number;
  readonly unlockDate: Date;
  readonly createdByAI: boolean;
  /** IDs of prerequisite paths */
  readonly prerequisites?: readonly PathId[];
  readonly tags: readonly string[];
}

/**
 * Types of learning content in quiz paths
 */
export type StepType = 'quiz' | 'lesson' | 'challenge' | 'review';

/**
 * Individual step within a quiz path
 */
export interface QuizStep {
  readonly id: StepId;
  readonly pathId: PathId;
  readonly stepNumber: number;
  readonly type: StepType;
  readonly title: string;
  /** Content for lesson-type steps */
  readonly content?: string;
  /** Questions for quiz-type steps */
  readonly questions?: readonly QuizQuestion[];
  readonly isCompleted: boolean;
  readonly skillId?: SkillId;
  readonly completedAt?: Date;
  readonly score?: number;
  /** Time spent in seconds */
  readonly timeSpent?: number;
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly pointsReward: number;
}

/**
 * Daily challenge system for user engagement
 */
export interface DailyQuizChallenge {
  readonly id: QuizId;
  /** Date in YYYY-MM-DD format */
  readonly date: string;
  readonly userId: UserId;
  readonly pathId: PathId;
  readonly stepId: StepId;
  readonly isCompleted: boolean;
  readonly completedAt?: Date;
  readonly score?: number;
  readonly streakCount: number;
  readonly bonusPointsEarned: number;
}

/**
 * User progress tracking within a quiz path
 */
export interface QuizPathProgress {
  readonly userId: UserId;
  readonly pathId: PathId;
  readonly currentStepId: StepId;
  readonly completedSteps: readonly StepId[];
  readonly totalScore: number;
  readonly startedAt: Date;
  readonly lastActivityAt: Date;
  readonly estimatedCompletion?: Date;
  /** Difficulty adjustment from -2 to +2 */
  readonly difficultyAdjustments: number;
}

/**
 * Achievement categories for user rewards
 */
export type AchievementCategory = 'skill' | 'progress' | 'streak' | 'special';

/**
 * User achievement and reward system
 */
export interface Achievement {
  readonly id: AchievementId;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly unlockedAt: Date;
  readonly category: AchievementCategory;
}

/**
 * System error tracking and debugging
 */
export interface SystemError {
  readonly code: string;
  readonly message: string;
  readonly context?: Record<string, unknown>;
  readonly timestamp: Date;
}

/**
 * Type guards for runtime type checking
 */
export const isSkillId = (value: unknown): value is SkillId => 
  typeof value === 'string' && value.length > 0;

export const isUserId = (value: unknown): value is UserId => 
  typeof value === 'string' && value.length > 0;

export const isPathId = (value: unknown): value is PathId => 
  typeof value === 'string' && value.length > 0;

export const isStepId = (value: unknown): value is StepId => 
  typeof value === 'string' && value.length > 0;

/**
 * Type assertion helpers for branded types
 */
export const createSkillId = (id: string): SkillId => id as SkillId;
export const createUserId = (id: string): UserId => id as UserId;
export const createPathId = (id: string): PathId => id as PathId;
export const createStepId = (id: string): StepId => id as StepId;
export const createAchievementId = (id: string): AchievementId => id as AchievementId;

/**
 * Validation helpers for complex types
 */
export const isValidSkillStatus = (status: string): status is SkillStatus => 
  ['completed', 'available', 'locked', 'secret'].includes(status);

export const isValidDifficultyLevel = (level: string): level is DifficultyLevel => 
  ['beginner', 'intermediate', 'advanced'].includes(level);

export const isValidStepType = (type: string): type is StepType => 
  ['quiz', 'lesson', 'challenge', 'review'].includes(type);

export const isValidLearningStyle = (style: string): style is LearningStyle => 
  ['Visual', 'Auditory', 'Kinesthetic', 'Reading'].includes(style);

export const isValidAdaptiveMode = (mode: string): mode is AdaptiveMode => 
  ['Focus', 'Explore', 'Challenge', 'Default'].includes(mode);

export const isValidLanguage = (lang: string): lang is 'en' | 'fr' | 'es' | 'de' => 
  ['en', 'fr', 'es', 'de'].includes(lang);


/**
 * Helper functions to create Result types
 */
export const createSuccess = <T>(data: T): Result<T, never> => ({
  success: true,
  data,
});

export const createFailure = <E>(error: E): Result<never, E> => ({
  success: false,
  error,
});
