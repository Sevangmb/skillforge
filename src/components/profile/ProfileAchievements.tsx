"use client";

import { useState, useMemo } from 'react';
import { User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Star, 
  Medal, 
  Target, 
  Search,
  Calendar,
  Zap,
  Crown,
  Filter,
  Award,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'skill' | 'progress' | 'streak' | 'challenge' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  unlockedAt?: Date;
  progress?: {
    current: number;
    total: number;
  };
}

interface ProfileAchievementsProps {
  user: User;
}

// Mock achievements data - in real app, this would come from the user data
const mockAchievements: Achievement[] = [
  {
    id: 'first_skill',
    title: 'Premier Pas',
    description: 'Terminer votre première compétence',
    icon: '🎯',
    category: 'skill',
    rarity: 'common',
    points: 50,
    unlockedAt: new Date(2024, 0, 15),
  },
  {
    id: 'skill_master',
    title: 'Maître des Compétences',
    description: 'Terminer 10 compétences avec une moyenne de 90%+',
    icon: '🏆',
    category: 'skill',
    rarity: 'epic',
    points: 500,
    unlockedAt: new Date(2024, 2, 20),
  },
  {
    id: 'week_streak',
    title: 'Série Hebdomadaire',
    description: 'Maintenir une série de 7 jours consécutifs',
    icon: '🔥',
    category: 'streak',
    rarity: 'rare',
    points: 200,
    unlockedAt: new Date(2024, 1, 10),
  },
  {
    id: 'perfect_quiz',
    title: 'Quiz Parfait',
    description: 'Répondre parfaitement à un quiz de 10 questions',
    icon: '⭐',
    category: 'challenge',
    rarity: 'rare',
    points: 300,
  },
  {
    id: 'speed_learner',
    title: 'Apprenant Rapide',
    description: 'Terminer 5 compétences en une journée',
    icon: '⚡',
    category: 'challenge',
    rarity: 'epic',
    points: 400,
    progress: {
      current: 3,
      total: 5
    }
  },
  {
    id: 'legend',
    title: 'Légende',
    description: 'Atteindre le niveau 50',
    icon: '👑',
    category: 'progress',
    rarity: 'legendary',
    points: 1000,
    progress: {
      current: 25,
      total: 50
    }
  }
];

const rarityColors = {
  common: 'bg-gray-100 text-gray-700 border-gray-300',
  rare: 'bg-blue-100 text-blue-700 border-blue-300',
  epic: 'bg-purple-100 text-purple-700 border-purple-300',
  legendary: 'bg-yellow-100 text-yellow-700 border-yellow-300'
};

const categoryIcons = {
  skill: Target,
  progress: Trophy,
  streak: Zap,
  challenge: Medal,
  special: Crown
};

export default function ProfileAchievements({ user }: ProfileAchievementsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { unlockedAchievements, lockedAchievements, totalPoints, categories } = useMemo(() => {
    const unlocked = mockAchievements.filter(a => a.unlockedAt);
    const locked = mockAchievements.filter(a => !a.unlockedAt);
    const totalPts = unlocked.reduce((sum, a) => sum + a.points, 0);
    const cats = Array.from(new Set(mockAchievements.map(a => a.category)));
    
    return {
      unlockedAchievements: unlocked,
      lockedAchievements: locked,
      totalPoints: totalPts,
      categories: cats
    };
  }, []);

  const filteredAchievements = (achievements: Achievement[]) => {
    return achievements.filter(achievement => {
      const matchesSearch = achievement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          achievement.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || achievement.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  };

  const renderAchievement = (achievement: Achievement, isUnlocked: boolean) => {
    const IconComponent = categoryIcons[achievement.category];
    const progress = achievement.progress;
    const progressPercentage = progress ? (progress.current / progress.total) * 100 : 0;

    return (
      <Card 
        key={achievement.id}
        className={`transition-all duration-200 hover:shadow-md ${
          isUnlocked ? '' : 'opacity-60 grayscale'
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Achievement Icon */}
            <div className={`p-3 rounded-full text-2xl bg-muted ${
              isUnlocked ? '' : 'opacity-50'
            }`}>
              {achievement.icon}
            </div>

            {/* Achievement Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-semibold text-base leading-tight">
                    {achievement.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {achievement.description}
                  </p>
                </div>
                
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${rarityColors[achievement.rarity]}`}
                  >
                    {achievement.rarity === 'common' && 'Commun'}
                    {achievement.rarity === 'rare' && 'Rare'}
                    {achievement.rarity === 'epic' && 'Épique'}
                    {achievement.rarity === 'legendary' && 'Légendaire'}
                  </Badge>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Trophy className="h-3 w-3" />
                    <span>{achievement.points} pts</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar for Locked Achievements */}
              {!isUnlocked && progress && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progression</span>
                    <span>{progress.current}/{progress.total}</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              )}

              {/* Unlock Date for Unlocked Achievements */}
              {isUnlocked && achievement.unlockedAt && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                  <Calendar className="h-3 w-3" />
                  <span>
                    Débloqué le {format(achievement.unlockedAt, 'dd MMMM yyyy', { locale: fr })}
                  </span>
                </div>
              )}

              {/* Category Badge */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <IconComponent className="h-3 w-3" />
                  <span className="capitalize">{achievement.category}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Achievement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{unlockedAchievements.length}</p>
            <p className="text-sm text-muted-foreground">Succès débloqués</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{mockAchievements.length}</p>
            <p className="text-sm text-muted-foreground">Succès totaux</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalPoints}</p>
            <p className="text-sm text-muted-foreground">Points gagnés</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {Math.round((unlockedAchievements.length / mockAchievements.length) * 100)}%
            </p>
            <p className="text-sm text-muted-foreground">Taux de complétion</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher des succès..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="all">Toutes les catégories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Tabs */}
      <Tabs defaultValue="unlocked" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="unlocked" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Débloqués ({unlockedAchievements.length})
          </TabsTrigger>
          <TabsTrigger value="locked" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            À débloquer ({lockedAchievements.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unlocked" className="space-y-4 mt-6">
          {filteredAchievements(unlockedAchievements).length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Aucun succès débloqué correspondant à vos critères.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredAchievements(unlockedAchievements)
                .sort((a, b) => (b.unlockedAt?.getTime() || 0) - (a.unlockedAt?.getTime() || 0))
                .map(achievement => renderAchievement(achievement, true))
              }
            </div>
          )}
        </TabsContent>

        <TabsContent value="locked" className="space-y-4 mt-6">
          {filteredAchievements(lockedAchievements).length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Aucun succès à débloquer correspondant à vos critères.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredAchievements(lockedAchievements)
                .sort((a, b) => {
                  // Sort by progress completion, then by points
                  const aProgress = a.progress ? a.progress.current / a.progress.total : 0;
                  const bProgress = b.progress ? b.progress.current / b.progress.total : 0;
                  
                  if (aProgress !== bProgress) {
                    return bProgress - aProgress;
                  }
                  return b.points - a.points;
                })
                .map(achievement => renderAchievement(achievement, false))
              }
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}