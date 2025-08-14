/**
 * SkillForge AI - useAchievements Hook
 * React hook for managing user achievements and notifications
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { achievementEngine } from '@/lib/achievement-engine';
import { logger } from '@/lib/logger';
import {
  Achievement,
  AchievementId,
  AchievementCategory,
  AchievementRarity,
  UserAchievement,
  AchievementStats,
  AchievementProgress,
  AchievementNotification,
  AchievementRecommendation,
  AchievementTrigger,
  AchievementType
} from '@/lib/achievement-types';
import { ACHIEVEMENTS } from '@/lib/achievement-definitions';
import { UserId } from '@/lib/types';

export interface UseAchievementsState {
  // Achievement data
  allAchievements: Achievement[];
  userAchievements: UserAchievement[];
  achievementStats: AchievementStats | null;
  achievementProgress: Map<AchievementId, AchievementProgress>;
  
  // Notifications
  notifications: AchievementNotification[];
  unreadNotifications: number;
  
  // Recommendations
  recommendations: AchievementRecommendation[];
  
  // Loading states
  isLoading: boolean;
  isProcessingTrigger: boolean;
  
  // Error states
  error: string | null;
}

export interface UseAchievementsActions {
  // Achievement management
  triggerAchievementCheck: (eventType: string, eventData: any) => Promise<UserAchievement[]>;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  
  // Filtering and querying
  getAchievementsByCategory: (category: AchievementCategory) => Achievement[];
  getAchievementsByRarity: (rarity: AchievementRarity) => Achievement[];
  getUnlockedAchievements: () => UserAchievement[];
  getLockedAchievements: () => Achievement[];
  getAchievementProgress: (achievementId: AchievementId) => AchievementProgress | null;
  
  // Utility functions
  isAchievementUnlocked: (achievementId: AchievementId) => boolean;
  getAchievementById: (achievementId: AchievementId) => Achievement | null;
  refreshData: () => Promise<void>;
}

export interface UseAchievementsReturn extends UseAchievementsState, UseAchievementsActions {}

/**
 * Custom hook for managing achievements
 */
