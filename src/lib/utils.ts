import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { User, Skill, QuizQuestion } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Skill-related utilities
export const getSkillStatus = (skill: Skill, user: User): 'completed' | 'available' | 'locked' | 'secret' => {
  const competence = user.competences[skill.id];
  if (competence?.completed) return 'completed';
  
  const prereqsMet = !skill.prereqs || skill.prereqs.every(id => user.competences[id]?.completed);
  if (prereqsMet) return 'available';

  return skill.isSecret ? 'secret' : 'locked';
}

export const getAvailableSkills = (skills: Skill[], user: User): Skill[] => {
  return skills.filter(skill => {
    const status = getSkillStatus(skill, user);
    return status === 'available';
  });
}

export const getCompletedSkills = (skills: Skill[], user: User): Skill[] => {
  return skills.filter(skill => getSkillStatus(skill, user) === 'completed');
}

// User level and XP utilities
export const calculateUserLevel = (totalPoints: number): number => {
  return Math.floor(totalPoints / 1000) + 1;
}

export const getXPForNextLevel = (currentLevel: number): number => {
  return currentLevel * 1000;
}

export const getProgressToNextLevel = (totalPoints: number): { progress: number; nextLevelXP: number } => {
  const currentLevel = calculateUserLevel(totalPoints);
  const nextLevelXP = getXPForNextLevel(currentLevel);
  const currentLevelXP = (currentLevel - 1) * 1000;
  const progress = ((totalPoints - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  
  return { progress: Math.min(progress, 100), nextLevelXP };
}

// Performance utilities
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T => {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
}

export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T => {
  let lastCall = 0;
  return ((...args: any[]) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  }) as T;
}

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export const isValidPassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return { valid: errors.length === 0, errors };
}

// Error handling utilities
export const createError = (code: string, message: string, context?: Record<string, any>) => {
  return {
    code,
    message,
    context,
    timestamp: new Date()
  };
}

export const handleAsyncError = async <T>(
  asyncFn: () => Promise<T>,
  fallback?: T
): Promise<T | null> => {
  try {
    return await asyncFn();
  } catch (error) {
    console.error('Async operation failed:', error);
    return fallback ?? null;
  }
}

// Local storage utilities with error handling
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  
  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  
  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
}

// Format utilities
export const formatPoints = (points: number): string => {
  if (points >= 1000000) {
    return `${(points / 1000000).toFixed(1)}M`;
  }
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}K`;
  }
  return points.toString();
}

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
