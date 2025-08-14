/**
 * Test utilities for SkillForge components
 * Provides reusable mocks, factories, and test helpers
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import type { User, Skill } from '@/lib/types';

// ==========================================
// MOCK DATA FACTORIES
// ==========================================

/**
 * Creates a mock user with sensible defaults and optional overrides
 */
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-123' as any,
  profile: {
    displayName: 'John Doe',
    email: 'john.doe@example.com',
    totalPoints: 1500,
    level: 5,
    isAdmin: false,
    createdAt: new Date('2024-01-01'),
    lastLoginAt: new Date('2024-08-11'),
    ...overrides.profile,
  },
  competences: {
    'skill-1': {
      level: 3,
      completed: true,
      completedAt: new Date('2024-08-10'),
    },
    'skill-2': {
      level: 2,
      completed: false,
      lastAttempt: new Date('2024-08-09'),
    },
    ...overrides.competences,
  },
  preferences: {
    learningStyle: 'Visual',
    favoriteTopics: ['Mathématiques', 'Sciences'],
    adaptiveMode: 'Focus',
    language: 'fr',
    notificationsEnabled: true,
    dailyChallengeReminder: true,
    ...overrides.preferences,
  },
  ...overrides,
});

/**
 * Creates a mock skill with sensible defaults and optional overrides
 */
export const createMockSkill = (
  id: string,
  overrides: Partial<Skill> = {}
): Skill => ({
  id: id as any,
  name: `Skill ${id}`,
  description: `Description for ${id}`,
  icon: 'calculator',
  cost: 10,
  category: 'Mathématiques',
  position: { x: 100, y: 100 },
  prereqs: [],
  level: 1,
  isSecret: false,
  ...overrides,
});

/**
 * Creates an array of mock skills for testing
 */
export const createMockSkills = (count: number = 3): Skill[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockSkill(`skill-${index + 1}`, {
      position: { x: 100 + index * 100, y: 100 + index * 50 },
      level: Math.floor(index / 2) + 1,
      prereqs: index > 0 ? [`skill-${index}` as any] : [],
    })
  );
};

// ==========================================
// SPECIALIZED USER FACTORIES
// ==========================================

/**
 * Creates a user with no points for edge case testing
 */
export const createUserWithNoPoints = (): User =>
  createMockUser({
    profile: { 
      displayName: 'User with no points',
      email: 'nopoints@example.com',
      totalPoints: 0, 
      level: 1 
    },
    competences: {},
  });

/**
 * Creates an admin user for testing admin features
 */
export const createAdminUser = (): User =>
  createMockUser({
    profile: { 
      displayName: 'Admin User',
      email: 'admin@example.com',
      totalPoints: 2500,
      level: 8,
      isAdmin: true 
    },
  });

/**
 * Creates a user with minimal data for testing edge cases
 */
export const createMinimalUser = (): User =>
  createMockUser({
    profile: {
      displayName: 'Minimal User',
      email: 'minimal@example.com',
      totalPoints: 100,
      level: 1,
    },
    competences: {},
    preferences: {
      learningStyle: 'Visual',
      favoriteTopics: [],
      adaptiveMode: 'Default',
      language: 'en',
    },
  });

/**
 * Creates a user with a long display name for testing truncation
 */
export const createUserWithLongName = (): User =>
  createMockUser({
    profile: {
      displayName: 'This Is A Very Long Display Name That Might Need Truncation',
      email: 'longname@example.com',
      totalPoints: 750,
      level: 3,
    },
  });

// ==========================================
// TEST UTILITIES
// ==========================================

/**
 * Custom render function with isolated containers
 * Prevents DOM collision issues in tests
 */
export const renderIsolated = (
  ui: ReactElement,
  options: RenderOptions = {}
) => {
  const container = document.createElement('div');
  container.setAttribute('data-testid', `test-container-${Date.now()}-${Math.random()}`);
  document.body.appendChild(container);

  const result = render(ui, {
    container,
    ...options,
  });

  // Cleanup function to remove container after test
  const cleanup = () => {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  };

  return { ...result, cleanup };
};

/**
 * Common test patterns for accessibility
 */
export const expectAccessibility = {
  progressBar: (element: HTMLElement) => {
    expect(element).toHaveAttribute('role', 'progressbar');
    expect(element).toHaveAttribute('aria-valuemin');
    expect(element).toHaveAttribute('aria-valuemax');
  },
  
  button: (element: HTMLElement) => {
    expect(element).toHaveAttribute('role', 'button');
    expect(element).toHaveAttribute('tabindex');
  },

  heading: (element: HTMLElement) => {
    expect(element).toHaveProperty('tagName', 'H1' || 'H2' || 'H3' || 'H4' || 'H5' || 'H6');
  },
};

/**
 * Common assertions for user profile components
 */
export const expectUserProfile = {
  displayName: (user: User, container: Element) => {
    expect(container).toHaveTextContent(user.profile.displayName);
  },

  points: (user: User, container: Element) => {
    const points = user.profile.totalPoints;
    // Check for various possible formats: "1500", "1 500", "1,500", etc.
    const pointsRegex = new RegExp(`${points.toLocaleString()}|${points.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\\s')}|${points}`);
    expect(container.textContent).toMatch(pointsRegex);
  },

  level: (user: User, container: Element) => {
    expect(container).toHaveTextContent(`Level ${user.profile.level}`);
  },
};

/**
 * Mock status calculation for skills (matching the real implementation)
 */
export const mockGetSkillStatus = (skill: Skill, user: User): 'completed' | 'available' | 'locked' => {
  const userSkill = user.competences[skill.id];
  if (userSkill?.completed) return 'completed';
  if (!skill.prereqs?.length || skill.prereqs.every(prereqId => user.competences[prereqId]?.completed)) {
    return 'available';
  }
  return 'locked';
};

// ==========================================
// CONSTANTS FOR CONSISTENT TESTING
// ==========================================

export const TEST_IDS = {
  PROFILE_CARD: 'profile-card',
  SKILL_NODE: (skillId: string) => `skill-node-${skillId}`,
  SKILL_TREE: 'skill-tree',
  PROGRESS_BAR: 'progress-bar',
  USER_AVATAR: 'user-avatar',
} as const;

export const MOCK_DATES = {
  CREATED_AT: new Date('2024-01-01'),
  LAST_LOGIN: new Date('2024-08-11'),
  SKILL_COMPLETED: new Date('2024-08-10'),
  LAST_ATTEMPT: new Date('2024-08-09'),
} as const;

export const SAMPLE_SKILLS = {
  BASIC_MATH: createMockSkill('skill-1', {
    name: 'Basic Math',
    description: 'Introduction to mathematics',
    prereqs: [],
    level: 1,
  }),
  
  ADVANCED_MATH: createMockSkill('skill-2', {
    name: 'Advanced Math', 
    description: 'Advanced mathematical concepts',
    prereqs: ['skill-1' as any],
    level: 2,
    position: { x: 200, y: 150 },
  }),
  
  PHYSICS_BASICS: createMockSkill('skill-3', {
    name: 'Physics Basics',
    description: 'Introduction to physics',
    category: 'Sciences',
    prereqs: [],
    level: 1,
    position: { x: 100, y: 200 },
  }),
} as const;