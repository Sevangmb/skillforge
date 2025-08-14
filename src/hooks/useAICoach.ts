/**
 * useAICoach Hook
 * Hook React pour intégrer l'AI Learning Coach avec les données utilisateur
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useSkills } from '@/hooks/useSkills';
import { useAchievements } from '@/hooks/useAchievements';
import { aiLearningCoach } from '@/lib/ai-learning-coach';
import type { 
  CoachInsight, 
  CoachPriority, 
  CoachTiming, 
  UserLearningState,
  CoachInsightType 
} from '@/lib/ai-learning-coach';
import type { LearningMetrics, LearningSession } from '@/stores/useAppStore';
import { logger } from '@/lib/logger';

export interface UseAICoachState {
  // Coach insights
  insights: CoachInsight[];
  urgentInsights: CoachInsight[];
  activeInsights: CoachInsight[];
  
  // User learning state
  userLearningState: UserLearningState | null;
  
  // Loading states
  isAnalyzing: boolean;
  isLoadingInsights: boolean;
  
  // Error states
  error: string | null;
  
  // Coach settings
  coachEnabled: boolean;
  coachPersonality: 'encouraging' | 'analytical' | 'friendly' | 'professional';
}

export interface UseAICoachActions {
  // Analysis actions
  analyzeUserState: () => Promise<void>;
  refreshInsights: () => Promise<void>;
  
  // Insight management
  markInsightAsSeen: (insightId: string) => void;
  dismissInsight: (insightId: string) => void;
  getInsightsByTiming: (timing: CoachTiming) => CoachInsight[];
  getInsightsByPriority: (priority: CoachPriority) => CoachInsight[];
  
  // Coach settings
  toggleCoach: (enabled: boolean) => void;
  setCoachPersonality: (personality: UseAICoachState['coachPersonality']) => void;
  
  // Actions from insights
  executeInsightAction: (insightId: string, actionId: string) => void;
}

export interface UseAICoachReturn extends UseAICoachState, UseAICoachActions {}

export function useAICoach(): UseAICoachReturn {
  // State management
  const [state, setState] = useState<UseAICoachState>({
    insights: [],
    urgentInsights: [],
    activeInsights: [],
    userLearningState: null,
    isAnalyzing: false,
    isLoadingInsights: false,
    error: null,
    coachEnabled: true,
    coachPersonality: 'encouraging'
  });

  // External hooks
  const { skills, userProgress, getSkillCompletionPercentage } = useSkills();
  const { achievements, notifications } = useAchievements();
  const { 
    learningMetrics, 
    currentSession, 
    updateLearningMetrics 
  } = useAppStore();

  // Memoized learning session data
  const currentLearningSession = useMemo((): LearningSession | undefined => {
    if (!currentSession) return undefined;

    return {
      sessionId: currentSession.sessionId || `session-${Date.now()}`,
      skillId: currentSession.skillId as any,
      startTime: currentSession.startTime || Date.now(),
      timeSpent: currentSession.timeSpent || 0,
      questionsAnswered: currentSession.questionsAnswered || 0,
      correctAnswers: currentSession.correctAnswers || 0,
      accuracy: currentSession.accuracy || 0,
      completed: currentSession.completed || false
    };
  }, [currentSession]);

  // Analyze user learning state
  const analyzeUserState = useCallback(async () => {
    if (!state.coachEnabled || !learningMetrics) return;

    try {
      setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

      logger.info('AI Coach analyzing user state', {
        hasMetrics: !!learningMetrics,
        hasSession: !!currentLearningSession,
        skillsCount: skills.length,
        achievementsCount: achievements.length
      });

      // Analyze user state with AI coach
      const userState = aiLearningCoach.analyzeUserState(
        learningMetrics,
        achievements,
        currentLearningSession,
        skills
      );

      // Generate insights based on analysis
      const newInsights = await aiLearningCoach.generateInsights(
        userState,
        learningMetrics,
        achievements,
        currentLearningSession
      );

      logger.info('AI Coach analysis complete', {
        userState: {
          energyLevel: userState.energyLevel,
          focusLevel: userState.focusLevel,
          motivationLevel: userState.motivationLevel,
          streak: userState.currentStreak
        },
        insightsGenerated: newInsights.length
      });

      setState(prev => ({
        ...prev,
        userLearningState: userState,
        insights: newInsights,
        urgentInsights: newInsights.filter(i => i.priority === 'urgent'),
        activeInsights: newInsights.filter(i => !i.seenAt),
        isAnalyzing: false
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze user state';
      
      logger.error('AI Coach analysis failed', {
        error: errorMessage,
        hasMetrics: !!learningMetrics,
        hasSession: !!currentLearningSession
      });

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage
      }));
    }
  }, [state.coachEnabled, learningMetrics, currentLearningSession, skills, achievements]);

  // Refresh insights from coach
  const refreshInsights = useCallback(async () => {
    if (!state.coachEnabled) return;

    try {
      setState(prev => ({ ...prev, isLoadingInsights: true, error: null }));

      const activeInsights = aiLearningCoach.getActiveInsights();
      const urgentInsights = aiLearningCoach.getInsightsByPriority('urgent');

      setState(prev => ({
        ...prev,
        insights: activeInsights,
        urgentInsights,
        activeInsights: activeInsights.filter(i => !i.seenAt),
        isLoadingInsights: false
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh insights';
      
      setState(prev => ({
        ...prev,
        isLoadingInsights: false,
        error: errorMessage
      }));
    }
  }, [state.coachEnabled]);

  // Mark insight as seen
  const markInsightAsSeen = useCallback((insightId: string) => {
    aiLearningCoach.markInsightAsSeen(insightId);
    
    setState(prev => ({
      ...prev,
      insights: prev.insights.map(insight =>
        insight.id === insightId ? { ...insight, seenAt: Date.now() } : insight
      ),
      activeInsights: prev.activeInsights.filter(insight => insight.id !== insightId)
    }));

    logger.debug('AI Coach insight marked as seen', { insightId });
  }, []);

  // Dismiss insight (remove from display)
  const dismissInsight = useCallback((insightId: string) => {
    markInsightAsSeen(insightId);
    
    // Also remove from urgent if present
    setState(prev => ({
      ...prev,
      urgentInsights: prev.urgentInsights.filter(insight => insight.id !== insightId)
    }));
  }, [markInsightAsSeen]);

  // Get insights by timing
  const getInsightsByTiming = useCallback((timing: CoachTiming): CoachInsight[] => {
    return aiLearningCoach.getInsightsByTiming(timing);
  }, []);

  // Get insights by priority
  const getInsightsByPriority = useCallback((priority: CoachPriority): CoachInsight[] => {
    return aiLearningCoach.getInsightsByPriority(priority);
  }, []);

  // Toggle coach enabled/disabled
  const toggleCoach = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, coachEnabled: enabled }));
    
    if (!enabled) {
      aiLearningCoach.reset();
      setState(prev => ({
        ...prev,
        insights: [],
        urgentInsights: [],
        activeInsights: [],
        userLearningState: null
      }));
    }

    logger.info('AI Coach toggled', { enabled });
  }, []);

  // Set coach personality
  const setCoachPersonality = useCallback((personality: UseAICoachState['coachPersonality']) => {
    setState(prev => ({ ...prev, coachPersonality: personality }));
    logger.info('AI Coach personality changed', { personality });
  }, []);

  // Execute insight action
  const executeInsightAction = useCallback((insightId: string, actionId: string) => {
    const insight = state.insights.find(i => i.id === insightId);
    const action = insight?.actions?.find(a => a.id === actionId);
    
    if (!action) {
      logger.warn('AI Coach action not found', { insightId, actionId });
      return;
    }

    logger.info('AI Coach action executed', {
      insightId,
      actionId,
      actionType: action.type,
      actionLabel: action.label
    });

    // Mark insight as seen when action is taken
    markInsightAsSeen(insightId);

    // Execute action based on type
    switch (action.type) {
      case 'navigate':
        // Handle navigation actions
        if (action.data?.path) {
          window.location.href = action.data.path;
        }
        break;
      
      case 'modal':
        // Handle modal actions
        // This would integrate with your modal system
        break;
      
      case 'dismiss':
        dismissInsight(insightId);
        break;
    }
  }, [state.insights, markInsightAsSeen, dismissInsight]);

  // Auto-analyze when dependencies change
  useEffect(() => {
    if (state.coachEnabled && learningMetrics && skills.length > 0) {
      // Debounce analysis to avoid too frequent calls
      const timeoutId = setTimeout(() => {
        analyzeUserState();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [state.coachEnabled, learningMetrics, skills.length, analyzeUserState]);

  // Auto-refresh insights periodically
  useEffect(() => {
    if (state.coachEnabled) {
      const intervalId = setInterval(() => {
        refreshInsights();
      }, 60000); // Refresh every minute

      return () => clearInterval(intervalId);
    }
  }, [state.coachEnabled, refreshInsights]);

  // Return hook interface
  return {
    // State
    ...state,
    
    // Actions
    analyzeUserState,
    refreshInsights,
    markInsightAsSeen,
    dismissInsight,
    getInsightsByTiming,
    getInsightsByPriority,
    toggleCoach,
    setCoachPersonality,
    executeInsightAction
  };
}