export const useAchievements = (): UseAchievementsReturn => {
  // Local state
  const [state, setState] = useState<UseAchievementsState>({
    allAchievements: [],
    userAchievements: [],
    achievementStats: null,
    achievementProgress: new Map(),
    notifications: [],
    unreadNotifications: 0,
    recommendations: [],
    isLoading: false,
    isProcessingTrigger: false,
    error: null
  });

  // Get user from global store
  const { user, updateState } = useAppStore();
  const userId = user?.uid as UserId;

  // Memoized all achievements
  const allAchievements = useMemo(() => Object.values(ACHIEVEMENTS), []);

  /**
   * Initialize achievements system
   */
  const initializeAchievements = useCallback(async () => {
    if (!userId || state.isLoading) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Initialize achievement engine
      await achievementEngine.initialize(userId);
      
      // Get user stats and achievements
      const achievementStats = achievementEngine.getUserStats(userId);
      const recommendations = achievementEngine.generateRecommendations(userId);
      
      setState(prev => ({
        ...prev,
        allAchievements,
        achievementStats,
        recommendations,
        isLoading: false
      }));

      logger.info('Achievements initialized', {
        action: 'achievements_initialized',
        userId,
        totalAchievements: achievementStats.totalAchievements,
        unlockedCount: achievementStats.totalUnlocked
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize achievements';
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));

      logger.error('Failed to initialize achievements', { userId, error });
    }
  }, [userId, state.isLoading, allAchievements]);

  /**
   * Trigger achievement check based on user actions
   */
  const triggerAchievementCheck = useCallback(async (
    eventType: string, 
    eventData: any
  ): Promise<UserAchievement[]> => {
    if (!userId) return [];

    setState(prev => ({ ...prev, isProcessingTrigger: true }));

    try {
      const trigger: AchievementTrigger = {
        userId,
        eventType,
        eventData,
        timestamp: new Date()
      };

      const newAchievements = await achievementEngine.processTrigger(trigger);

      if (newAchievements.length > 0) {
        // Create notifications for new achievements
        const newNotifications = newAchievements.map(ua => ({
          id: `notif_${ua.id}`,
          userId,
          achievement: allAchievements.find(a => a.id === ua.achievementId)!,
          type: 'unlock' as const,
          message: `Achievement unlocked: ${allAchievements.find(a => a.id === ua.achievementId)?.title}!`,
          timestamp: new Date(),
          isRead: false,
          priority: 'high' as const
        }));

        // Update state with new achievements and notifications
        setState(prev => {
          const updatedUserAchievements = [...prev.userAchievements, ...newAchievements];
          const updatedNotifications = [...prev.notifications, ...newNotifications];
          
          return {
            ...prev,
            userAchievements: updatedUserAchievements,
            notifications: updatedNotifications,
            unreadNotifications: prev.unreadNotifications + newNotifications.length,
            isProcessingTrigger: false,
            achievementStats: achievementEngine.getUserStats(userId)
          };
        });

        // Update global store with user achievements
        updateState({
          userAchievements: [...state.userAchievements, ...newAchievements]
        });

        logger.info('New achievements triggered', {
          action: 'achievements_triggered',
          userId,
          eventType,
          newAchievements: newAchievements.length
        });
      } else {
        setState(prev => ({ ...prev, isProcessingTrigger: false }));
      }

      return newAchievements;

    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessingTrigger: false,
        error: error instanceof Error ? error.message : 'Failed to process achievement trigger'
      }));

      logger.error('Failed to trigger achievement check', { userId, eventType, error });
      return [];
    }
  }, [userId, state.userAchievements, allAchievements, updateState]);

  /**
   * Mark notification as read
   */
  const markNotificationAsRead = useCallback((notificationId: string) => {
    setState(prev => {
      const updatedNotifications = prev.notifications.map(notification =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification
      );
      
      const unreadCount = updatedNotifications.filter(n => !n.isRead).length;
      
      return {
        ...prev,
        notifications: updatedNotifications,
        unreadNotifications: unreadCount
      };
    });
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllNotificationsAsRead = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, isRead: true })),
      unreadNotifications: 0
    }));
  }, []);

  /**
   * Get achievements by category
   */
  const getAchievementsByCategory = useCallback((category: AchievementCategory): Achievement[] => {
    return allAchievements.filter(achievement => achievement.category === category);
  }, [allAchievements]);

  /**
   * Get achievements by rarity
   */
  const getAchievementsByRarity = useCallback((rarity: AchievementRarity): Achievement[] => {
    return allAchievements.filter(achievement => achievement.rarity === rarity);
  }, [allAchievements]);

  /**
   * Get unlocked achievements
   */
  const getUnlockedAchievements = useCallback((): UserAchievement[] => {
    return state.userAchievements.filter(ua => ua.isCompleted);
  }, [state.userAchievements]);

  /**
   * Get locked achievements
   */
  const getLockedAchievements = useCallback((): Achievement[] => {
    const unlockedIds = new Set(state.userAchievements.map(ua => ua.achievementId));
    return allAchievements.filter(achievement => !unlockedIds.has(achievement.id));
  }, [allAchievements, state.userAchievements]);

  /**
   * Get achievement progress
   */
  const getAchievementProgress = useCallback((achievementId: AchievementId): AchievementProgress | null => {
    return state.achievementProgress.get(achievementId) || null;
  }, [state.achievementProgress]);

  /**
   * Check if achievement is unlocked
   */
  const isAchievementUnlocked = useCallback((achievementId: AchievementId): boolean => {
    return state.userAchievements.some(ua => ua.achievementId === achievementId && ua.isCompleted);
  }, [state.userAchievements]);

  /**
   * Get achievement by ID
   */
  const getAchievementById = useCallback((achievementId: AchievementId): Achievement | null => {
    return allAchievements.find(achievement => achievement.id === achievementId) || null;
  }, [allAchievements]);

  /**
   * Refresh all achievement data
   */
  const refreshData = useCallback(async () => {
    if (!userId) return;

    try {
      const achievementStats = achievementEngine.getUserStats(userId);
      const recommendations = achievementEngine.generateRecommendations(userId);

      setState(prev => ({
        ...prev,
        achievementStats,
        recommendations,
        error: null
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to refresh achievement data'
      }));
    }
  }, [userId]);

  // Initialize on mount and when userId changes
  useEffect(() => {
    if (userId) {
      initializeAchievements();
    }
  }, [userId, initializeAchievements]);

  // Listen for skill completion events to trigger achievements
  useEffect(() => {
    const handleSkillCompletion = (event: CustomEvent) => {
      const { skillId, score, userId: eventUserId } = event.detail;
      
      if (eventUserId === userId) {
        triggerAchievementCheck('skill_completed', {
          skillId,
          score,
          skillsCompleted: state.userAchievements.filter(ua => ua.isCompleted).length + 1,
          userLevel: user?.level || 1,
          totalXP: user?.totalPoints || 0
        });
      }
    };

    // Listen for custom skill completion events
    window.addEventListener('skillCompleted', handleSkillCompletion as EventListener);
    
    return () => {
      window.removeEventListener('skillCompleted', handleSkillCompletion as EventListener);
    };
  }, [userId, user, triggerAchievementCheck, state.userAchievements]);

  // Return hook interface
  return {
    // State
    allAchievements: state.allAchievements,
    userAchievements: state.userAchievements,
    achievementStats: state.achievementStats,
    achievementProgress: state.achievementProgress,
    notifications: state.notifications,
    unreadNotifications: state.unreadNotifications,
    recommendations: state.recommendations,
    isLoading: state.isLoading,
    isProcessingTrigger: state.isProcessingTrigger,
    error: state.error,

    // Actions
    triggerAchievementCheck,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getAchievementsByCategory,
    getAchievementsByRarity,
    getUnlockedAchievements,
    getLockedAchievements,
    getAchievementProgress,
    isAchievementUnlocked,
    getAchievementById,
    refreshData
  };
};

export default useAchievements;