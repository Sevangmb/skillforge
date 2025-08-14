/**
 * SkillForge AI - Skills Service
 * Comprehensive skills management and learning path service
 */

import { collection, doc, getDocs, getDoc, query, where, orderBy, limit, updateDoc, arrayUnion, increment, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { logger } from './logger';
import { performanceOptimizer } from './performance-optimizer';
import { cacheManager } from './cache-manager';
import { 
  Skill, 
  SkillId, 
  UserId, 
  CompetenceStatus, 
  SkillCategory, 
  DifficultyLevel,
  SkillConnection,
  SkillProgress,
  LearningPath,
  SkillAnalytics,
  SkillRecommendation
} from './types';

export interface SkillsServiceInterface {
  // Core Skills Operations
  getAllSkills(): Promise<Skill[]>;
  getSkill(skillId: SkillId): Promise<Skill | null>;
  getSkillsByCategory(category: SkillCategory): Promise<Skill[]>;
  getSkillPrerequisites(skillId: SkillId): Promise<Skill[]>;
  getSkillDependents(skillId: SkillId): Promise<Skill[]>;
  
  // User Progress Operations
  getUserProgress(userId: UserId): Promise<Map<SkillId, CompetenceStatus>>;
  updateSkillProgress(userId: UserId, skillId: SkillId, progress: Partial<CompetenceStatus>): Promise<void>;
  completeSkill(userId: UserId, skillId: SkillId, score: number): Promise<void>;
  
  // Learning Path Operations
  generateLearningPath(userId: UserId, targetSkillId: SkillId): Promise<LearningPath>;
  getRecommendedSkills(userId: UserId): Promise<SkillRecommendation[]>;
  
  // Analytics Operations
  getSkillAnalytics(skillId: SkillId): Promise<SkillAnalytics>;
  getUserSkillStatistics(userId: UserId): Promise<SkillProgress>;
  
  // Tree Operations
  getSkillTree(): Promise<{ skills: Skill[]; connections: SkillConnection[] }>;
  getSkillPath(fromSkillId: SkillId, toSkillId: SkillId): Promise<Skill[]>;
}

class SkillsService implements SkillsServiceInterface {
  private cache = cacheManager;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly COLLECTION_NAME = 'skills';
  private readonly USER_PROGRESS_COLLECTION = 'userProgress';

  /**
   * Get all skills with caching
   */
  async getAllSkills(): Promise<Skill[]> {
    const cacheKey = 'skills:all';
    
    return performanceOptimizer.measure('skills:getAllSkills', async () => {
      // Check cache first
      const cached = this.cache.get<Skill[]>(cacheKey);
      if (cached) {
        logger.info('Skills retrieved from cache', { cacheHit: true, count: cached.length });
        return cached;
      }

      try {
        const skillsRef = collection(db, this.COLLECTION_NAME);
        const querySnapshot = await getDocs(query(skillsRef, orderBy('level'), orderBy('name')));
        
        const skills: Skill[] = querySnapshot.docs.map(doc => ({
          id: doc.id as SkillId,
          ...doc.data()
        } as Skill));

        // Cache the results
        this.cache.set(cacheKey, skills, this.CACHE_TTL);
        
        logger.info('Skills retrieved from Firestore', { 
          count: skills.length,
          cacheInvalidated: true
        });
        
        return skills;
      } catch (error) {
        logger.error('Failed to fetch skills', { error });
        throw new Error('Unable to load skills. Please try again.');
      }
    });
  }

  /**
   * Get a single skill by ID
   */
  async getSkill(skillId: SkillId): Promise<Skill | null> {
    const cacheKey = `skill:${skillId}`;
    
    return performanceOptimizer.measure('skills:getSkill', async () => {
      // Check cache first
      const cached = this.cache.get<Skill>(cacheKey);
      if (cached) {
        logger.info('Skill retrieved from cache', { skillId, cacheHit: true });
        return cached;
      }

      try {
        const skillRef = doc(db, this.COLLECTION_NAME, skillId);
        const skillDoc = await getDoc(skillRef);
        
        if (!skillDoc.exists()) {
          logger.warn('Skill not found', { skillId });
          return null;
        }

        const skill: Skill = {
          id: skillDoc.id as SkillId,
          ...skillDoc.data()
        } as Skill;

        // Cache the result
        this.cache.set(cacheKey, skill, this.CACHE_TTL);
        
        logger.info('Skill retrieved from Firestore', { skillId });
        return skill;
      } catch (error) {
        logger.error('Failed to fetch skill', { skillId, error });
        throw new Error(`Unable to load skill ${skillId}. Please try again.`);
      }
    });
  }

  /**
   * Get skills by category
   */
  async getSkillsByCategory(category: SkillCategory): Promise<Skill[]> {
    const cacheKey = `skills:category:${category}`;
    
    return performanceOptimizer.measure('skills:getSkillsByCategory', async () => {
      // Check cache first
      const cached = this.cache.get<Skill[]>(cacheKey);
      if (cached) {
        logger.info('Skills by category retrieved from cache', { 
          category, 
          cacheHit: true, 
          count: cached.length 
        });
        return cached;
      }

      try {
        const skillsRef = collection(db, this.COLLECTION_NAME);
        const q = query(
          skillsRef,
          where('category', '==', category),
          orderBy('level'),
          orderBy('name')
        );
        const querySnapshot = await getDocs(q);
        
        const skills: Skill[] = querySnapshot.docs.map(doc => ({
          id: doc.id as SkillId,
          ...doc.data()
        } as Skill));

        // Cache the results
        this.cache.set(cacheKey, skills, this.CACHE_TTL);
        
        logger.info('Skills by category retrieved from Firestore', { 
          category, 
          count: skills.length 
        });
        
        return skills;
      } catch (error) {
        logger.error('Failed to fetch skills by category', { category, error });
        throw new Error(`Unable to load ${category} skills. Please try again.`);
      }
    });
  }

  /**
   * Get skill prerequisites
   */
  async getSkillPrerequisites(skillId: SkillId): Promise<Skill[]> {
    return performanceOptimizer.measure('skills:getSkillPrerequisites', async () => {
      const skill = await this.getSkill(skillId);
      if (!skill || !skill.prereqs.length) {
        return [];
      }

      const prerequisites: Skill[] = [];
      for (const prereqId of skill.prereqs) {
        const prereq = await this.getSkill(prereqId as SkillId);
        if (prereq) {
          prerequisites.push(prereq);
        }
      }

      logger.info('Skill prerequisites retrieved', { 
        skillId, 
        prereqCount: prerequisites.length 
      });
      
      return prerequisites;
    });
  }

  /**
   * Get skills that depend on this skill
   */
  async getSkillDependents(skillId: SkillId): Promise<Skill[]> {
    const cacheKey = `skills:dependents:${skillId}`;
    
    return performanceOptimizer.measure('skills:getSkillDependents', async () => {
      // Check cache first
      const cached = this.cache.get<Skill[]>(cacheKey);
      if (cached) {
        return cached;
      }

      try {
        const skillsRef = collection(db, this.COLLECTION_NAME);
        const q = query(skillsRef, where('prereqs', 'array-contains', skillId));
        const querySnapshot = await getDocs(q);
        
        const dependents: Skill[] = querySnapshot.docs.map(doc => ({
          id: doc.id as SkillId,
          ...doc.data()
        } as Skill));

        // Cache the results
        this.cache.set(cacheKey, dependents, this.CACHE_TTL);
        
        logger.info('Skill dependents retrieved', { 
          skillId, 
          dependentCount: dependents.length 
        });
        
        return dependents;
      } catch (error) {
        logger.error('Failed to fetch skill dependents', { skillId, error });
        return [];
      }
    });
  }

  /**
   * Get user progress for all skills
   */
  async getUserProgress(userId: UserId): Promise<Map<SkillId, CompetenceStatus>> {
    const cacheKey = `user:progress:${userId}`;
    
    return performanceOptimizer.measure('skills:getUserProgress', async () => {
      // Check cache first
      const cached = this.cache.get<Map<SkillId, CompetenceStatus>>(cacheKey);
      if (cached) {
        logger.info('User progress retrieved from cache', { userId, cacheHit: true });
        return cached;
      }

      try {
        const progressRef = doc(db, this.USER_PROGRESS_COLLECTION, userId);
        const progressDoc = await getDoc(progressRef);
        
        const progress = new Map<SkillId, CompetenceStatus>();
        
        if (progressDoc.exists()) {
          const data = progressDoc.data();
          if (data.skills) {
            Object.entries(data.skills).forEach(([skillId, status]) => {
              progress.set(skillId as SkillId, status as CompetenceStatus);
            });
          }
        }

        // Cache the results for shorter time due to frequent updates
        this.cache.set(cacheKey, progress, 2 * 60 * 1000); // 2 minutes
        
        logger.info('User progress retrieved', { userId, skillCount: progress.size });
        return progress;
      } catch (error) {
        logger.error('Failed to fetch user progress', { userId, error });
        return new Map();
      }
    });
  }

  /**
   * Update skill progress for a user
   */
  async updateSkillProgress(
    userId: UserId, 
    skillId: SkillId, 
    progress: Partial<CompetenceStatus>
  ): Promise<void> {
    return performanceOptimizer.measure('skills:updateSkillProgress', async () => {
      try {
        const progressRef = doc(db, this.USER_PROGRESS_COLLECTION, userId);
        const updateData = {
          [`skills.${skillId}`]: {
            ...progress,
            lastUpdated: Timestamp.now()
          }
        };

        await updateDoc(progressRef, updateData);
        
        // Invalidate cache
        this.cache.delete(`user:progress:${userId}`);
        
        logger.info('Skill progress updated', { 
          userId, 
          skillId, 
          progress,
          cacheInvalidated: true
        });
      } catch (error) {
        logger.error('Failed to update skill progress', { userId, skillId, error });
        throw new Error('Unable to save progress. Please try again.');
      }
    });
  }

  /**
   * Mark a skill as completed
   */
  async completeSkill(userId: UserId, skillId: SkillId, score: number): Promise<void> {
    return performanceOptimizer.measure('skills:completeSkill', async () => {
      const completionStatus: Partial<CompetenceStatus> = {
        completed: true,
        level: Math.min(5, Math.max(1, Math.floor(score / 20) + 1)),
        averageScore: score,
        attempts: 1,
        completedAt: new Date()
      };

      await this.updateSkillProgress(userId, skillId, completionStatus);
      
      logger.info('Skill completed', { 
        userId, 
        skillId, 
        score, 
        level: completionStatus.level 
      });
    });
  }

  /**
   * Generate a personalized learning path
   */
  async generateLearningPath(userId: UserId, targetSkillId: SkillId): Promise<LearningPath> {
    return performanceOptimizer.measure('skills:generateLearningPath', async () => {
      const userProgress = await this.getUserProgress(userId);
      const targetSkill = await this.getSkill(targetSkillId);
      
      if (!targetSkill) {
        throw new Error('Target skill not found');
      }

      // Get all prerequisites recursively
      const allPrereqs = await this.getAllPrerequisites(targetSkillId, new Set());
      const incompletedPrereqs = allPrereqs.filter(skill => {
        const progress = userProgress.get(skill.id);
        return !progress?.completed;
      });

      // Sort by level and dependencies
      const sortedSkills = this.sortSkillsByDependencies(incompletedPrereqs);
      
      const learningPath: LearningPath = {
        targetSkill: targetSkill,
        requiredSkills: sortedSkills,
        estimatedDuration: this.calculateEstimatedDuration(sortedSkills),
        difficulty: this.calculatePathDifficulty(sortedSkills),
        completionPercentage: this.calculateCompletionPercentage(sortedSkills, userProgress)
      };

      logger.info('Learning path generated', { 
        userId, 
        skillId: targetSkillId, 
        pathLength: sortedSkills.length,
        estimatedDuration: learningPath.estimatedDuration
      });
      
      return learningPath;
    });
  }

  /**
   * Get recommended skills for a user
   */
  async getRecommendedSkills(userId: UserId): Promise<SkillRecommendation[]> {
    return performanceOptimizer.measure('skills:getRecommendedSkills', async () => {
      const userProgress = await this.getUserProgress(userId);
      const allSkills = await this.getAllSkills();
      
      const recommendations: SkillRecommendation[] = [];
      
      for (const skill of allSkills) {
        const progress = userProgress.get(skill.id);
        
        // Skip completed skills
        if (progress?.completed) continue;
        
        // Check if prerequisites are met
        const prereqsMet = await this.arePrerequisitesMet(skill, userProgress);
        if (!prereqsMet) continue;
        
        // Calculate recommendation score
        const score = this.calculateRecommendationScore(skill, userProgress);
        
        recommendations.push({
          skill,
          score,
          reason: this.getRecommendationReason(skill, userProgress),
          estimatedDuration: this.estimateSkillDuration(skill),
          difficulty: skill.difficulty || 'beginner'
        });
      }
      
      // Sort by score and return top 10
      const sortedRecommendations = recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      
      logger.info('Skill recommendations generated', { 
        userId, 
        recommendationCount: sortedRecommendations.length 
      });
      
      return sortedRecommendations;
    });
  }

  /**
   * Get skill analytics
   */
  async getSkillAnalytics(skillId: SkillId): Promise<SkillAnalytics> {
    // Placeholder implementation - would integrate with analytics service
    return {
      skillId,
      totalAttempts: 0,
      completionRate: 0,
      averageScore: 0,
      averageTime: 0,
      difficultyRating: 0,
      popularityScore: 0,
      lastUpdated: new Date()
    };
  }

  /**
   * Get user skill statistics
   */
  async getUserSkillStatistics(userId: UserId): Promise<SkillProgress> {
    const userProgress = await this.getUserProgress(userId);
    const allSkills = await this.getAllSkills();
    
    const completed = Array.from(userProgress.values()).filter(p => p.completed).length;
    const total = allSkills.length;
    
    return {
      totalSkills: total,
      completedSkills: completed,
      inProgressSkills: userProgress.size - completed,
      completionPercentage: total > 0 ? (completed / total) * 100 : 0,
      currentLevel: this.calculateUserLevel(userProgress),
      totalXP: this.calculateTotalXP(userProgress),
      skillsByCategory: this.groupSkillsByCategory(userProgress, allSkills)
    };
  }

  /**
   * Get skill tree structure
   */
  async getSkillTree(): Promise<{ skills: Skill[]; connections: SkillConnection[] }> {
    const skills = await this.getAllSkills();
    const connections: SkillConnection[] = [];
    
    // Generate connections based on prerequisites
    skills.forEach(skill => {
      skill.prereqs.forEach(prereqId => {
        connections.push({
          from: prereqId as SkillId,
          to: skill.id,
          type: 'prerequisite'
        });
      });
    });
    
    return { skills, connections };
  }

  /**
   * Find path between two skills
   */
  async getSkillPath(fromSkillId: SkillId, toSkillId: SkillId): Promise<Skill[]> {
    // Implement pathfinding algorithm (e.g., Dijkstra or A*)
    // For now, return empty array
    return [];
  }

  // Private helper methods

  private async getAllPrerequisites(skillId: SkillId, visited: Set<SkillId>): Promise<Skill[]> {
    if (visited.has(skillId)) return [];
    visited.add(skillId);
    
    const skill = await this.getSkill(skillId);
    if (!skill) return [];
    
    const prereqs: Skill[] = [];
    
    for (const prereqId of skill.prereqs) {
      const prereq = await this.getSkill(prereqId as SkillId);
      if (prereq) {
        prereqs.push(prereq);
        const subPrereqs = await this.getAllPrerequisites(prereq.id, visited);
        prereqs.push(...subPrereqs);
      }
    }
    
    return prereqs;
  }

  private sortSkillsByDependencies(skills: Skill[]): Skill[] {
    // Topological sort based on dependencies
    return skills.sort((a, b) => {
      if (a.prereqs.includes(b.id)) return 1;
      if (b.prereqs.includes(a.id)) return -1;
      return (a.level || 0) - (b.level || 0);
    });
  }

  private calculateEstimatedDuration(skills: Skill[]): number {
    return skills.reduce((total, skill) => total + this.estimateSkillDuration(skill), 0);
  }

  private estimateSkillDuration(skill: Skill): number {
    // Base duration on difficulty and content complexity
    const baseDuration = 30; // 30 minutes base
    const difficultyMultiplier = {
      'beginner': 1,
      'intermediate': 1.5,
      'advanced': 2
    };
    
    return baseDuration * (difficultyMultiplier[skill.difficulty || 'beginner'] || 1);
  }

  private calculatePathDifficulty(skills: Skill[]): DifficultyLevel {
    if (skills.length === 0) return 'beginner';
    
    const difficultyOrder = ['beginner', 'intermediate', 'advanced'];
    const maxDifficulty = Math.max(...skills.map(s => 
      difficultyOrder.indexOf(s.difficulty || 'beginner')
    ));
    
    return difficultyOrder[maxDifficulty] || 'beginner';
  }

  private calculateCompletionPercentage(
    skills: Skill[], 
    userProgress: Map<SkillId, CompetenceStatus>
  ): number {
    if (skills.length === 0) return 100;
    
    const completed = skills.filter(skill => 
      userProgress.get(skill.id)?.completed
    ).length;
    
    return (completed / skills.length) * 100;
  }

  private async arePrerequisitesMet(
    skill: Skill, 
    userProgress: Map<SkillId, CompetenceStatus>
  ): Promise<boolean> {
    return skill.prereqs.every(prereqId => {
      const progress = userProgress.get(prereqId as SkillId);
      return progress?.completed;
    });
  }

  private calculateRecommendationScore(
    skill: Skill, 
    userProgress: Map<SkillId, CompetenceStatus>
  ): number {
    let score = 50; // Base score
    
    // Boost score for skills that unlock many others
    score += skill.level || 0 * 10;
    
    // Consider user's learning patterns (placeholder)
    // In a real implementation, this would analyze user behavior
    
    return Math.min(100, Math.max(0, score));
  }

  private getRecommendationReason(
    skill: Skill, 
    userProgress: Map<SkillId, CompetenceStatus>
  ): string {
    const reasons = [
      "Builds on your current progress",
      "Essential for advanced topics",
      "Popular among learners",
      "Recommended for your learning path"
    ];
    
    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  private calculateUserLevel(userProgress: Map<SkillId, CompetenceStatus>): number {
    const totalXP = this.calculateTotalXP(userProgress);
    return Math.floor(totalXP / 1000) + 1; // 1000 XP per level
  }

  private calculateTotalXP(userProgress: Map<SkillId, CompetenceStatus>): number {
    return Array.from(userProgress.values())
      .filter(p => p.completed)
      .reduce((total, progress) => total + (progress.averageScore || 0), 0);
  }

  private groupSkillsByCategory(
    userProgress: Map<SkillId, CompetenceStatus>,
    allSkills: Skill[]
  ): Record<SkillCategory, number> {
    const categories = {} as Record<SkillCategory, number>;
    
    allSkills.forEach(skill => {
      const progress = userProgress.get(skill.id);
      if (progress?.completed) {
        categories[skill.category] = (categories[skill.category] || 0) + 1;
      }
    });
    
    return categories;
  }
}

// Create and export singleton instance
export const skillsService = new SkillsService();
export default skillsService;

// Additional type definitions needed for the service
export interface LearningPath {
  targetSkill: Skill;
  requiredSkills: Skill[];
  estimatedDuration: number;
  difficulty: DifficultyLevel;
  completionPercentage: number;
}

export interface SkillRecommendation {
  skill: Skill;
  score: number;
  reason: string;
  estimatedDuration: number;
  difficulty: DifficultyLevel;
}

export interface SkillAnalytics {
  skillId: SkillId;
  totalAttempts: number;
  completionRate: number;
  averageScore: number;
  averageTime: number;
  difficultyRating: number;
  popularityScore: number;
  lastUpdated: Date;
}

export interface SkillProgress {
  totalSkills: number;
  completedSkills: number;
  inProgressSkills: number;
  completionPercentage: number;
  currentLevel: number;
  totalXP: number;
  skillsByCategory: Record<SkillCategory, number>;
}