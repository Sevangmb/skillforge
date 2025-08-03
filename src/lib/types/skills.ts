// Extended skill and testing system types
export type SkillDomain = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  level: number; // General level (1 = beginner, 2 = intermediate, 3 = advanced, 4 = expert)
  isVisible: boolean; // If visible to users
  unlockCriteria?: {
    requiredDomains?: string[]; // Other domains that must be completed
    requiredPoints?: number; // Minimum points needed
    requiredLevel?: number; // Minimum user level
  };
  metadata: {
    estimatedHours: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
  };
};

export type SkillLevel = {
  id: string;
  domainId: string;
  level: number; // Level within the domain (1, 2, 3, etc.)
  name: string;
  description: string;
  objectives: string[]; // What students will learn
  prerequisites: string[]; // Previous level IDs required
  isVisible: boolean; // Only show if previous levels completed
  unlockCriteria: {
    previousLevelSuccess: boolean; // Must pass previous level
    minScore?: number; // Minimum score needed (default 70%)
    requiredSkills?: string[]; // Specific skills that must be mastered
  };
  testConfiguration: {
    questionCount: number; // Number of questions in the test
    timeLimit?: number; // Time limit in minutes (optional)
    passingScore: number; // Percentage needed to pass (e.g., 70)
    maxAttempts?: number; // Maximum attempts allowed
    randomizeQuestions: boolean;
    randomizeOptions: boolean;
  };
  rewards: {
    points: number; // Points awarded on completion
    unlocksNext: boolean; // Unlocks next level
    unlocksSkills?: string[]; // Specific skills unlocked
    badges?: string[]; // Badges awarded
  };
  metadata: {
    estimatedDuration: number; // Minutes to complete
    difficulty: number; // 1-10 difficulty rating
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  };
};

export type SkillTest = {
  id: string;
  domainId: string;
  levelId: string;
  name: string;
  description: string;
  instructions: string;
  questions: SkillQuestion[];
  configuration: {
    questionCount: number;
    timeLimit?: number;
    passingScore: number;
    maxAttempts: number;
    randomizeQuestions: boolean;
    randomizeOptions: boolean;
    showCorrectAnswers: boolean; // After completion
    allowReview: boolean;
  };
  metadata: {
    version: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
  };
};

export type SkillQuestion = {
  id: string;
  testId: string;
  type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'code_completion' | 'drag_drop';
  difficulty: 'easy' | 'medium' | 'hard';
  points: number; // Points for correct answer
  question: string;
  explanation?: string;
  hints?: string[];
  
  // Multiple choice / True-False
  options?: string[];
  correctAnswer?: number | number[]; // Index(es) of correct answer(s)
  
  // Fill in the blank
  blanks?: string[]; // Correct answers for blanks
  
  // Code completion
  codeTemplate?: string;
  expectedOutput?: string;
  
  // Drag and drop
  items?: { id: string; content: string; }[];
  correctOrder?: string[]; // IDs in correct order
  
  metadata: {
    tags: string[];
    estimatedTime: number; // Seconds
    createdBy: string;
    createdAt: Date;
    difficulty_rating?: number; // Actual difficulty based on user performance
  };
};

export type TestAttempt = {
  id: string;
  userId: string;
  testId: string;
  domainId: string;
  levelId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'in_progress' | 'completed' | 'abandoned' | 'expired';
  
  // Results
  score?: number; // Percentage score
  pointsEarned?: number;
  passed?: boolean;
  
  // Detailed answers
  answers: TestAnswer[];
  
  // Time tracking
  timeSpent: number; // Total seconds spent
  timeRemaining?: number; // Seconds remaining when completed
  
  // Analytics
  analytics: {
    questionsByDifficulty: Record<string, { correct: number; total: number; }>;
    averageTimePerQuestion: number;
    struggledQuestions: string[]; // Question IDs where user struggled
    strongAreas: string[]; // Tags where user performed well
    weakAreas: string[]; // Tags where user struggled
  };
  
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
  };
};

export type TestAnswer = {
  questionId: string;
  selectedAnswer?: number | number[] | string | string[];
  isCorrect: boolean;
  pointsEarned: number;
  timeSpent: number; // Seconds spent on this question
  hintsUsed: number;
  attempts: number; // If multiple attempts allowed per question
};

export type UserProgress = {
  userId: string;
  domainProgress: Record<string, DomainProgress>;
  overallStats: {
    totalTests: number;
    testsCompleted: number;
    averageScore: number;
    totalPointsEarned: number;
    domainsUnlocked: number;
    levelsCompleted: number;
    strongestDomain?: string;
    weakestDomain?: string;
  };
  achievements: Achievement[];
  currentPath: {
    currentDomain?: string;
    currentLevel?: string;
    recommendedNext?: string[];
  };
  lastActivity: Date;
};

export type DomainProgress = {
  domainId: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  currentLevel: number;
  levelsCompleted: string[];
  bestScores: Record<string, number>; // levelId -> best score percentage
  totalAttempts: number;
  totalTimeSpent: number; // Minutes
  averageScore: number;
  strengthAreas: string[]; // Tags where user excels
  improvementAreas: string[]; // Tags where user needs work
  unlockedAt?: Date;
  completedAt?: Date;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'score' | 'completion' | 'streak' | 'time' | 'special';
  criteria: {
    domain?: string;
    level?: string;
    minScore?: number;
    streak?: number; // Consecutive successes
    timeLimit?: number; // Complete within time
    special?: string; // Special conditions
  };
  reward: {
    points: number;
    badge: string;
    unlocks?: string[]; // What it unlocks
  };
  earnedAt?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
};

export type SkillTestConfiguration = {
  globalSettings: {
    defaultPassingScore: number; // 70%
    maxAttemptsPerTest: number; // 3
    timePerQuestion: number; // 90 seconds
    pointsPerCorrectAnswer: number; // 10
    enableHints: boolean;
    enablePartialCredit: boolean;
  };
  difficultySettings: {
    easy: { timeMultiplier: 1.5; pointsMultiplier: 0.8; };
    medium: { timeMultiplier: 1.0; pointsMultiplier: 1.0; };
    hard: { timeMultiplier: 0.75; pointsMultiplier: 1.2; };
  };
  progressionRules: {
    minScoreToUnlock: number; // 70% to unlock next level
    allowSkipLevels: boolean; // false - must complete sequentially
    showLockedContent: boolean; // true - show but disable
    retakeDelay: number; // Hours before retake allowed
  };
};