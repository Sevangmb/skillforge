"use client";

import { useAchievements } from '@/stores/useAppStore';
import { useUnlockedAchievements } from '@/hooks/useAchievements';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star } from 'lucide-react';

export function AchievementsWidget() {
  const achievements = useAchievements();
  const unlockedAchievements = useUnlockedAchievements();

  const unlockedCount = unlockedAchievements.length;
  const totalCount = achievements.length;
  const progressPercentage = (unlockedCount / totalCount) * 100;

  // Get recent achievements (last 3 unlocked)
  const recentAchievements = unlockedAchievements
    .sort((a, b) => (b.unlockedAt?.getTime() || 0) - (a.unlockedAt?.getTime() || 0))
    .slice(0, 3);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span>Achievements</span>
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {unlockedCount}/{totalCount}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Recent Achievements */}
        {recentAchievements.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">Recent</h4>
            <div className="space-y-2">
              {recentAchievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center space-x-2">
                  <div className="text-lg">{achievement.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{achievement.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {achievement.description}
                    </p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className="text-xs flex-shrink-0"
                  >
                    {achievement.rarity}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Achievement */}
        {unlockedCount < totalCount && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">Next Goal</h4>
            <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded-md">
              <Star className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">
                  {achievements.find(a => !a.unlocked)?.title || 'Complete more skills'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {achievements.find(a => !a.unlocked)?.description || 'Keep learning to unlock more achievements'}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 