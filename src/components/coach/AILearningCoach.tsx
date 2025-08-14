/**
 * AI Learning Coach Component
 * Interface utilisateur pour l'assistant IA d'apprentissage personnalisé
 */

"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Brain,
  Lightbulb,
  Target,
  TrendingUp,
  Clock,
  Flame,
  Star,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  Zap,
  Heart,
  BookOpen,
  Award
} from 'lucide-react';
import { useAICoach } from '@/hooks/useAICoach';
import type { CoachInsight, CoachPriority, CoachInsightType } from '@/lib/ai-learning-coach';
import { cn } from '@/lib/utils';

interface AILearningCoachProps {
  className?: string;
  compact?: boolean;
  showOnlyUrgent?: boolean;
}

const INSIGHT_TYPE_CONFIG: Record<CoachInsightType, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}> = {
  motivation_boost: { icon: Heart, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  performance_tip: { icon: TrendingUp, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  timing_optimization: { icon: Clock, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  skill_focus: { icon: Target, color: 'text-green-600', bgColor: 'bg-green-50' },
  habit_formation: { icon: Star, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  fatigue_detection: { icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-50' },
  achievement_nudge: { icon: Award, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  learning_strategy: { icon: BookOpen, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  social_encouragement: { icon: Heart, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  progress_celebration: { icon: Flame, color: 'text-orange-600', bgColor: 'bg-orange-50' }
};

const PRIORITY_CONFIG: Record<CoachPriority, {
  color: string;
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
}> = {
  urgent: { color: 'text-red-600', label: 'Urgent', variant: 'destructive' },
  high: { color: 'text-orange-600', label: 'Important', variant: 'default' },
  medium: { color: 'text-blue-600', label: 'Modéré', variant: 'secondary' },
  low: { color: 'text-gray-600', label: 'Info', variant: 'outline' }
};

function InsightCard({ 
  insight, 
  onDismiss, 
  onActionExecute, 
  compact = false 
}: {
  insight: CoachInsight;
  onDismiss: (id: string) => void;
  onActionExecute: (insightId: string, actionId: string) => void;
  compact?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const config = INSIGHT_TYPE_CONFIG[insight.type];
  const priorityConfig = PRIORITY_CONFIG[insight.priority];
  const Icon = config.icon;

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      config.bgColor,
      compact ? "border-l-4" : ""
    )}>
      <CardHeader className={cn("pb-3", compact && "py-3")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "p-2 rounded-full",
              config.bgColor,
              "ring-2 ring-white shadow-sm"
            )}>
              <Icon className={cn("h-4 w-4", config.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className={cn(
                "text-sm font-semibold",
                compact ? "line-clamp-1" : ""
              )}>
                {insight.title}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge 
                  variant={priorityConfig.variant}
                  className="text-xs"
                >
                  {priorityConfig.label}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {insight.category}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {!compact && insight.actions && insight.actions.length > 0 && (
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(insight.id)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!compact && (
        <CardContent className="pt-0">
          <CardDescription className="text-sm mb-4">
            {insight.message}
          </CardDescription>

          {insight.actions && insight.actions.length > 0 && (
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleContent>
                <Separator className="mb-3" />
                <div className="flex flex-wrap gap-2">
                  {insight.actions.map((action) => (
                    <Button
                      key={action.id}
                      variant="outline"
                      size="sm"
                      onClick={() => onActionExecute(insight.id, action.id)}
                      className="text-xs"
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function LearningStateOverview({ 
  userLearningState, 
  compact = false 
}: { 
  userLearningState: any; 
  compact?: boolean; 
}) {
  if (!userLearningState) return null;

  const getEnergyColor = (level: string) => {
    switch (level) {
      case 'peak': return 'text-green-600';
      case 'high': return 'text-blue-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getEnergyProgress = (level: string) => {
    switch (level) {
      case 'peak': return 100;
      case 'high': return 80;
      case 'medium': return 60;
      case 'low': return 30;
      default: return 0;
    }
  };

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
      <CardHeader className={cn("pb-3", compact && "py-3")}>
        <CardTitle className="flex items-center space-x-2 text-sm">
          <Brain className="h-4 w-4 text-blue-600" />
          <span>État d'Apprentissage</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Énergie</span>
              <span className={cn("text-xs capitalize", getEnergyColor(userLearningState.energyLevel))}>
                {userLearningState.energyLevel}
              </span>
            </div>
            <Progress 
              value={getEnergyProgress(userLearningState.energyLevel)} 
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Focus</span>
              <span className={cn("text-xs capitalize", getEnergyColor(userLearningState.focusLevel))}>
                {userLearningState.focusLevel}
              </span>
            </div>
            <Progress 
              value={getEnergyProgress(userLearningState.focusLevel)} 
              className="h-2"
            />
          </div>

          {!compact && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Motivation</span>
                  <span className={cn("text-xs capitalize", getEnergyColor(userLearningState.motivationLevel))}>
                    {userLearningState.motivationLevel}
                  </span>
                </div>
                <Progress 
                  value={getEnergyProgress(userLearningState.motivationLevel)} 
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Série</span>
                  <span className="text-xs font-semibold text-orange-600">
                    {userLearningState.currentStreak} jours
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  <span className="text-xs text-gray-600">
                    Continuez comme ça !
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function AILearningCoach({ 
  className, 
  compact = false, 
  showOnlyUrgent = false 
}: AILearningCoachProps) {
  const {
    insights,
    urgentInsights,
    activeInsights,
    userLearningState,
    isAnalyzing,
    isLoadingInsights,
    error,
    coachEnabled,
    dismissInsight,
    executeInsightAction,
    toggleCoach,
    analyzeUserState
  } = useAICoach();

  const displayInsights = useMemo(() => {
    if (showOnlyUrgent) return urgentInsights;
    return compact ? activeInsights.slice(0, 3) : activeInsights;
  }, [showOnlyUrgent, urgentInsights, compact, activeInsights]);

  if (!coachEnabled) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Brain className="h-12 w-12 text-gray-400 mb-4" />
          <CardTitle className="text-lg mb-2">Assistant IA Désactivé</CardTitle>
          <CardDescription className="mb-4">
            Activez votre coach IA pour recevoir des conseils personnalisés
          </CardDescription>
          <Button onClick={() => toggleCoach(true)}>
            <Zap className="h-4 w-4 mr-2" />
            Activer le Coach IA
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erreur lors du chargement du coach IA: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Learning State Overview */}
      {userLearningState && !showOnlyUrgent && (
        <LearningStateOverview 
          userLearningState={userLearningState} 
          compact={compact}
        />
      )}

      {/* Insights Section */}
      {displayInsights.length > 0 ? (
        <div className="space-y-3">
          {!compact && !showOnlyUrgent && (
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Conseils Personnalisés
              </h3>
              <Badge variant="secondary" className="text-xs">
                {activeInsights.length} actifs
              </Badge>
            </div>
          )}

          {displayInsights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onDismiss={dismissInsight}
              onActionExecute={executeInsightAction}
              compact={compact}
            />
          ))}

          {compact && activeInsights.length > 3 && (
            <Card className="bg-gray-50 border-dashed">
              <CardContent className="py-3 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => {/* Navigate to full coach view */}}
                >
                  +{activeInsights.length - 3} autres conseils
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card className={cn("border-dashed bg-gray-50", compact && "py-4")}>
          <CardContent className={cn(
            "text-center",
            compact ? "py-2" : "py-8"
          )}>
            {isAnalyzing || isLoadingInsights ? (
              <>
                <Brain className="h-8 w-8 text-blue-500 animate-pulse mx-auto mb-3" />
                <CardDescription className="text-sm">
                  Analyse de votre apprentissage en cours...
                </CardDescription>
              </>
            ) : (
              <>
                <Lightbulb className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                <CardDescription className="text-sm mb-3">
                  Aucun conseil disponible pour le moment
                </CardDescription>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={analyzeUserState}
                  className="text-xs"
                >
                  <Brain className="h-3 w-3 mr-1" />
                  Analyser maintenant
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AILearningCoach;