import { useMemo } from 'react';
import { useAchievements } from '@/stores/useAppStore';

export function useUnlockedAchievements() {
  const achievements = useAchievements();

  return useMemo(() => {
    return achievements.filter(a => a.unlocked);
  }, [achievements]);
} 