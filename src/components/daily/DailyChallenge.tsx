"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, Trophy, Flame, Star, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getDailyQuizChallengeAction, completeDailyChallengeAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import type { DailyQuizChallenge, QuizStep } from '@/lib/types';
import { hybridQuizService } from '@/lib/hybrid-quiz-service';
import { logger } from '@/lib/logger';

interface DailyChallengeProps {
  className?: string;
}

export function DailyChallenge({ className }: DailyChallengeProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [challenge, setChallenge] = useState<DailyQuizChallenge | null>(null);
  const [currentStep, setCurrentStep] = useState<QuizStep | null>(null);
  const [loading, setLoading] = useState(true);
  const [completingChallenge, setCompletingChallenge] = useState(false);

  const loadDailyChallenge = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const dailyChallenge = await getDailyQuizChallengeAction(user.id);
      setChallenge(dailyChallenge);

      if (dailyChallenge) {
        await loadStepDetails(dailyChallenge.stepId);
      }
    } catch (error) {
      console.error('Failed to load daily challenge:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le défi du jour",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      loadDailyChallenge();
    }
  }, [user, loadDailyChallenge]);

  const loadStepDetails = async (stepId: string) => {
    try {
      if (!stepId) {
        logger.warn('No stepId provided for daily challenge', {
          action: 'daily_challenge_no_step_id'
        });
        return;
      }

      logger.info('Loading step details for daily challenge', {
        action: 'daily_challenge_load_step',
        stepId
      });

      const step = await hybridQuizService.getStepDetails(stepId);
      if (step) {
        setCurrentStep(step);
        logger.info('Step details loaded successfully for daily challenge', {
          action: 'daily_challenge_step_loaded',
          stepId: step.id,
          skillId: step.skillId
        });
      } else {
        logger.warn('No step details found for daily challenge', {
          action: 'daily_challenge_step_not_found',
          stepId
        });
      }
    } catch (error) {
      logger.error('Failed to load step details for daily challenge', {
        action: 'daily_challenge_step_error',
        stepId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  const handleStartChallenge = () => {
    if (challenge && currentStep) {
      // Logique pour démarrer le quiz
      // Pour l'instant, on simule une completion
      simulateQuizCompletion();
    }
  };

  const simulateQuizCompletion = async () => {
    if (!challenge) return;

    try {
      setCompletingChallenge(true);
      
      // Simulation d'un score aléatoire
      const score = Math.floor(Math.random() * 30) + 70; // Score entre 70 et 100
      
      await completeDailyChallengeAction(challenge.id, score);
      
      // Mettre à jour l'état local
      setChallenge({
        ...challenge,
        isCompleted: true,
        completedAt: new Date(),
        score
      });

      toast({
        title: "Défi terminé !",
        description: `Félicitations ! Score: ${score}%`,
        className: "bg-green-500 text-white"
      });

    } catch (error) {
      console.error('Failed to complete challenge:', error);
      toast({
        title: "Erreur",
        description: "Impossible de terminer le défi",
        variant: "destructive"
      });
    } finally {
      setCompletingChallenge(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 7) return 'text-orange-500';
    if (streak >= 3) return 'text-yellow-500';
    return 'text-blue-500';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Défi du Jour
              </CardTitle>
              <CardDescription>Chargement...</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!challenge) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Défi du Jour
          </CardTitle>
          <CardDescription>Aucun défi disponible</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Le système génère automatiquement de nouveaux défis. Revenez plus tard !
          </p>
        </CardContent>
      </Card>
    );
  }

  const today = formatDate(challenge.date);
  const isCompleted = challenge.isCompleted;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Défi du Jour
            </CardTitle>
            <CardDescription>{today}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {challenge.streakCount > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Flame className={`h-4 w-4 ${getStreakColor(challenge.streakCount)}`} />
                {challenge.streakCount} jour{challenge.streakCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {currentStep && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{currentStep.title}</h3>
              <Badge variant={currentStep.type === 'quiz' ? 'default' : currentStep.type === 'challenge' ? 'destructive' : 'secondary'}>
                {currentStep.type === 'quiz' ? 'Quiz' : currentStep.type === 'challenge' ? 'Défi' : 'Leçon'}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                ~5 min
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                {currentStep.pointsReward} points
              </div>
              {currentStep.questions && (
                <div>
                  {currentStep.questions.length} question{currentStep.questions.length > 1 ? 's' : ''}
                </div>
              )}
            </div>

            {isCompleted ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700 font-medium">
                  <Trophy className="h-5 w-5" />
                  Défi terminé !
                </div>
                <div className="mt-2 text-sm text-green-600">
                  Score: {challenge.score}% • +{challenge.bonusPointsEarned} points bonus
                </div>
                <Progress value={challenge.score || 0} className="mt-3 h-2" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  {currentStep.content ? 
                    "Lisez la leçon et répondez aux questions" : 
                    "Répondez correctement pour gagner des points"
                  }
                </div>
                
                <Button 
                  onClick={handleStartChallenge}
                  disabled={completingChallenge}
                  className="w-full"
                  size="lg"
                >
                  {completingChallenge ? (
                    "Completion en cours..."
                  ) : (
                    <>
                      Commencer le défi
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {!currentStep && (
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              Préparation du défi en cours...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DailyChallenge;