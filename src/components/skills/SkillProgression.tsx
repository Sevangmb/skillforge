"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  BookOpen,
  Clock,
  Target,
  Award,
  Lock,
  CheckCircle,
  Play,
  Trophy,
  Star,
  TrendingUp,
  Users,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getVisibleDomains, 
  getVisibleLevels, 
  checkUnlockCriteria,
  SKILL_TEST_CONFIG 
} from '@/lib/skills/skillData';
import type { SkillDomain, SkillLevel, UserProgress, DomainProgress } from '@/lib/types/skills';

// Mock user progress - in real app, this would come from Firestore
const MOCK_USER_PROGRESS: UserProgress = {
  userId: 'current-user',
  domainProgress: {
    'web-fundamentals': {
      domainId: 'web-fundamentals',
      isUnlocked: true,
      isCompleted: false,
      currentLevel: 2,
      levelsCompleted: ['html-basics'],
      bestScores: {
        'html-basics': 85,
        'css-styling': 72,
      },
      totalAttempts: 3,
      totalTimeSpent: 45,
      averageScore: 78.5,
      strengthAreas: ['html', 'semantic'],
      improvementAreas: ['css-advanced', 'responsive'],
      unlockedAt: new Date('2024-01-15'),
    },
  },
  overallStats: {
    totalTests: 2,
    testsCompleted: 2,
    averageScore: 78.5,
    totalPointsEarned: 350,
    domainsUnlocked: 1,
    levelsCompleted: 1,
    strongestDomain: 'web-fundamentals',
  },
  achievements: [
    {
      id: 'first-test',
      name: 'Premier Test',
      description: 'Complétez votre premier test de compétence',
      icon: '🎯',
      type: 'completion',
      criteria: { domain: 'web-fundamentals' },
      reward: { points: 50, badge: 'novice' },
      earnedAt: new Date('2024-01-15'),
      rarity: 'common',
    },
  ],
  currentPath: {
    currentDomain: 'web-fundamentals',
    currentLevel: 'css-styling',
    recommendedNext: ['css-styling', 'javascript-fundamentals'],
  },
  lastActivity: new Date(),
};

interface SkillProgressionProps {
  userProgress?: UserProgress;
}

