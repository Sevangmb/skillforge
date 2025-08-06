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

export type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

// Types pour le système de parcours de quiz dynamique
export type QuizPath = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // en minutes
  totalSteps: number;
  currentStep: number;
  isCompleted: boolean;
  unlockDate: Date;
  createdByAI: boolean;
  prerequisites?: string[]; // IDs d'autres parcours requis
  tags: string[];
};

export type QuizStep = {
  id: string;
  pathId: string;
  stepNumber: number;
  type: 'quiz' | 'lesson' | 'challenge' | 'review';
  title: string;
  content?: string; // Pour les leçons
  questions?: QuizQuestion[];
  isCompleted: boolean;
  completedAt?: Date;
  score?: number;
  timeSpent?: number; // en secondes
  attempts: number;
  maxAttempts: number;
  pointsReward: number;
};

export type DailyQuizChallenge = {
  id: string;
  date: string; // Format YYYY-MM-DD
  userId: string;
  pathId: string;
  stepId: string;
  isCompleted: boolean;
  completedAt?: Date;
  score?: number;
  streakCount: number;
  bonusPointsEarned: number;
};

export type QuizPathProgress = {
  userId: string;
  pathId: string;
  currentStepId: string;
  completedSteps: string[];
  totalScore: number;
  startedAt: Date;
  lastActivityAt: Date;
  estimatedCompletion?: Date;
  difficultyAdjustments: number; // -2 à +2 pour ajuster la difficulté
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  category: 'skill' | 'progress' | 'streak' | 'special';
};

export type SystemError = {
  code: string;
  message: string;
  context?: Record<string, any>;
  timestamp: Date;
};
