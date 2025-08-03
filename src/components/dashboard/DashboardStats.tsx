"use client";

import { useUser, useUserLevel, useTotalXP } from '@/stores/useAppStore';
import { useAvailableSkills, useCompletedSkills } from '@/hooks/useSkills';
import { AnimatedStats } from '@/components/ui/AnimatedStats';
import { AnimatedProgress } from '@/components/ui/AnimatedProgress';
import { Trophy, Target, BookOpen, TrendingUp } from 'lucide-react';

export function DashboardStats() {
  const user = useUser();
  const availableSkills = useAvailableSkills();
  const completedSkills = useCompletedSkills();
  const userLevel = useUserLevel();
  const totalXP = useTotalXP();

  if (!user) return null;

  const totalSkills = availableSkills.length + completedSkills.length;
  const progressPercentage = totalSkills > 0 ? (completedSkills.length / totalSkills) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Your Progress</h3>
        <AnimatedProgress 
          value={progressPercentage} 
          variant="success"
          size="lg"
          showLabel={false}
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{completedSkills.length} completed</span>
          <span>{availableSkills.length} available</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <AnimatedStats
          title="Level"
          value={userLevel}
          icon={<Trophy className="h-4 w-4" />}
          variant="success"
        />
        <AnimatedStats
          title="Total XP"
          value={totalXP}
          icon={<TrendingUp className="h-4 w-4" />}
          variant="default"
        />
        <AnimatedStats
          title="Completed"
          value={completedSkills.length}
          icon={<BookOpen className="h-4 w-4" />}
          variant="success"
        />
        <AnimatedStats
          title="Available"
          value={availableSkills.length}
          icon={<Target className="h-4 w-4" />}
          variant="warning"
        />
      </div>
    </div>
  );
} 