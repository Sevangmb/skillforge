/**
 * SkillForge AI - useSkills Hook
 * Comprehensive React hook for skills management and learning progress
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { skillsService } from '@/lib/skills-service';
import { logger } from '@/lib/logger';
import { 
  Skill, 
  SkillId, 
  UserId, 
  CompetenceStatus, 
  SkillCategory, 
  DifficultyLevel,
  SkillConnection
} from '@/lib/types';
import type { 
  LearningPath, 
  SkillRecommendation, 
  SkillProgress 
} from '@/lib/skills-service';

export interface UseSkillsState {
  skills: Skill[];
  skillsMap: Map<SkillId, Skill>;
  userProgress: Map<SkillId, CompetenceStatus>;
  skillConnections: SkillConnection[];
  recommendations: SkillRecommendation[];
  userStatistics: SkillProgress | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingProgress: boolean;
  isLoadingRecommendations: boolean;
  
  // Error states
  error: string | null;
  progressError: string | null;
}

export interface UseSkillsActions {
  // Data loading actions
  loadSkills: () => Promise<void>;
  loadUserProgress: () => Promise<void>;
  loadRecommendations: () => Promise<void>;
  loadUserStatistics: () => Promise<void>;
  
  // Skill management actions
  getSkill: (skillId: SkillId) => Skill | undefined;
  getSkillsByCategory: (category: SkillCategory) => Skill[];
  getSkillPrerequisites: (skillId: SkillId) => Promise<Skill[]>;
  getSkillDependents: (skillId: SkillId) => Promise<Skill[]>;
  
  // Progress management actions
  updateSkillProgress: (skillId: SkillId, progress: Partial<CompetenceStatus>) => Promise<void>;
  completeSkill: (skillId: SkillId, score: number) => Promise<void>;
  
  // Learning path actions
  generateLearningPath: (targetSkillId: SkillId) => Promise<LearningPath>;
  
  // Utility actions
  isSkillCompleted: (skillId: SkillId) => boolean;
  isSkillAvailable: (skillId: SkillId) => boolean;
  getSkillCompletionPercentage: () => number;
  refreshData: () => Promise<void>;
}

export interface UseSkillsReturn extends UseSkillsState, UseSkillsActions {}

/**
 * Custom hook for managing skills and user progress
 */