export default function SkillProgression({ userProgress = MOCK_USER_PROGRESS }: SkillProgressionProps) {
  const { user } = useAuth();
  const [selectedDomain, setSelectedDomain] = useState<SkillDomain | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel | null>(null);
  const [visibleDomains, setVisibleDomains] = useState<SkillDomain[]>([]);

  useEffect(() => {
    // Get domains visible to the user based on their progress
    const domains = getVisibleDomains(userProgress);
    setVisibleDomains(domains);
  }, [userProgress]);

  const getDomainProgress = (domainId: string): DomainProgress | undefined => {
    return userProgress.domainProgress[domainId];
  };

  const getDomainStatus = (domain: SkillDomain) => {
    const progress = getDomainProgress(domain.id);
    
    if (!progress) {
      // Check if can be unlocked
      const canUnlock = checkUnlockCriteria(userProgress, domain.id, 'domain');
      return canUnlock ? 'available' : 'locked';
    }
    
    if (progress.isCompleted) return 'completed';
    if (progress.isUnlocked) return 'in_progress';
    return 'locked';
  };

  const getLevelStatus = (level: SkillLevel, domainProgress?: DomainProgress) => {
    if (!domainProgress) return 'locked';
    
    const score = domainProgress.bestScores[level.id];
    if (score && score >= level.testConfiguration.passingScore) {
      return 'completed';
    }
    
    // Check if level is visible based on prerequisites
    const visibleLevels = getVisibleLevels(level.domainId, userProgress);
    const isVisible = visibleLevels.some(l => l.id === level.id);
    
    return isVisible ? 'available' : 'locked';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress': return <Play className="h-5 w-5 text-blue-500" />;
      case 'available': return <Target className="h-5 w-5 text-orange-500" />;
      case 'locked': return <Lock className="h-5 w-5 text-gray-400" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'available': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'locked': return 'bg-gray-100 text-gray-500 border-gray-200';
      default: return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  const calculateDomainProgress = (domain: SkillDomain) => {
    const domainProgress = getDomainProgress(domain.id);
    if (!domainProgress) return 0;
    
    const levels = getVisibleLevels(domain.id, userProgress);
    if (levels.length === 0) return 0;
    
    const completedLevels = levels.filter(level => 
      domainProgress.bestScores[level.id] >= level.testConfiguration.passingScore
    ).length;
    
    return Math.round((completedLevels / levels.length) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header with Overall Progress */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Progression des Compétences</h2>
          <p className="text-muted-foreground">
            Développez vos compétences étape par étape
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">{userProgress.overallStats.totalPointsEarned}</div>
          <div className="text-sm text-muted-foreground">Points totaux</div>
        </div>
      </div>

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests Complétés</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProgress.overallStats.testsCompleted}</div>
            <p className="text-xs text-muted-foreground">
              Score moyen: {userProgress.overallStats.averageScore}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Domaines Débloqués</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProgress.overallStats.domainsUnlocked}</div>
            <p className="text-xs text-muted-foreground">
              sur {visibleDomains.length} disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Niveaux Complétés</CardTitle>
            <Star className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProgress.overallStats.levelsCompleted}</div>
            <p className="text-xs text-muted-foreground">
              Progression continue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Domaine Fort</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">Web</div>
            <p className="text-xs text-muted-foreground">
              Fondamentaux
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Achievements Section */}
      {userProgress.achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5" />
              <span>Achievements Récents</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4 overflow-x-auto">
              {userProgress.achievements.map((achievement) => (
                <div key={achievement.id} className="flex-shrink-0 p-3 border rounded-lg min-w-[200px]">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">{achievement.icon}</span>
                    <div>
                      <div className="font-medium text-sm">{achievement.name}</div>
                      <Badge variant="secondary" className="text-xs">
                        {achievement.rarity}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  <div className="text-xs text-green-600 mt-1">
                    +{achievement.reward.points} points
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Domains Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleDomains.map((domain) => {
          const status = getDomainStatus(domain);
          const progress = calculateDomainProgress(domain);
          const domainProgress = getDomainProgress(domain.id);
          
          return (
            <Card 
              key={domain.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                status === 'locked' ? 'opacity-60' : ''
              }`}
              onClick={() => status !== 'locked' && setSelectedDomain(domain)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 ${domain.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                      {domain.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{domain.name}</CardTitle>
                      <Badge variant="outline">Niveau {domain.level}</Badge>
                    </div>
                  </div>
                  {getStatusIcon(status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{domain.description}</p>
                
                {/* Progress Bar */}
                {status !== 'locked' && (
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Progression</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                {/* Domain Stats */}
                {domainProgress && (
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-4">
                    <div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{domainProgress.totalTimeSpent}h passées</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-1">
                        <Target className="h-3 w-3" />
                        <span>{domainProgress.averageScore}% moyen</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Unlock Requirements */}
                {status === 'locked' && domain.unlockCriteria && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-orange-600">
                      <Lock className="h-4 w-4 inline mr-1" />
                      Critères de déblocage:
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {domain.unlockCriteria.requiredDomains && (
                        <li>• Compléter: {domain.unlockCriteria.requiredDomains.join(', ')}</li>
                      )}
                      {domain.unlockCriteria.requiredPoints && (
                        <li>• Obtenir {domain.unlockCriteria.requiredPoints} points</li>
                      )}
                      {domain.unlockCriteria.requiredLevel && (
                        <li>• Atteindre le niveau {domain.unlockCriteria.requiredLevel}</li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Action Button */}
                {status !== 'locked' && (
                  <Button 
                    className="w-full mt-4" 
                    variant={status === 'completed' ? 'outline' : 'default'}
                  >
                    {status === 'completed' ? 'Réviser' : 'Continuer'}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}

                {/* Tags */}
                {domain.metadata.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {domain.metadata.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {domain.metadata.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{domain.metadata.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Domain Detail Dialog */}
      {selectedDomain && (
        <Dialog open={!!selectedDomain} onOpenChange={() => setSelectedDomain(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3">
                <div className={`w-8 h-8 ${selectedDomain.color} rounded-lg flex items-center justify-center text-white`}>
                  {selectedDomain.icon}
                </div>
                <span>{selectedDomain.name}</span>
              </DialogTitle>
              <DialogDescription>
                {selectedDomain.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Domain Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{selectedDomain.metadata.estimatedHours}h</div>
                  <div className="text-sm text-muted-foreground">Durée estimée</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{selectedDomain.level}</div>
                  <div className="text-sm text-muted-foreground">Niveau requis</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{selectedDomain.metadata.difficulty}</div>
                  <div className="text-sm text-muted-foreground">Difficulté</div>
                </div>
              </div>

              {/* Levels List */}
              <div>
                <h4 className="font-medium mb-4">Niveaux du Domaine</h4>
                <div className="space-y-3">
                  {getVisibleLevels(selectedDomain.id, userProgress).map((level) => {
                    const domainProgress = getDomainProgress(selectedDomain.id);
                    const levelStatus = getLevelStatus(level, domainProgress);
                    const score = domainProgress?.bestScores[level.id];
                    
                    return (
                      <div 
                        key={level.id} 
                        className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${getStatusColor(levelStatus)}`}
                        onClick={() => levelStatus === 'available' && setSelectedLevel(level)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(levelStatus)}
                            <div>
                              <div className="font-medium">{level.name}</div>
                              <div className="text-sm text-muted-foreground">{level.description}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">
                                {level.testConfiguration.questionCount} questions
                              </Badge>
                              <Badge variant="outline">
                                {level.testConfiguration.timeLimit}min
                              </Badge>
                            </div>
                            {score && (
                              <div className="text-sm mt-1">
                                Meilleur score: <span className="font-medium">{score}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {levelStatus === 'available' && (
                          <div className="mt-3">
                            <Button size="sm">
                              Commencer le Test
                              <Play className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        )}
                        
                        {levelStatus === 'locked' && level.prerequisites.length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Prérequis: {level.prerequisites.join(', ')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}