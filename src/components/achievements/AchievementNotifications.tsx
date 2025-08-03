"use client";

import { useEffect } from 'react';
import { useRecentUnlockedAchievements, useAppStore } from '@/stores/useAppStore';
import { AchievementNotification } from './AchievementNotification';

export function AchievementNotifications() {
  const recentAchievements = useRecentUnlockedAchievements();
  const { clearRecentAchievements } = useAppStore();

  useEffect(() => {
    // Clear recent achievements after 10 seconds
    if (recentAchievements.length > 0) {
      const timer = setTimeout(() => {
        clearRecentAchievements();
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [recentAchievements, clearRecentAchievements]);

  if (recentAchievements.length === 0) return null;

  return (
    <div className="fixed top-4 left-4 z-50 space-y-2">
      {recentAchievements.map((achievement, index) => (
        <AchievementNotification
          key={`${achievement.id}-${index}`}
          achievement={achievement}
          onClose={() => {
            // Remove this specific achievement from recent
            // This would need to be implemented in the store
          }}
          className="w-80"
        />
      ))}
    </div>
  );
} 