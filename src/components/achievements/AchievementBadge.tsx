"use client";

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Trophy, 
  Target, 
  Zap, 
  Star, 
  Award, 
  Crown, 
  Flame,
  BookOpen,
  TrendingUp,
  Calendar
} from 'lucide-react';

export type Achievement = {
  id: string;
  name: string;
  description: string;
  type: 'progress' | 'streak' | 'skill' | 'speed' | 'milestone' | 'social';
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement: number;
  progress: number;
  unlocked: boolean;
  unlockedAt?: Date;
};

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}

const iconMap = {
  trophy: Trophy,
  target: Target,
  zap: Zap,
  star: Star,
  award: Award,
  crown: Crown,
  flame: Flame,
  book: BookOpen,
  trending: TrendingUp,
  calendar: Calendar,
};

const rarityColors = {
  common: 'bg-slate-100 border-slate-300 text-slate-700',
  rare: 'bg-blue-100 border-blue-300 text-blue-700',
  epic: 'bg-purple-100 border-purple-300 text-purple-700',
  legendary: 'bg-amber-100 border-amber-300 text-amber-700',
};

const rarityGlow = {
  common: '',
  rare: 'shadow-blue-200/50',
  epic: 'shadow-purple-200/50',
  legendary: 'shadow-amber-200/50 animate-pulse',
};

export default function AchievementBadge({ 
  achievement, 
  size = 'md', 
  showProgress = false 
}: AchievementBadgeProps) {
  const IconComponent = iconMap[achievement.icon as keyof typeof iconMap] || Trophy;
  
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16', 
    lg: 'w-20 h-20'
  };

  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };

  const progressPercentage = achievement.unlocked 
    ? 100 
    : Math.min((achievement.progress / achievement.requirement) * 100, 100);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card 
            className={`
              ${sizeClasses[size]} 
              relative overflow-hidden transition-all duration-300 hover:scale-105 cursor-pointer
              ${achievement.unlocked 
                ? `${rarityColors[achievement.rarity]} shadow-lg ${rarityGlow[achievement.rarity]}`
                : 'bg-muted border-muted-foreground/20 text-muted-foreground'
              }
            `}
          >
            <CardContent className="p-0 flex items-center justify-center h-full relative">
              <IconComponent 
                className={`
                  ${iconSizes[size]} 
                  ${achievement.unlocked ? '' : 'opacity-50'}
                `} 
              />
              
              {/* Progress Ring for Unlocked */}
              {achievement.unlocked && (
                <div className="absolute inset-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="45%"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={`${progressPercentage * 2.83} 283`}
                      className="opacity-20"
                    />
                  </svg>
                </div>
              )}

              {/* Progress Ring for In Progress */}
              {!achievement.unlocked && showProgress && achievement.progress > 0 && (
                <div className="absolute inset-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="45%"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={`${progressPercentage * 2.83} 283`}
                      className="opacity-50"
                    />
                  </svg>
                </div>
              )}

              {/* Rarity Badge */}
              {achievement.unlocked && achievement.rarity !== 'common' && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-1 -right-1 text-xs px-1 py-0 h-4"
                >
                  {achievement.rarity}
                </Badge>
              )}
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold">{achievement.name}</h4>
              <Badge variant="outline" className="text-xs">
                {achievement.rarity}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {achievement.description}
            </p>
            {!achievement.unlocked && (
              <div className="text-xs">
                <div className="flex justify-between items-center">
                  <span>Progress:</span>
                  <span>{achievement.progress}/{achievement.requirement}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-1">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}
            {achievement.unlocked && achievement.unlockedAt && (
              <p className="text-xs text-muted-foreground">
                Unlocked {achievement.unlockedAt.toLocaleDateString()}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}