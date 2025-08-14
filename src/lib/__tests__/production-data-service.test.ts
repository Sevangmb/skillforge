import { describe, it, expect, vi } from 'vitest';

// Mock Firebase completely
vi.mock('../firebase', () => ({
  db: null,
  getFirebaseConnection: vi.fn(() => ({
    isConfigured: false,
    isInitialized: false,
    isBrowser: true,
    hasValidConnection: false,
    projectId: 'test-project',
  })),
}));

// Import after mocking
import { productionDataService } from '../production-data-service';

describe('ProductionDataService', () => {
  describe('getSkills', () => {
    it('should return local production skills as fallback', async () => {
      const result = await productionDataService.getSkills();

      // Should return local production data as fallback
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Verify it contains expected structure
      const firstSkill = result[0];
      expect(firstSkill).toHaveProperty('id');
      expect(firstSkill).toHaveProperty('name');
      expect(firstSkill).toHaveProperty('category');
      expect(firstSkill).toHaveProperty('level');
      expect(firstSkill).toHaveProperty('description');
      expect(firstSkill).toHaveProperty('icon');
      expect(firstSkill).toHaveProperty('cost');
      expect(firstSkill).toHaveProperty('position');
      expect(firstSkill).toHaveProperty('prereqs');
      expect(firstSkill).toHaveProperty('isSecret');
    });

    it('should return consistent data structure', async () => {
      const result = await productionDataService.getSkills();

      expect(result.length).toBeGreaterThan(15); // Should have substantial skill set
      
      // Check that skills have valid categories
      const categories = [...new Set(result.map(skill => skill.category))];
      expect(categories.length).toBeGreaterThan(3); // Should have multiple categories
      
      // Check that skills have valid levels
      const levels = result.map(skill => skill.level);
      expect(Math.min(...levels)).toBeGreaterThanOrEqual(1);
      expect(Math.max(...levels)).toBeLessThanOrEqual(5);
    });

    it('should have skills with proper prerequisite relationships', async () => {
      const result = await productionDataService.getSkills();
      
      // Find skills with prerequisites
      const skillsWithPrereqs = result.filter(skill => skill.prereqs.length > 0);
      expect(skillsWithPrereqs.length).toBeGreaterThan(0);
      
      // Check that prerequisite IDs exist in the skill set
      const skillIds = new Set(result.map(skill => skill.id));
      
      skillsWithPrereqs.forEach(skill => {
        skill.prereqs.forEach(prereqId => {
          expect(skillIds.has(prereqId)).toBe(true);
        });
      });
    });
  });

  describe('getUsers', () => {
    it('should return users array', async () => {
      const result = await productionDataService.getUsers();

      expect(Array.isArray(result)).toBe(true);
      // May be empty or have test users - both are valid
    });
  });

  describe('error handling and resilience', () => {
    it('should handle service calls gracefully', async () => {
      // Should not throw even when Firebase is unavailable
      const skillsPromise = productionDataService.getSkills();
      const usersPromise = productionDataService.getUsers();

      await expect(skillsPromise).resolves.toBeDefined();
      await expect(usersPromise).resolves.toBeDefined();
    });
  });

  describe('data validation', () => {
    it('should return skills with valid position data', async () => {
      const result = await productionDataService.getSkills();

      result.forEach(skill => {
        expect(skill.position).toHaveProperty('x');
        expect(skill.position).toHaveProperty('y');
        expect(typeof skill.position.x).toBe('number');
        expect(typeof skill.position.y).toBe('number');
        expect(skill.position.x).toBeGreaterThanOrEqual(0);
        expect(skill.position.y).toBeGreaterThanOrEqual(0);
      });
    });

    it('should return skills with valid cost values', async () => {
      const result = await productionDataService.getSkills();

      result.forEach(skill => {
        expect(typeof skill.cost).toBe('number');
        expect(skill.cost).toBeGreaterThan(0);
        expect(skill.cost).toBeLessThanOrEqual(100); // Reasonable upper bound
      });
    });

    it('should return skills with proper boolean flags', async () => {
      const result = await productionDataService.getSkills();

      result.forEach(skill => {
        expect(typeof skill.isSecret).toBe('boolean');
      });
    });
  });
});