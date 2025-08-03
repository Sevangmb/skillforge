"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";
import { 
  Sparkles, 
  Trophy, 
  Clock, 
  Target, 
  BookOpen,
  ArrowRight,
  Star,
  Zap,
  GraduationCap,
  BrainCircuit,
  Rocket
} from "lucide-react";
import type { SpecializedQuiz, QuizProgression } from "@/lib/specialized-quiz-system";

interface SpecializationUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  progression: QuizProgression | null;
  onSelectQuiz: (quizId: string) => void;
}

const difficultyConfig = {
  intermediate: {
    color: "bg-blue-100 text-blue-800 border-blue-300",
    icon: BookOpen,
    label: "Intermédiaire"
  },
  advanced: {
    color: "bg-purple-100 text-purple-800 border-purple-300", 
    icon: GraduationCap,
    label: "Avancé"
  },
  expert: {
    color: "bg-red-100 text-red-800 border-red-300",
    icon: BrainCircuit,
    label: "Expert"
  }
};

const depthConfig = {
  foundational: { label: "Fondamental", color: "text-green-600" },
  applied: { label: "Appliqué", color: "text-blue-600" },
  mastery: { label: "Maîtrise", color: "text-purple-600" }
};

export default function SpecializationUnlockModal({
  isOpen,
  onClose,
  progression,
  onSelectQuiz
}: SpecializationUnlockModalProps) {
  const { addToast } = useToast();
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(true);

  useEffect(() => {
    if (isOpen && progression) {
      setShowCelebration(true);
      // Cache automatiquement la célébration après 3 secondes
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, progression]);

  if (!progression) return null;

  const handleSelectQuiz = (quiz: SpecializedQuiz) => {
    setSelectedQuiz(quiz.id);
    addToast({
      title: "🎯 Spécialisation Sélectionnée",
      description: `Vous avez choisi : ${quiz.name}`,
      variant: "success"
    });
    onSelectQuiz(quiz.id);
    onClose();
  };

  const renderQuizCard = (quiz: SpecializedQuiz, index: number) => {
    const difficultyConf = difficultyConfig[quiz.difficulty];
    const DifficultyIcon = difficultyConf.icon;
    const depthConf = depthConfig[quiz.specialization.depth as keyof typeof depthConfig] || depthConfig.foundational;

    return (
      <Card 
        key={quiz.id}
        className={cn(
          "cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2",
          selectedQuiz === quiz.id ? "border-primary shadow-lg" : "border-gray-200",
          "animate-in slide-in-from-bottom-4"
        )}
        style={{ animationDelay: `${index * 200}ms` }}
        onClick={() => handleSelectQuiz(quiz)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl" role="img" aria-label={quiz.name}>
                {quiz.icon}
              </span>
              <div className="flex items-center space-x-2">
                <Badge className={cn("text-xs", difficultyConf.color)}>
                  <DifficultyIcon className="h-3 w-3 mr-1" />
                  {difficultyConf.label}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {quiz.category}
                </Badge>
              </div>
            </div>
            {quiz.isNew && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white animate-pulse">
                <Sparkles className="h-3 w-3 mr-1" />
                Nouveau
              </Badge>
            )}
          </div>
          
          <CardTitle className="text-lg font-bold">{quiz.name}</CardTitle>
          <CardDescription className="text-sm">
            {quiz.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Specialization Details */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <BrainCircuit className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Spécialisation</span>
            </div>
            <p className="text-sm text-gray-700 mb-2">
              <span className="font-medium">Domaine:</span> {quiz.specialization.domain}
            </p>
            <p className="text-sm">
              <span className="font-medium">Profondeur:</span>{" "}
              <span className={depthConf.color}>{depthConf.label}</span>
            </p>
          </div>

          {/* Practical Applications */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <Rocket className="h-4 w-4 mr-1 text-green-600" />
              Applications Pratiques
            </h4>
            <div className="space-y-1">
              {quiz.specialization.practicalApplications.slice(0, 2).map((app, i) => (
                <div key={i} className="text-xs text-gray-600 flex items-center">
                  <ArrowRight className="h-3 w-3 mr-1 text-gray-400" />
                  {app}
                </div>
              ))}
            </div>
          </div>

          {/* Quiz Metrics */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-600">{quiz.estimatedTime} min</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-gray-600">{quiz.cost} points</span>
            </div>
          </div>

          {/* Unlock Message */}
          <div className="bg-yellow-50 border border-yellow-200 p-2 rounded text-xs text-yellow-800">
            💡 {quiz.unlockMessage}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Celebration Header */}
        {showCelebration && (
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-purple-600/20 animate-pulse rounded-lg pointer-events-none" />
        )}
        
        <DialogHeader className="relative">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Trophy className="h-8 w-8 text-yellow-500 animate-bounce" />
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-purple-600 bg-clip-text text-transparent">
              {progression.unlockCelebration.title}
            </DialogTitle>
            <Trophy className="h-8 w-8 text-yellow-500 animate-bounce" />
          </div>
          
          <DialogDescription className="text-center text-lg">
            {progression.unlockCelebration.message}
          </DialogDescription>
          
          <div className="text-center italic text-sm text-gray-600 mt-2">
            "{progression.unlockCelebration.motivationalQuote}"
          </div>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* Progression Rationale */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Votre Chemin de Progression
            </h3>
            <p className="text-blue-800 text-sm">{progression.progressionRationale}</p>
          </div>

          {/* Specialized Quizzes */}
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Zap className="h-6 w-6 mr-2 text-purple-600" />
              3 Nouvelles Spécialisations Débloquées
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {progression.specializedQuizzes.map((quiz, index) => renderQuizCard(quiz, index))}
            </div>
          </div>

          {/* Progress Overview */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border">
            <h4 className="font-semibold mb-3 flex items-center">
              <GraduationCap className="h-5 w-5 mr-2 text-green-600" />
              Progression dans l'Arbre des Compétences
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Nouvelles spécialisations disponibles</span>
                <span className="font-bold">3/3</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Choisissez une spécialisation pour approfondir vos connaissances et débloquer de nouveaux chemins d'apprentissage !
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Explorer Plus Tard
          </Button>
          <div className="text-sm text-gray-500">
            Sélectionnez une spécialisation pour commencer
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}