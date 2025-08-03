"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Brain, 
  Clock, 
  TrendingUp, 
  Target, 
  Sparkles, 
  ChevronRight,
  BookOpen,
  Trophy,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User, Skill } from '@/lib/types';
import type { LearningRecommendation } from '@/lib/personalization';
import { getPersonalizedRecommendations } from '@/lib/personalization';
import { useToast } from '@/hooks/useToast';
// AnimatedCard removed - using regular Card for better compatibility

interface LearningRecommendationsProps {
  user: User;
  skills: Skill[];
  onSkillSelect: (skillId: string) => void;
  className?: string;
}

const priorityConfig = {
  high: {
    icon: Target,
    color: 'text-red-600 bg-red-50 border-red-200',
    badgeVariant: 'destructive' as const,
    label: 'High Priority',
  },
  medium: {
    icon: TrendingUp,
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    badgeVariant: 'secondary' as const,
    label: 'Medium Priority',
  },
  low: {
    icon: Lightbulb,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    badgeVariant: 'outline' as const,
    label: 'Low Priority',
  },
};

const difficultyConfig = {
  beginner: { color: 'text-green-600', label: 'Beginner', dots: 1 },
  intermediate: { color: 'text-yellow-600', label: 'Intermediate', dots: 2 },
  advanced: { color: 'text-red-600', label: 'Advanced', dots: 3 },
};

export function LearningRecommendations({ 
  user, 
  skills, 
  onSkillSelect, 
  className 
}: LearningRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  useEffect(() => {
    loadRecommendations();
  }, [user.id, skills.length]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const recs = await getPersonalizedRecommendations(user, skills);
      setRecommendations(recs);
      
      if (recs.length === 0) {
        success('Learning Path Complete!', 'You\'ve mastered all available skills. New content coming soon!');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load recommendations';
      setError(errorMessage);
      showError('Error', 'Failed to load learning recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleSkillSelect = (skillId: string) => {
    const skill = skills.find(s => s.id === skillId);
    if (skill) {
      onSkillSelect(skillId);
      success('Skill Selected', `Starting your journey with ${skill.name}!`);
    }
  };

  const getSkillById = (skillId: string) => skills.find(s => s.id === skillId);

  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>Personalized Learning Path</CardTitle>
          </div>
          <CardDescription>
            AI-powered recommendations tailored to your learning style
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("w-full border-red-200", className)}>
        <CardHeader>
          <CardTitle className="text-red-600">Recommendations Unavailable</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={loadRecommendations}
            variant="outline"
            className="w-full"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            <CardTitle>Learning Complete!</CardTitle>
          </div>
          <CardDescription>
            Congratulations! You've mastered all available skills.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Trophy className="h-8 w-8 text-yellow-600" />
          </div>
          <p className="text-sm text-muted-foreground">
            New skills and challenges are being added regularly. Check back soon!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>Personalized Learning Path</CardTitle>
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadRecommendations}
            className="text-xs"
          >
            Refresh
          </Button>
        </div>
        <CardDescription>
          AI-powered recommendations based on your progress and learning style
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec, index) => {
          const skill = getSkillById(rec.skillId);
          if (!skill) return null;

          const priorityConf = priorityConfig[rec.priority];
          const difficultyConf = difficultyConfig[rec.estimatedDifficulty];
          const PriorityIcon = priorityConf.icon;

          return (
            <Card
              key={rec.skillId}
              className={cn(
                "p-4 cursor-pointer transition-all duration-200 hover:shadow-md border-l-4",
                priorityConf.color.split(' ')[2] // Extract border color
              )}
              onClick={() => handleSkillSelect(rec.skillId)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl" role="img" aria-label={skill.name}>
                      {skill.icon}
                    </span>
                    <div>
                      <h3 className="font-semibold text-sm">{skill.name}</h3>
                      <p className="text-xs text-muted-foreground">{skill.category}</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {rec.reason}
                  </p>

                  <div className="flex items-center space-x-4 text-xs">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{rec.estimatedTime} min</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <BookOpen className="h-3 w-3 text-muted-foreground" />
                      <span className={difficultyConf.color}>
                        {difficultyConf.label}
                      </span>
                      <div className="flex space-x-0.5">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "w-1 h-1 rounded-full",
                              i < difficultyConf.dots 
                                ? difficultyConf.color.replace('text-', 'bg-')
                                : "bg-gray-200"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant={priorityConf.badgeVariant} className="text-xs">
                        <PriorityIcon className="h-3 w-3 mr-1" />
                        {priorityConf.label}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-muted-foreground">Confidence:</span>
                        <Progress 
                          value={rec.confidence * 100} 
                          className="w-12 h-1"
                        />
                        <span className="text-xs font-medium">
                          {Math.round(rec.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Recommendations update based on your progress and performance
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default LearningRecommendations;