/**
 * SkillForge AI - Smart Achievement Display
 * Comprehensive achievement system with intelligent recommendations and beautiful UI
 */

"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Star, 
  Zap, 
  Target, 
  Clock, 
  TrendingUp, 
  Award,
  Crown,
  Sparkles,
  ChevronRight,
  Bell,
  CheckCircle,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAchievements } from '@/hooks/useAchievements';
import { 
  AchievementCategory, 
  AchievementRarity, 
  Achievement,
  UserAchievement 
} from '@/lib/achievement-types';
import { useAuth } from '@/contexts/AuthContext';

interface SmartAchievementDisplayProps {
  showRecentOnly?: boolean;
  maxDisplay?: number;
  compact?: boolean;
  showNotifications?: boolean;
}

const RARITY_COLORS = {
  common: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  uncommon: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rare: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  epic: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  legendary: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
};

const RARITY_ICONS = {
  common: Trophy,
  uncommon: Star,
  rare: Award,
  epic: Crown,
  legendary: Sparkles
};

const CATEGORY_ICONS = {
  learning: Trophy,
  progress: TrendingUp,
  streak: Zap,
  mastery: Crown,
  social: Target,
  special: Sparkles,
  milestone: Award
};

export default function SmartAchievementDisplay({ 
  showRecentOnly = false, 
  maxDisplay = 10,
  compact = false,
  showNotifications = true
}: SmartAchievementDisplayProps) {
  const { user } = useAuth();
  const {
    allAchievements,
    userAchievements,
    achievementStats,
    notifications,
    unreadNotifications,
    recommendations,
    isLoading,
    error,
    getUnlockedAchievements,
    getLockedAchievements,
    getAchievementsByCategory,
    getAchievementsByRarity,
    getAchievementProgress,
    isAchievementUnlocked,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    triggerAchievementCheck
  } = useAchievements();

  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [selectedRarity, setSelectedRarity] = useState<AchievementRarity | 'all'>('all');
  const [showOnlyUnlocked, setShowOnlyUnlocked] = useState(false);
  const [animatingAchievements, setAnimatingAchievements] = useState<Set<string>>(new Set());

  // Demo achievement unlock effect
  const demoUnlockAchievement = async () => {
    if (!user) return;
    
    const newAchievements = await triggerAchievementCheck('skill_completed', {
      skillsCompleted: (userAchievements.filter(ua => ua.isCompleted).length || 0) + 1,
      userLevel: user.level || 1,
      totalXP: (user.totalPoints || 0) + 100
    });
    
    // Animate new achievements
    newAchievements.forEach(achievement => {
      setAnimatingAchievements(prev => new Set(prev.add(achievement.id)));
      setTimeout(() => {
        setAnimatingAchievements(prev => {
          const newSet = new Set(prev);
          newSet.delete(achievement.id);
          return newSet;
        });
      }, 2000);
    });
  };

  // Filter achievements based on selection
  const getFilteredAchievements = () => {
    let achievements = showOnlyUnlocked ? 
      getUnlockedAchievements().map(ua => allAchievements.find(a => a.id === ua.achievementId)!).filter(Boolean) :
      allAchievements;

    if (selectedCategory !== 'all') {
      achievements = achievements.filter(a => a.category === selectedCategory);
    }

    if (selectedRarity !== 'all') {
      achievements = achievements.filter(a => a.rarity === selectedRarity);
    }

    if (showRecentOnly && showOnlyUnlocked) {
      const recentUnlocked = getUnlockedAchievements()
        .sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime())
        .slice(0, maxDisplay);
      achievements = recentUnlocked.map(ua => allAchievements.find(a => a.id === ua.achievementId)!).filter(Boolean);
    } else {
      achievements = achievements.slice(0, maxDisplay);
    }

    return achievements;
  };

  const renderAchievementCard = (achievement: Achievement) => {
    const isUnlocked = isAchievementUnlocked(achievement.id);
    const progress = getAchievementProgress(achievement.id);
    const IconComponent = RARITY_ICONS[achievement.rarity];
    const isAnimating = animatingAchievements.has(achievement.id);

    return (
      <motion.div
        key={achievement.id}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ 
          opacity: 1, 
          scale: isAnimating ? 1.05 : 1,
          boxShadow: isAnimating ? '0 0 20px rgba(255, 215, 0, 0.5)' : '0 1px 3px rgba(0,0,0,0.1)'
        }}
        transition={{ duration: 0.3 }}
        className="group"
      >
        <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-md ${
          isUnlocked ? 'border-primary/20 bg-primary/5' : 'border-muted'
        } ${isAnimating ? 'ring-2 ring-yellow-400' : ''}`}>
          {isUnlocked && (
            <div className="absolute top-2 right-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          )}
          
          {!isUnlocked && achievement.isHidden && (
            <div className="absolute top-2 right-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg ${isUnlocked ? 'bg-primary/20' : 'bg-muted'}`}>
                  <span className="text-xl" role="img" aria-label={achievement.title}>
                    {achievement.icon}
                  </span>
                </div>
                <div>
                  <CardTitle className={`text-sm ${!isUnlocked ? 'text-muted-foreground' : ''}`}>
                    {achievement.title}
                  </CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={`text-xs ${RARITY_COLORS[achievement.rarity]}`}>
                      {achievement.rarity}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {achievement.points} pts
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <p className={`text-sm mb-3 ${!isUnlocked ? 'text-muted-foreground' : ''}`}>
              {achievement.isHidden && !isUnlocked ? '???' : achievement.description}
            </p>
            
            {progress && !isUnlocked && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{Math.round(progress.progress)}%</span>
                </div>
                <Progress value={progress.progress} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {progress.currentValue}/{progress.targetValue}
                </div>
              </div>
            )}
            
            {isUnlocked && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Unlocked</span>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 animate-pulse" />
            Smart Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
            <p>Loading achievements...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trophy className="h-5 w-5" />
            Achievement System Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive text-sm">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              size="sm"
            >
              Reload
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    const recentUnlocked = getUnlockedAchievements().slice(0, 3);
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Recent Achievements
            </div>
            {unreadNotifications > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadNotifications}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentUnlocked.length > 0 ? (
            <div className="space-y-2">
              {recentUnlocked.map(ua => {
                const achievement = allAchievements.find(a => a.id === ua.achievementId);
                if (!achievement) return null;
                return (
                  <div key={ua.id} className="flex items-center space-x-3 p-2 rounded-lg bg-muted/30">
                    <span className="text-lg">{achievement.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{achievement.title}</p>
                      <p className="text-xs text-muted-foreground">{achievement.points} points</p>
                    </div>
                    <Badge className={`text-xs ${RARITY_COLORS[achievement.rarity]}`}>
                      {achievement.rarity}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No achievements yet</p>
              <Button 
                onClick={demoUnlockAchievement}
                size="sm"
                className="mt-2"
              >
                Try Demo Achievement
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const filteredAchievements = getFilteredAchievements();

  return (
    <div className="space-y-6">
      {/* Achievement Stats Overview */}
      {achievementStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{achievementStats.totalUnlocked}</div>
                <div className="text-sm text-muted-foreground">Unlocked</div>
                <div className="text-xs text-muted-foreground mt-1">
                  of {achievementStats.totalAchievements} total
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{achievementStats.totalPoints}</div>
                <div className="text-sm text-muted-foreground">Points</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {Math.round(achievementStats.completionRate)}% complete
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{achievementStats.rareAchievements}</div>
                <div className="text-sm text-muted-foreground">Rare+</div>
                <div className="text-xs text-muted-foreground mt-1">
                  special achievements
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{achievementStats.streakAchievements}</div>
                <div className="text-sm text-muted-foreground">Streaks</div>
                <div className="text-xs text-muted-foreground mt-1">
                  consistency awards
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Achievement Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Smart Achievements
            </CardTitle>
            <div className="flex items-center space-x-2">
              {showNotifications && unreadNotifications > 0 && (
                <Button 
                  onClick={markAllNotificationsAsRead}
                  size="sm"
                  variant="outline"
                  className="flex items-center space-x-1"
                >
                  <Bell className="h-4 w-4" />
                  <span>{unreadNotifications}</span>
                </Button>
              )}
              <Button 
                onClick={demoUnlockAchievement}
                size="sm"
                className="flex items-center space-x-1"
              >
                <Zap className="h-4 w-4" />
                <span>Demo Unlock</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="achievements" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="achievements">All Achievements</TabsTrigger>
              <TabsTrigger value="recommendations">Recommended</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="achievements" className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setShowOnlyUnlocked(!showOnlyUnlocked)}
                  variant={showOnlyUnlocked ? "default" : "outline"}
                  size="sm"
                >
                  {showOnlyUnlocked ? 'Unlocked Only' : 'All Achievements'}
                </Button>
              </div>
              
              {/* Achievement Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {filteredAchievements.map(achievement => renderAchievementCard(achievement))}
                </AnimatePresence>
              </div>
              
              {filteredAchievements.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No achievements found with current filters</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="recommendations" className="space-y-4">
              {recommendations.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.map(rec => (
                    <Card key={rec.achievement.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{rec.achievement.icon}</span>
                            <div>
                              <h4 className="font-medium">{rec.achievement.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{rec.reasoning}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <Badge variant="outline">{rec.difficulty}</Badge>
                                <Badge variant="outline">{rec.estimatedTime}h</Badge>
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Target className="h-3 w-3 mr-1" />
                                  Priority: {rec.priority}/10
                                </div>
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recommendations available</p>
                  <p className="text-sm mt-2">Keep learning to unlock personalized suggestions!</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="stats" className="space-y-4">
              {achievementStats && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Category Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(achievementStats.categoryBreakdown).map(([category, count]) => {
                        const IconComponent = CATEGORY_ICONS[category as AchievementCategory];
                        return (
                          <div key={category} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <IconComponent className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm capitalize">{category}</span>
                            </div>
                            <Badge variant="outline">{count}</Badge>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {achievementStats.recentUnlocks.length > 0 ? (
                        <div className="space-y-2">
                          {achievementStats.recentUnlocks.map(ua => {
                            const achievement = allAchievements.find(a => a.id === ua.achievementId);
                            if (!achievement) return null;
                            return (
                              <div key={ua.id} className="flex items-center space-x-2 text-sm">
                                <span>{achievement.icon}</span>
                                <span className="flex-1 truncate">{achievement.title}</span>
                                <span className="text-xs text-muted-foreground">
                                  {ua.unlockedAt.toLocaleDateString()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No recent activity</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}