"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Achievement } from '@/lib/types';

interface AchievementBadgeProps {
  achievement: Achievement;
  progress?: number;
  onClick?: () => void;
  className?: string;
}

const rarityColors: Record<Achievement['rarity'], string> = {
  common: 'border-gray-300 bg-gray-50',
  rare: 'border-blue-300 bg-blue-50',
  epic: 'border-purple-300 bg-purple-50',
  legendary: 'border-yellow-300 bg-yellow-50',
};

const rarityLabels: Record<Achievement['rarity'], string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

export function AchievementBadge({ 
  achievement, 
  progress = 0, 
  onClick,
  className 
}: AchievementBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);

  const progressPercentage = achievement.maxProgress 
    ? (progress / achievement.maxProgress) * 100 
    : 0;

  const isUnlocked = achievement.unlocked;
  const isInProgress = !isUnlocked && progress > 0;

  return (
    <Card
      className={cn(
        "transition-all duration-200 cursor-pointer",
        rarityColors[achievement.rarity],
        isUnlocked && "ring-2 ring-green-400",
        isHovered && "scale-105 shadow-lg",
        className
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className="text-2xl flex-shrink-0">
            {achievement.icon}
          </div>

          {/* Content */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">{achievement.title}</h3>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  achievement.rarity === 'legendary' && "text-yellow-600",
                  achievement.rarity === 'epic' && "text-purple-600",
                  achievement.rarity === 'rare' && "text-blue-600",
                  achievement.rarity === 'common' && "text-gray-600"
                )}
              >
                {rarityLabels[achievement.rarity]}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground">
              {achievement.description}
            </p>

            {/* Progress Bar */}
            {!isUnlocked && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Progress</span>
                  <span>{progress}/{achievement.condition.value}</span>
                </div>
                <Progress value={progressPercentage} className="h-1" />
              </div>
            )}

            {/* XP Reward */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">XP Reward</span>
              <span className="font-medium text-green-600">
                +{achievement.xpReward} XP
              </span>
            </div>

            {/* Unlock Date */}
            {isUnlocked && achievement.unlockedAt && (
              <div className="text-xs text-muted-foreground">
                Unlocked {achievement.unlockedAt.toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}