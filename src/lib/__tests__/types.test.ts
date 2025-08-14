import { describe, it, expect } from 'vitest';
import {
  // Type guards
  isSkillId,
  isUserId,
  isPathId,
  isStepId,
  
  // Type creators
  createSkillId,
  createUserId,
  createPathId,
  createStepId,
  createAchievementId,
  
  // Validation helpers
  isValidSkillStatus,
  isValidDifficultyLevel,
  isValidStepType,
  isValidLearningStyle,
  isValidAdaptiveMode,
  isValidLanguage,
  
  // Result helpers
  createSuccess,
  createFailure,
  
  // Types
  type SkillId,
  type UserId,
  type SkillStatus,
  type DifficultyLevel,
  type StepType,
  type LearningStyle,
  type AdaptiveMode,
  type Result,
} from '../types';

describe('Type Guards', () => {
  describe('ID type guards', () => {
    it('should validate SkillId correctly', () => {
      expect(isSkillId('valid-skill-id')).toBe(true);
      expect(isSkillId('')).toBe(false);
      expect(isSkillId(null)).toBe(false);
      expect(isSkillId(undefined)).toBe(false);
      expect(isSkillId(123)).toBe(false);
    });

    it('should validate UserId correctly', () => {
      expect(isUserId('valid-user-id')).toBe(true);
      expect(isUserId('')).toBe(false);
      expect(isUserId(null)).toBe(false);
      expect(isUserId(undefined)).toBe(false);
      expect(isUserId([])).toBe(false);
    });

    it('should validate PathId correctly', () => {
      expect(isPathId('valid-path-id')).toBe(true);
      expect(isPathId('')).toBe(false);
      expect(isPathId(null)).toBe(false);
      expect(isPathId(undefined)).toBe(false);
      expect(isPathId({})).toBe(false);
    });

    it('should validate StepId correctly', () => {
      expect(isStepId('valid-step-id')).toBe(true);
      expect(isStepId('')).toBe(false);
      expect(isStepId(null)).toBe(false);
      expect(isStepId(undefined)).toBe(false);
      expect(isStepId(42)).toBe(false);
    });
  });
});

describe('Type Creators', () => {
  it('should create branded SkillId', () => {
    const skillId = createSkillId('skill-123');
    expect(skillId).toBe('skill-123');
    expect(typeof skillId).toBe('string');
  });

  it('should create branded UserId', () => {
    const userId = createUserId('user-456');
    expect(userId).toBe('user-456');
    expect(typeof userId).toBe('string');
  });

  it('should create branded PathId', () => {
    const pathId = createPathId('path-789');
    expect(pathId).toBe('path-789');
    expect(typeof pathId).toBe('string');
  });

  it('should create branded StepId', () => {
    const stepId = createStepId('step-101');
    expect(stepId).toBe('step-101');
    expect(typeof stepId).toBe('string');
  });

  it('should create branded AchievementId', () => {
    const achievementId = createAchievementId('achievement-202');
    expect(achievementId).toBe('achievement-202');
    expect(typeof achievementId).toBe('string');
  });
});

