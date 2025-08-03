"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Trophy, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Achievement } from '@/lib/types';

interface AchievementNotificationProps {
  achievement: Achievement;
  onClose: () => void;
  className?: string;
}

const rarityColors: Record<Achievement['rarity'], string> = {
  common: 'border-green-200 bg-green-50',
  rare: 'border-blue-200 bg-blue-50',
  epic: 'border-purple-200 bg-purple-50',
  legendary: 'border-yellow-200 bg-yellow-50',
};

const rarityGlow: Record<Achievement['rarity'], string> = {
  common: 'shadow-green-200/50',
  rare: 'shadow-blue-200/50',
  epic: 'shadow-purple-200/50',
  legendary: 'shadow-yellow-200/50 animate-pulse',
};

export function AchievementNotification({ 
  achievement, 
  onClose, 
  className 
}: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto close after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <Card
      className={cn(
        "transition-all duration-300 transform",
        rarityColors[achievement.rarity],
        rarityGlow[achievement.rarity],
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* Icon with sparkles */}
          <div className="relative">
            <div className="text-3xl">{achievement.icon}</div>
            <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500 animate-pulse" />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <h3 className="font-semibold text-sm">Achievement Unlocked!</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onClose, 300);
                }}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            <div>
              <h4 className="font-medium text-sm">{achievement.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">
                {achievement.description}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  achievement.rarity === 'legendary' && "text-yellow-600",
                  achievement.rarity === 'epic' && "text-purple-600",
                  achievement.rarity === 'rare' && "text-blue-600",
                  achievement.rarity === 'common' && "text-green-600"
                )}
              >
                {achievement.rarity}
              </Badge>
              <span className="text-xs font-medium text-green-600">
                +{achievement.xpReward} XP
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 