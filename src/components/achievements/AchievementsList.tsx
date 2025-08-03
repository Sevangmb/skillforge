"use client";

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AchievementBadge } from './AchievementBadge';
import { Trophy, Search, Filter } from 'lucide-react';
import { ACHIEVEMENTS, getAchievementProgress } from '@/lib/achievements';
import type { Achievement } from '@/lib/types';

interface AchievementsListProps {
  user: any;
  skills: any[];
  quizResults?: any[];
  onAchievementClick?: (achievement: Achievement) => void;
}

type FilterType = 'all' | 'unlocked' | 'locked' | 'learning' | 'milestone' | 'social' | 'special';

export function AchievementsList({ 
  user, 
  skills, 
  quizResults = [], 
  onAchievementClick 
}: AchievementsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const achievementsWithProgress = useMemo(() => {
    return ACHIEVEMENTS.map(achievement => ({
      ...achievement,
      progress: getAchievementProgress(achievement, user, skills, quizResults),
      maxProgress: achievement.condition.value
    }));
  }, [user, skills, quizResults]);

  const filteredAchievements = useMemo(() => {
    let filtered = achievementsWithProgress;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(achievement =>
        achievement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        achievement.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    switch (filter) {
      case 'unlocked':
        filtered = filtered.filter(a => a.unlocked);
        break;
      case 'locked':
        filtered = filtered.filter(a => !a.unlocked);
        break;
      case 'learning':
      case 'milestone':
      case 'social':
      case 'special':
        filtered = filtered.filter(a => a.category === filter);
        break;
      default:
        break;
    }

    return filtered;
  }, [achievementsWithProgress, searchTerm, filter]);

  const unlockedCount = achievementsWithProgress.filter(a => a.unlocked).length;
  const totalCount = achievementsWithProgress.length;

  const filterOptions: { value: FilterType; label: string; count?: number }[] = [
    { value: 'all', label: 'All', count: totalCount },
    { value: 'unlocked', label: 'Unlocked', count: unlockedCount },
    { value: 'locked', label: 'Locked', count: totalCount - unlockedCount },
    { value: 'learning', label: 'Learning' },
    { value: 'milestone', label: 'Milestone' },
    { value: 'social', label: 'Social' },
    { value: 'special', label: 'Special' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <h2 className="text-lg font-semibold">Achievements</h2>
          <Badge variant="secondary">
            {unlockedCount}/{totalCount}
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search achievements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <Button
              key={option.value}
              variant={filter === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(option.value)}
              className="text-xs"
            >
              {option.label}
              {option.count !== undefined && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {option.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Achievements Grid */}
      <ScrollArea className="h-[400px]">
        <div className="grid gap-3">
          {filteredAchievements.length > 0 ? (
            filteredAchievements.map((achievement) => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                progress={achievement.progress}
                onClick={() => onAchievementClick?.(achievement)}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No achievements found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
} 