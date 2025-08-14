"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Clock, Trophy, Target, Plus, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { generateQuizPathAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import type { QuizPath } from '@/lib/types';
import { hybridQuizService } from '@/lib/hybrid-quiz-service';
import { productionDataService } from '@/lib/production-data-service';
import { useAppStore } from '@/stores/useAppStore';

interface QuizPathOverviewProps {
  className?: string;
}

export function QuizPathOverview({ className }: QuizPathOverviewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activePaths, setActivePaths] = useState<QuizPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPath, setGeneratingPath] = useState(false);
  const { setSelectedSkill } = useAppStore();

  const loadActivePaths = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const paths = await hybridQuizService.getActivePaths(3);
      setActivePaths(paths);
    } catch (error) {
      console.error('Failed to load active paths:', error);
      toast({
        title: "Mode Démonstration",
        description: "Utilisation de données de démonstration (Firebase non configuré)",
        className: "bg-blue-500 text-white"
      });
      // Charger quand même les données mockées
      const paths = await hybridQuizService.getActivePaths(3);
      setActivePaths(paths);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      loadActivePaths();
    }
  }, [user, loadActivePaths]);

  const handleGenerateNewPath = async () => {
    if (!user) return;

    try {
      setGeneratingPath(true);
      
      const userSkills = Object.keys(user.competences);
      const difficulty = determineDifficulty(user);
      
      const newPath = await generateQuizPathAction({
        userId: user.id,
        difficulty,
        userSkills
      });

      setActivePaths(prev => [newPath, ...prev]);
      
      toast({
        title: "Nouveau parcours créé !",
        description: `${newPath.title} est maintenant disponible`,
        className: "bg-green-500 text-white"
      });

    } catch (error) {
      console.error('Failed to generate new path:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer un nouveau parcours",
        variant: "destructive"
      });
    } finally {
      setGeneratingPath(false);
    }
  };

  const determineDifficulty = (user: any): 'beginner' | 'intermediate' | 'advanced' => {
    const level = user.profile?.level || 1;
    if (level <= 3) return 'beginner';
    if (level <= 7) return 'intermediate';
    return 'advanced';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Débutant';
      case 'intermediate': return 'Intermédiaire';
      case 'advanced': return 'Avancé';
      default: return difficulty;
    }
  };

  const handleContinuePath = async (path: QuizPath) => {
    try {
      // Get the current step based on progress
      const currentStepIndex = path.currentStep - 1;
      const currentPathStep = path.steps?.[currentStepIndex];
      
      if (!currentPathStep) {
        console.error('No current step found for path:', path.id);
        toast({
          title: "Erreur",
          description: "Impossible de trouver l'étape actuelle du parcours",
          variant: "destructive"
        });
        return;
      }

      // Extract the skill ID from the step
      const skillId = currentPathStep.skillId;
      
      // Get all skills from production data service
      const allSkills = await productionDataService.getSkills();
      const skill = allSkills.find(s => s.id === skillId);
      
      if (!skill) {
        console.error('Skill not found:', skillId);
        toast({
          title: "Erreur", 
          description: "Compétence introuvable",
          variant: "destructive"
        });
        return;
      }

      // Set the selected skill to open the quiz modal
      setSelectedSkill(skill);
      
      toast({
        title: "Quiz lancé !",
        description: `Démarrage du test pour ${skill.name}`,
        className: "bg-green-500 text-white"
      });

    } catch (error) {
      console.error('Error launching quiz from path:', error);
      toast({
        title: "Erreur",
        description: "Impossible de lancer le quiz",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Parcours d'Apprentissage
          </CardTitle>
          <CardDescription>Chargement...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Parcours d'Apprentissage
            </CardTitle>
            <CardDescription>
              Parcours adaptatifs générés par l'IA
            </CardDescription>
          </div>
          <Button 
            onClick={handleGenerateNewPath}
            disabled={generatingPath}
            variant="outline"
            size="sm"
          >
            {generatingPath ? (
              <>Génération...</>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Nouveau
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {activePaths.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Aucun parcours actif</h3>
            <p className="text-muted-foreground mb-4">
              L'IA créera automatiquement des parcours personnalisés basés sur vos compétences
            </p>
            <Button onClick={handleGenerateNewPath} disabled={generatingPath}>
              {generatingPath ? "Création en cours..." : "Créer mon premier parcours"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {activePaths.map((path) => {
              const progress = (path.currentStep / path.totalSteps) * 100;
              
              return (
                <Card key={path.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{path.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {path.description}
                        </p>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className={getDifficultyColor(path.difficulty)}>
                            {getDifficultyLabel(path.difficulty)}
                          </Badge>
                          <Badge variant="outline">{path.category}</Badge>
                          {path.createdByAI && (
                            <Badge variant="secondary">IA</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progression</span>
                        <span className="font-medium">
                          {path.currentStep || 1}/{path.totalSteps || 0} étapes
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            ~{path.estimatedDuration || 0} min
                          </div>
                          <div className="flex items-center gap-1">
                            <Trophy className="h-4 w-4" />
                            {path.pointsToEarn || 0} points
                          </div>
                        </div>
                        
                        <Button 
                          size="sm" 
                          className="ml-4"
                          onClick={() => handleContinuePath(path)}
                        >
                          Continuer
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default QuizPathOverview;