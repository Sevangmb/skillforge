import type { Achievement, User, Skill } from './types';

// Achievement interface moved to types.ts for better organization

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-steps',
    title: 'First Steps',
    description: 'Complete your first skill',
    icon: '🎯',
    category: 'milestone',
    rarity: 'common',
    unlocked: false,
    xpReward: 100,
    condition: {
      type: 'first_skill',
      value: 1
    }
  },
  {
    id: 'skill-master',
    title: 'Skill Master',
    description: 'Complete 5 skills',
    icon: '🏆',
    category: 'learning',
    rarity: 'rare',
    unlocked: false,
    xpReward: 250,
    condition: {
      type: 'skills_completed',
      value: 5
    }
  },
  {
    id: 'knowledge-seeker',
    title: 'Knowledge Seeker',
    description: 'Complete 10 skills',
    icon: '📚',
    category: 'learning',
    rarity: 'epic',
    unlocked: false,
    xpReward: 500,
    condition: {
      type: 'skills_completed',
      value: 10
    }
  },
  {
    id: 'xp-collector',
    title: 'XP Collector',
    description: 'Earn 1000 total XP',
    icon: '⭐',
    category: 'milestone',
    rarity: 'rare',
    unlocked: false,
    xpReward: 300,
    condition: {
      type: 'total_xp',
      value: 1000
    }
  },
  {
    id: 'perfect-score',
    title: 'Perfect Score',
    description: 'Get 100% on 3 quizzes',
    icon: '💯',
    category: 'learning',
    rarity: 'epic',
    unlocked: false,
    xpReward: 400,
    condition: {
      type: 'perfect_quizzes',
      value: 3
    }
  },
  {
    id: 'dedicated-learner',
    title: 'Dedicated Learner',
    description: 'Learn for 7 consecutive days',
    icon: '🔥',
    category: 'milestone',
    rarity: 'legendary',
    unlocked: false,
    xpReward: 1000,
    condition: {
      type: 'streak_days',
      value: 7
    }
  }
];

export function checkAchievements(
  user: User,
  skills: Skill[],
  quizResults: any[] = []
): Achievement[] {
  const unlockedAchievements: Achievement[] = [];
  
  const completedSkills = skills.filter(skill => 
    user.competences[skill.id]?.completed
  );
  
  const totalXP = user.profile.totalPoints || 0;
  const perfectQuizzes = quizResults.filter(result => result.score === 100).length;
  
  ACHIEVEMENTS.forEach(achievement => {
    if (achievement.unlocked) return;
    
    let shouldUnlock = false;
    
    switch (achievement.condition.type) {
      case 'first_skill':
        shouldUnlock = completedSkills.length >= achievement.condition.value;
        break;
      case 'skills_completed':
        shouldUnlock = completedSkills.length >= achievement.condition.value;
        break;
      case 'total_xp':
        shouldUnlock = totalXP >= achievement.condition.value;
        break;
      case 'perfect_quizzes':
        shouldUnlock = perfectQuizzes >= achievement.condition.value;
        break;
      case 'streak_days':
        // TODO: Implement streak tracking
        shouldUnlock = false;
        break;
    }
    
    if (shouldUnlock) {
      unlockedAchievements.push({
        ...achievement,
        unlocked: true,
        unlockedAt: new Date()
      });
    }
  });
  
  return unlockedAchievements;
}

export function getAchievementProgress(
  achievement: Achievement,
  user: User,
  skills: Skill[],
  quizResults: any[] = []
): number {
  const completedSkills = skills.filter(skill => 
    user.competences[skill.id]?.completed
  );
  
  const totalXP = user.profile.totalPoints || 0;
  const perfectQuizzes = quizResults.filter(result => result.score === 100).length;
  
  switch (achievement.condition.type) {
    case 'first_skill':
      return Math.min(completedSkills.length, achievement.condition.value);
    case 'skills_completed':
      return Math.min(completedSkills.length, achievement.condition.value);
    case 'total_xp':
      return Math.min(totalXP, achievement.condition.value);
    case 'perfect_quizzes':
      return Math.min(perfectQuizzes, achievement.condition.value);
    case 'streak_days':
      return 0; // TODO: Implement streak tracking
    default:
      return 0;
  }
} 