describe('Validation Helpers', () => {
  describe('isValidSkillStatus', () => {
    it('should validate valid skill statuses', () => {
      expect(isValidSkillStatus('completed')).toBe(true);
      expect(isValidSkillStatus('available')).toBe(true);
      expect(isValidSkillStatus('locked')).toBe(true);
      expect(isValidSkillStatus('secret')).toBe(true);
    });

    it('should reject invalid skill statuses', () => {
      expect(isValidSkillStatus('invalid')).toBe(false);
      expect(isValidSkillStatus('')).toBe(false);
      expect(isValidSkillStatus('COMPLETED')).toBe(false); // case sensitive
      expect(isValidSkillStatus('pending')).toBe(false);
    });
  });

  describe('isValidDifficultyLevel', () => {
    it('should validate valid difficulty levels', () => {
      expect(isValidDifficultyLevel('beginner')).toBe(true);
      expect(isValidDifficultyLevel('intermediate')).toBe(true);
      expect(isValidDifficultyLevel('advanced')).toBe(true);
    });

    it('should reject invalid difficulty levels', () => {
      expect(isValidDifficultyLevel('easy')).toBe(false);
      expect(isValidDifficultyLevel('hard')).toBe(false);
      expect(isValidDifficultyLevel('expert')).toBe(false);
      expect(isValidDifficultyLevel('')).toBe(false);
    });
  });

  describe('isValidStepType', () => {
    it('should validate valid step types', () => {
      expect(isValidStepType('quiz')).toBe(true);
      expect(isValidStepType('lesson')).toBe(true);
      expect(isValidStepType('challenge')).toBe(true);
      expect(isValidStepType('review')).toBe(true);
    });

    it('should reject invalid step types', () => {
      expect(isValidStepType('test')).toBe(false);
      expect(isValidStepType('exercise')).toBe(false);
      expect(isValidStepType('')).toBe(false);
    });
  });

  describe('isValidLearningStyle', () => {
    it('should validate valid learning styles', () => {
      expect(isValidLearningStyle('Visual')).toBe(true);
      expect(isValidLearningStyle('Auditory')).toBe(true);
      expect(isValidLearningStyle('Kinesthetic')).toBe(true);
      expect(isValidLearningStyle('Reading')).toBe(true);
    });

    it('should reject invalid learning styles', () => {
      expect(isValidLearningStyle('visual')).toBe(false); // case sensitive
      expect(isValidLearningStyle('Tactile')).toBe(false);
      expect(isValidLearningStyle('')).toBe(false);
    });
  });

  describe('isValidAdaptiveMode', () => {
    it('should validate valid adaptive modes', () => {
      expect(isValidAdaptiveMode('Focus')).toBe(true);
      expect(isValidAdaptiveMode('Explore')).toBe(true);
      expect(isValidAdaptiveMode('Challenge')).toBe(true);
      expect(isValidAdaptiveMode('Default')).toBe(true);
    });

    it('should reject invalid adaptive modes', () => {
      expect(isValidAdaptiveMode('focus')).toBe(false); // case sensitive
      expect(isValidAdaptiveMode('Custom')).toBe(false);
      expect(isValidAdaptiveMode('')).toBe(false);
    });
  });

  describe('isValidLanguage', () => {
    it('should validate valid languages', () => {
      expect(isValidLanguage('en')).toBe(true);
      expect(isValidLanguage('fr')).toBe(true);
      expect(isValidLanguage('es')).toBe(true);
      expect(isValidLanguage('de')).toBe(true);
    });

    it('should reject invalid languages', () => {
      expect(isValidLanguage('EN')).toBe(false); // case sensitive
      expect(isValidLanguage('it')).toBe(false);
      expect(isValidLanguage('ru')).toBe(false);
      expect(isValidLanguage('')).toBe(false);
    });
  });
});

describe('Result Type Helpers', () => {
  describe('createSuccess', () => {
    it('should create successful result with data', () => {
      const result = createSuccess('test data');
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('test data');
      
      // Type narrowing test
      if (result.success) {
        expect(result.data).toBe('test data');
      }
    });

    it('should work with complex data types', () => {
      const complexData = {
        id: 'test-id',
        name: 'Test Name',
        items: [1, 2, 3],
        nested: { value: true }
      };
      
      const result = createSuccess(complexData);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(complexData);
      expect(result.data.nested.value).toBe(true);
    });
  });

  describe('createFailure', () => {
    it('should create failure result with error', () => {
      const error = new Error('Test error');
      const result = createFailure(error);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
      
      // Type narrowing test
      if (!result.success) {
        expect(result.error.message).toBe('Test error');
      }
    });

    it('should work with string errors', () => {
      const result = createFailure('String error message');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('String error message');
    });

    it('should work with custom error objects', () => {
      const customError = {
        code: 'CUSTOM_ERROR',
        message: 'Custom error occurred',
        details: { field: 'validation failed' }
      };
      
      const result = createFailure(customError);
      
      expect(result.success).toBe(false);
      expect(result.error).toEqual(customError);
      expect(result.error.code).toBe('CUSTOM_ERROR');
    });
  });

  describe('Result type usage patterns', () => {
    it('should support proper type narrowing', () => {
      const successResult: Result<string> = createSuccess('data');
      const failureResult: Result<string> = createFailure(new Error('error'));
      
      if (successResult.success) {
        // TypeScript should know this is success case
        expect(typeof successResult.data).toBe('string');
      }
      
      if (!failureResult.success) {
        // TypeScript should know this is failure case
        expect(failureResult.error).toBeInstanceOf(Error);
      }
    });

    it('should work in function return types', () => {
      function parseNumber(input: string): Result<number> {
        const parsed = parseInt(input, 10);
        if (isNaN(parsed)) {
          return createFailure(new Error('Invalid number'));
        }
        return createSuccess(parsed);
      }
      
      const validResult = parseNumber('42');
      const invalidResult = parseNumber('not-a-number');
      
      expect(validResult.success).toBe(true);
      expect(invalidResult.success).toBe(false);
      
      if (validResult.success) {
        expect(validResult.data).toBe(42);
      }
      
      if (!invalidResult.success) {
        expect(invalidResult.error.message).toBe('Invalid number');
      }
    });
  });
});