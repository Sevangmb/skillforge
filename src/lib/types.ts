export type SkillStatus = "completed" | "available" | "locked" | "secret";

export type Skill = {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  category: string;
  position: { x: number; y: number };
  prereqs: string[];
  level: number;
  isSecret: boolean;
};

export type CompetenceStatus = {
  level: number;
  completed: boolean;
};

export type User = {
  id: string;
  profile: {
    displayName: string;
    email: string;
    totalPoints: number;
    level: number;
    isAdmin?: boolean;
  };
  competences: Record<string, CompetenceStatus>;
  preferences: {
    learningStyle: string;
    favoriteTopics: string[];
    adaptiveMode: string;
    language: string;
  };
};

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  questionType?: 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching' | 'scenario';
}

export interface QuizSession {
  skillId: string;
  currentLevel: number;
  questionsAnswered: number;
  correctAnswers: number;
  streak: number;
  totalPoints: number;
  startTime: Date;
}

export interface QuizConfig {
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questionTypes: QuizQuestion['questionType'][];
  timeLimit: number;
  pointsMultiplier: number;
}

// Enhanced error handling types
export interface AppError {
  code: string;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}

export interface LoadingState {
  isLoading: boolean;
  error: AppError | null;
  lastUpdated: Date | null;
}

// Performance monitoring types
export interface PerformanceMetrics {
  renderTime: number;
  dataFetchTime: number;
  componentName: string;
  timestamp: Date;
}

// Achievement types - move from achievements.ts to types.ts for better organization
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'learning' | 'social' | 'milestone' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
  xpReward: number;
  condition: {
    type: 'skills_completed' | 'total_xp' | 'streak_days' | 'perfect_quizzes' | 'first_skill';
    value: number;
  };
}
