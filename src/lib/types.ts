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