export const useSkills = (): UseSkillsReturn => {
  // Local state
  const [state, setState] = useState<UseSkillsState>({
    skills: [],
    skillsMap: new Map(),
    userProgress: new Map(),
    skillConnections: [],
    recommendations: [],
    userStatistics: null,
    
    isLoading: false,
    isLoadingProgress: false,
    isLoadingRecommendations: false,
    
    error: null,
    progressError: null
  });

  // Get user from global store
  const { user, updateState } = useAppStore();
  const userId = user?.uid as UserId;

  // Memoized skills map for quick lookups
  const skillsMap = useMemo(() => {
    const map = new Map<SkillId, Skill>();
    state.skills.forEach(skill => map.set(skill.id, skill));
    return map;
  }, [state.skills]);

  /**
   * Load all skills from the service
   */
  const loadSkills = useCallback(async () => {
    if (state.isLoading) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const [skills, skillTree] = await Promise.all([
        skillsService.getAllSkills(),
        skillsService.getSkillTree()
      ]);

      setState(prev => ({
        ...prev,
        skills,
        skillsMap: new Map(skills.map(skill => [skill.id, skill])),
        skillConnections: skillTree.connections,
        isLoading: false
      }));

      // Update global store
      updateState({ skills });

      logger.info('Skills loaded successfully', { count: skills.length });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load skills';
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));

      logger.error('Failed to load skills', { error });
    }
  }, [state.isLoading, updateState]);

  /**
   * Load user progress for all skills
   */
  const loadUserProgress = useCallback(async () => {
    if (!userId || state.isLoadingProgress) return;

    setState(prev => ({ ...prev, isLoadingProgress: true, progressError: null }));

    try {
      const userProgress = await skillsService.getUserProgress(userId);

      setState(prev => ({
        ...prev,
        userProgress,
        isLoadingProgress: false
      }));

      // Update global store with competences
      const competences = new Map<SkillId, CompetenceStatus>();
      userProgress.forEach((status, skillId) => {
        competences.set(skillId, status);
      });
      
      updateState({ 
        user: user ? { ...user, competences } : user 
      });

      logger.info('User progress loaded successfully', { 
        userId, 
        skillCount: userProgress.size 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load progress';
      
      setState(prev => ({
        ...prev,
        progressError: errorMessage,
        isLoadingProgress: false
      }));

      logger.error('Failed to load user progress', { userId, error });
    }
  }, [userId, state.isLoadingProgress, user, updateState]);

  /**
   * Load skill recommendations for the user
   */
  const loadRecommendations = useCallback(async () => {
    if (!userId || state.isLoadingRecommendations) return;

    setState(prev => ({ ...prev, isLoadingRecommendations: true }));

    try {
      const recommendations = await skillsService.getRecommendedSkills(userId);

      setState(prev => ({
        ...prev,
        recommendations,
        isLoadingRecommendations: false
      }));

      logger.info('Skill recommendations loaded', { 
        userId, 
        count: recommendations.length 
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoadingRecommendations: false }));
      logger.error('Failed to load recommendations', { userId, error });
    }
  }, [userId, state.isLoadingRecommendations]);

  /**
   * Load user skill statistics
   */
  const loadUserStatistics = useCallback(async () => {
    if (!userId) return;

    try {
      const userStatistics = await skillsService.getUserSkillStatistics(userId);

      setState(prev => ({
        ...prev,
        userStatistics
      }));

      logger.info('User statistics loaded', { userId, userStatistics });
    } catch (error) {
      logger.error('Failed to load user statistics', { userId, error });
    }
  }, [userId]);

  /**
   * Get a skill by ID
   */
  const getSkill = useCallback((skillId: SkillId): Skill | undefined => {
    return skillsMap.get(skillId);
  }, [skillsMap]);

  /**
   * Get skills filtered by category
   */
  const getSkillsByCategory = useCallback((category: SkillCategory): Skill[] => {
    return state.skills.filter(skill => skill.category === category);
  }, [state.skills]);

  /**
   * Get skill prerequisites
   */
  const getSkillPrerequisites = useCallback(async (skillId: SkillId): Promise<Skill[]> => {
    try {
      return await skillsService.getSkillPrerequisites(skillId);
    } catch (error) {
      logger.error('Failed to get skill prerequisites', { skillId, error });
      return [];
    }
  }, []);

  /**
   * Get skills that depend on this skill
   */
  const getSkillDependents = useCallback(async (skillId: SkillId): Promise<Skill[]> => {
    try {
      return await skillsService.getSkillDependents(skillId);
    } catch (error) {
      logger.error('Failed to get skill dependents', { skillId, error });
      return [];
    }
  }, []);

  /**
   * Update skill progress
   */
  const updateSkillProgress = useCallback(async (
    skillId: SkillId, 
    progress: Partial<CompetenceStatus>
  ) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      await skillsService.updateSkillProgress(userId, skillId, progress);

      // Update local state
      setState(prev => ({
        ...prev,
        userProgress: new Map(prev.userProgress.set(skillId, {
          ...prev.userProgress.get(skillId),
          ...progress
        } as CompetenceStatus))
      }));

      logger.info('Skill progress updated', { userId, skillId, progress });
    } catch (error) {
      logger.error('Failed to update skill progress', { userId, skillId, error });
      throw error;
    }
  }, [userId]);

  /**
   * Mark a skill as completed
   */
  const completeSkill = useCallback(async (skillId: SkillId, score: number) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      await skillsService.completeSkill(userId, skillId, score);

      // Update local state
      const completedStatus: CompetenceStatus = {
        completed: true,
        level: Math.min(5, Math.max(1, Math.floor(score / 20) + 1)),
        averageScore: score,
        attempts: 1,
        completedAt: new Date()
      };

      setState(prev => ({
        ...prev,
        userProgress: new Map(prev.userProgress.set(skillId, completedStatus))
      }));

      // Refresh recommendations and statistics
      loadRecommendations();
      loadUserStatistics();

      logger.info('Skill completed', { userId, skillId, score });
    } catch (error) {
      logger.error('Failed to complete skill', { userId, skillId, error });
      throw error;
    }
  }, [userId, loadRecommendations, loadUserStatistics]);

  /**
   * Generate a learning path to a target skill
   */
  const generateLearningPath = useCallback(async (targetSkillId: SkillId): Promise<LearningPath> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      const learningPath = await skillsService.generateLearningPath(userId, targetSkillId);
      
      logger.info('Learning path generated', { 
        userId, 
        targetSkillId, 
        pathLength: learningPath.requiredSkills.length 
      });
      
      return learningPath;
    } catch (error) {
      logger.error('Failed to generate learning path', { userId, targetSkillId, error });
      throw error;
    }
  }, [userId]);

  /**
   * Check if a skill is completed
   */
  const isSkillCompleted = useCallback((skillId: SkillId): boolean => {
    const progress = state.userProgress.get(skillId);
    return progress?.completed || false;
  }, [state.userProgress]);

  /**
   * Check if a skill is available (prerequisites met)
   */
  const isSkillAvailable = useCallback((skillId: SkillId): boolean => {
    const skill = skillsMap.get(skillId);
    if (!skill) return false;

    // Check if all prerequisites are completed
    return skill.prereqs.every(prereqId => 
      isSkillCompleted(prereqId as SkillId)
    );
  }, [skillsMap, isSkillCompleted]);

  /**
   * Calculate overall skill completion percentage
   */
  const getSkillCompletionPercentage = useCallback((): number => {
    if (state.skills.length === 0) return 0;

    const completedCount = state.skills.filter(skill => 
      isSkillCompleted(skill.id)
    ).length;

    return Math.round((completedCount / state.skills.length) * 100);
  }, [state.skills, isSkillCompleted]);

  /**
   * Refresh all data
   */
  const refreshData = useCallback(async () => {
    await Promise.all([
      loadSkills(),
      loadUserProgress(),
      loadRecommendations(),
      loadUserStatistics()
    ]);
  }, [loadSkills, loadUserProgress, loadRecommendations, loadUserStatistics]);

  // Load initial data when hook mounts or userId changes
  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  useEffect(() => {
    if (userId) {
      loadUserProgress();
      loadRecommendations();
      loadUserStatistics();
    }
  }, [userId, loadUserProgress, loadRecommendations, loadUserStatistics]);

  // Return hook interface
  return {
    // State
    skills: state.skills,
    skillsMap,
    userProgress: state.userProgress,
    skillConnections: state.skillConnections,
    recommendations: state.recommendations,
    userStatistics: state.userStatistics,
    
    isLoading: state.isLoading,
    isLoadingProgress: state.isLoadingProgress,
    isLoadingRecommendations: state.isLoadingRecommendations,
    
    error: state.error,
    progressError: state.progressError,

    // Actions
    loadSkills,
    loadUserProgress,
    loadRecommendations,
    loadUserStatistics,
    
    getSkill,
    getSkillsByCategory,
    getSkillPrerequisites,
    getSkillDependents,
    
    updateSkillProgress,
    completeSkill,
    
    generateLearningPath,
    
    isSkillCompleted,
    isSkillAvailable,
    getSkillCompletionPercentage,
    refreshData
  };
};

export default useSkills;