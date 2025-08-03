"use client";

import { useEffect, useState } from 'react';
import type { User } from '@/lib/types';
import type { QuizProgression, SpecializedQuiz } from '@/lib/specialized-quiz-system';

export interface UseSpecializationsResult {
  progressions: QuizProgression[];
  latestProgression: QuizProgression | null;
  unlockedQuizzes: SpecializedQuiz[];
  isLoading: boolean;
  error: string | null;
  hasNewProgressions: boolean;
  markProgressionAsViewed: (completedSkillId: string) => void;
  refreshProgressions: () => Promise<void>;
  getProgressionStats: () => {
    totalProgressions: number;
    totalSpecializedQuizzes: number;
    newSkillsUnlocked: number;
  };
}

/**
 * Hook pour gérer les spécialisations et progressions utilisateur
 */
export function useSpecializations(user: User | null): UseSpecializationsResult {
  const [progressions, setProgressions] = useState<QuizProgression[]>([]);
  const [latestProgression, setLatestProgression] = useState<QuizProgression | null>(null);
  const [unlockedQuizzes, setUnlockedQuizzes] = useState<SpecializedQuiz[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewedProgressions, setViewedProgressions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadProgressions();
    }
  }, [user?.id]);

  const loadProgressions = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Import dynamique pour éviter les dépendances circulaires
      const { specializedQuizManager } = await import('@/lib/specialized-quiz-system');
      
      // Récupérer les progressions utilisateur
      const userProgressions = specializedQuizManager.getUserProgressions(user.id);
      const latest = specializedQuizManager.getLatestProgression(user.id);
      
      // Récupérer tous les quiz spécialisés débloqués
      const allUnlockedQuizzes = userProgressions.flatMap(p => p.specializedQuizzes);
      
      setProgressions(userProgressions);
      setLatestProgression(latest);
      setUnlockedQuizzes(allUnlockedQuizzes);

      console.log(`Loaded ${userProgressions.length} progressions for user ${user.id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load specializations';
      setError(errorMessage);
      console.error('Error loading specializations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProgressions = async () => {
    await loadProgressions();
  };

  const markProgressionAsViewed = (completedSkillId: string) => {
    setViewedProgressions(prev => new Set(prev).add(completedSkillId));
    
    // Marquer comme présentée dans le manager
    if (user) {
      import('@/lib/specialized-quiz-system').then(({ specializedQuizManager }) => {
        specializedQuizManager.markProgressionAsPresented(user.id, completedSkillId);
      });
    }
  };

  const getProgressionStats = () => {
    return {
      totalProgressions: progressions.length,
      totalSpecializedQuizzes: unlockedQuizzes.length,
      newSkillsUnlocked: progressions.reduce((sum, p) => sum + p.specializedQuizzes.length, 0)
    };
  };

  // Déterminer s'il y a de nouvelles progressions non vues
  const hasNewProgressions = progressions.some(p => 
    p.status === 'generated' && !viewedProgressions.has(p.completedSkillId)
  );

  return {
    progressions,
    latestProgression,
    unlockedQuizzes,
    isLoading,
    error,
    hasNewProgressions,
    markProgressionAsViewed,
    refreshProgressions,
    getProgressionStats
  };
}

/**
 * Hook simplifié pour vérifier les nouvelles spécialisations
 */
export function useNewSpecializations(user: User | null) {
  const { hasNewProgressions, latestProgression, markProgressionAsViewed } = useSpecializations(user);
  
  return {
    hasNewSpecializations: hasNewProgressions,
    latestProgression,
    markAsViewed: markProgressionAsViewed
  };
}