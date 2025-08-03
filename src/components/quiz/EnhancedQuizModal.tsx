"use client";

import { useEffect, useState, useCallback } from "react";
import type { Skill, User, QuizQuestion } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { generateQuizQuestionAction, generateExplanationAction } from "@/app/actions";
import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserProgress } from "@/lib/client-progress";
import { 
  calculateDifficulty, 
  calculatePoints, 
  generateHints, 
  getQuestionFeedback,
  validateQuizWithAI,
  generateAdaptiveAIQuestion,
  calculateAIEnhancedPoints,
  type QuizConfig,
  type QuizSession,
  type QuizValidationResult
} from "@/lib/quiz-system";
import { generateSpecializedQuizzesAction } from "@/app/actions";
import { 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  Sparkles, 
  Trophy, 
  Clock, 
  Target,
  Zap,
  Lightbulb,
  ArrowRight,
  Play,
  Pause,
  BarChart3
} from "lucide-react";

interface EnhancedQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  skill: Skill | null;
  user: User;
}

export default function EnhancedQuizModal({ isOpen, onClose, skill, user }: EnhancedQuizModalProps) {
  // Hooks
  const { t, currentLanguage } = useLanguage();
  const { user: authUser, refreshUser } = useAuth();
  const { addToast } = useToast();
  
  // State
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [hints, setHints] = useState<string[]>([]);
  const [quizConfig, setQuizConfig] = useState<QuizConfig | null>(null);
  const [session, setSession] = useState<QuizSession | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showStats, setShowStats] = useState(false);
  
  // AI Validation State
  const [aiMode, setAiMode] = useState(true); // Mode IA activé par défaut
  const [validationResult, setValidationResult] = useState<QuizValidationResult | null>(null);
  const [validationLoading, setValidationLoading] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  
  // Quiz Progress State
  const [quizProgress, setQuizProgress] = useState({ current: 0, max: 10 });
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  
  // Ajout de la fonction pour passer à la question suivante
  const handleNextQuestion = () => {
    // Vérifier si le quiz est terminé
    if (isQuizComplete) {
      onClose();
      return;
    }
    
    setIsAnswered(false);
    setSelectedAnswer(null);
    setAiExplanation(null);
    setExplanationLoading(false);
    setShowHints(false);
    setHints([]);
    setError(null);
    setTimeLeft(quizConfig?.timeLimit || 30);
    setValidationResult(null);
    setShowValidation(false);
    fetchQuestion();
  };
  
  // Fonction pour terminer le quiz
  const handleQuizComplete = () => {
    setIsQuizComplete(true);
    addToast({
      title: "🎉 Quiz terminé !",
      description: `Vous avez répondu à ${session?.questionsAnswered || 0} questions. Excellent travail !`,
      variant: "success"
    });
  };

  // Initialize quiz session
  useEffect(() => {
    if (isOpen && skill && user) {
      const skillLevel = user.competences[skill.id]?.level || 0;
      const config = calculateDifficulty(user.profile.level, skillLevel, aiMode);
      setQuizConfig(config);
      setTimeLeft(config.timeLimit);
      
      const newSession: QuizSession = {
        skillId: skill.id,
        currentLevel: skillLevel,
        questionsAnswered: 0,
        correctAnswers: 0,
        streak: 0,
        totalPoints: 0,
        startTime: new Date(),
        sessionId: `session-${Date.now()}`,
        responseTimes: [],
        difficultyProgression: [skillLevel]
      };
      setSession(newSession);
    }
  }, [isOpen, skill, user, aiMode]);

  const fetchQuestion = useCallback(async () => {
    if (!skill || !user || !quizConfig || !session) return;

    setLoading(true);
    setError(null);
    setQuestion(null);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setTimeLeft(quizConfig.timeLimit);
    setAiExplanation(null);
    setShowHints(false);
    setHints([]);

    try {
      let result: QuizQuestion | null = null;
      
      if (quizConfig.adaptiveMode && aiMode) {
        // Utiliser la génération IA adaptative
        result = await generateAdaptiveAIQuestion(user, skill, session, quizConfig);
      } else {
        // Génération standard
        try {
          result = await generateQuizQuestionAction({
            competenceId: skill.id,
            userId: user.id,
            userLevel: user.competences[skill.id]?.level || 0,
            learningStyle: user.preferences.learningStyle,
            language: currentLanguage
          });
        } catch (err) {
          // Si l'IA échoue et que nous sommes dans un quiz de connaissance générale
          // vérifier si c'est parce que le quiz est terminé
          if (skill.id === 'general-knowledge') {
            console.log("AI failed, checking if quiz should end...");
            
            // Importer et utiliser le système de progression des questions
            const { getQuizProgress } = await import('@/data/fallback-questions');
            const progress = getQuizProgress(session?.sessionId || `${user.id}-${Date.now()}`);
            
            setQuizProgress(progress);
            
            if (progress.current >= progress.max) {
              handleQuizComplete();
              return;
            }
          }
          throw err; // Re-throw si ce n'est pas un problème de fin de quiz
        }
      }
      
      if (!result) {
        // Quiz terminé - pas plus de questions disponibles
        handleQuizComplete();
        return;
      }
      
      setQuestion(result);
      
      // Mettre à jour la progression
      if (skill.id === 'general-knowledge') {
        const { getQuizProgress } = await import('@/data/fallback-questions');
        const progress = getQuizProgress(session?.sessionId || `${user.id}-${Date.now()}`);
        setQuizProgress(progress);
      }
      
      // Generate hints
      const skillLevel = user.competences[skill.id]?.level || 0;
      const questionHints = generateHints(result, skillLevel);
      setHints(questionHints);
    } catch (err) {
      setError("Failed to generate a question. Please try again.");
      addToast({
        title: "Error",
        description: "Could not fetch a new question.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [skill, user, quizConfig, session, addToast, currentLanguage, aiMode]);

  useEffect(() => {
    if (isOpen && quizConfig) {
      fetchQuestion();
    }
  }, [isOpen, fetchQuestion, quizConfig]);

  useEffect(() => {
    if (!isOpen || loading || isAnswered || !question || isPaused) return;

    if (timeLeft === 0) {
      setIsAnswered(true);
      addToast({
        title: "Time's up!",
        description: "Let's see the correct answer.",
        variant: "destructive"
      });
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, loading, isAnswered, timeLeft, question, addToast, isPaused]);

  const handleAnswer = async (optionIndex: number) => {
    if (isAnswered || !session || !quizConfig) return;
    
    const responseTime = (quizConfig.timeLimit - timeLeft) * 1000; // en millisecondes
    setSelectedAnswer(optionIndex);
    setIsAnswered(true);

    const isCorrect = optionIndex === question?.correctAnswer;
    
    // Calcul de points avec IA si disponible
    let pointsEarned;
    if (aiMode && quizConfig.aiValidation) {
      // Calcul AI avec bonus de difficulté et consistance
      const difficultyScore = (question as any)?.difficultyScore || 50;
      const consistencyBonus = session.streak > 3 ? 0.8 : 0.5;
      pointsEarned = calculateAIEnhancedPoints(
        isCorrect,
        timeLeft,
        quizConfig.timeLimit,
        session.streak,
        quizConfig.difficulty,
        difficultyScore,
        consistencyBonus
      );
    } else {
      pointsEarned = calculatePoints(
        isCorrect,
        timeLeft,
        quizConfig.timeLimit,
        session.streak,
        quizConfig.difficulty
      );
    }

    // Update session avec nouvelles métriques
    const newSession: QuizSession = {
      ...session,
      questionsAnswered: session.questionsAnswered + 1,
      correctAnswers: session.correctAnswers + (isCorrect ? 1 : 0),
      streak: isCorrect ? session.streak + 1 : 0,
      totalPoints: session.totalPoints + pointsEarned,
      responseTimes: [...(session.responseTimes || []), responseTime],
      difficultyProgression: [...(session.difficultyProgression || []), session.currentLevel]
    };
    setSession(newSession);

    if (isCorrect) {
      setSaving(true);
      try {
        await updateUserProgress({
          skillId: skill!.id,
          pointsEarned: pointsEarned,
        });

        await refreshUser();

        const feedback = getQuestionFeedback(isCorrect, timeLeft, quizConfig.timeLimit, newSession.streak);
        addToast({
          title: feedback.title,
          description: `${feedback.description} +${pointsEarned} XP`,
          variant: feedback.variant
        });
      } catch (e) {
        console.error("Error saving progress:", e);
        addToast({
          title: "Error",
          description: "Could not save your progress. Please try again.",
          variant: "destructive"
        });
      } finally {
        setSaving(false);
      }
    } else {
      const feedback = getQuestionFeedback(isCorrect, timeLeft, quizConfig.timeLimit, newSession.streak);
      addToast({
        title: feedback.title,
        description: feedback.description,
        variant: feedback.variant
      });

      // Generate AI explanation for incorrect answer
      setExplanationLoading(true);
      try {
        const result = await generateExplanationAction({
          topic: skill!.name,
          question: question!.question,
          answer: question!.options[optionIndex],
          correctAnswer: question!.options[question!.correctAnswer],
        });
        setAiExplanation(result.explanation);
      } catch (e) {
        console.error("Error generating explanation:", e);
        setAiExplanation("Sorry, I couldn't generate an explanation right now.");
      } finally {
        setExplanationLoading(false);
      }
    }

    // Validation IA après plusieurs questions
    if (aiMode && newSession.questionsAnswered >= 5 && skill) {
      setValidationLoading(true);
      try {
        const validation = await validateQuizWithAI(user, skill, newSession);
        setValidationResult(validation);
        
        if (validation.isValidated) {
          addToast({
            title: "🎉 Validation IA réussie !",
            description: `${validation.masteryLevel} - Score: ${validation.validationScore}%`,
            variant: "success"
          });
          
          // Déclencher la génération de quiz spécialisés si score élevé
          if (validation.validationScore >= 80) {
            try {
              console.log("Triggering specialized quiz generation...");
              const specializationResult = await generateSpecializedQuizzesAction({
                userId: user.id,
                completedSkillId: skill.id,
                validationScore: validation.validationScore
              });
              
              if (specializationResult.success) {
                addToast({
                  title: "🌟 Nouvelles Spécialisations Débloquées !",
                  description: "3 nouveaux quiz spécialisés ont été créés pour approfondir vos connaissances",
                  variant: "success"
                });
              }
            } catch (error) {
              console.error("Failed to generate specialized quizzes:", error);
            }
          }
        } else {
          addToast({
            title: "📊 Analyse IA",
            description: validation.feedback,
            variant: "default"
          });
        }
        
        setShowValidation(true);
      } catch (error) {
        console.error("AI validation failed:", error);
      } finally {
        setValidationLoading(false);
      }
    }
  };

  const getOptionClass = (index: number) => {
    if (!isAnswered) {
      return "border-primary/50 hover:bg-primary/20 transition-all duration-200 hover:scale-105";
    }
    if (index === question?.correctAnswer) {
      return "bg-green-500/30 border-green-500 animate-pulse";
    }
    if (index === selectedAnswer) {
      return "bg-red-500/30 border-red-500";
    }
    return "border-primary/30 opacity-60";
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] bg-secondary border-primary/50">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="font-headline text-2xl text-primary">{skill?.name}</DialogTitle>
              <DialogDescription>Answer the question to increase your competence.</DialogDescription>
            </div>
            <div className="flex items-center space-x-2">
              {/* AI Mode Toggle */}
              <Button
                variant={aiMode ? "default" : "outline"}
                size="sm"
                onClick={() => setAiMode(!aiMode)}
                className="text-xs"
              >
                {aiMode ? "🤖 IA" : "📝 Standard"}
              </Button>
              
              {quizConfig && (
                <Badge className={cn("text-xs", getDifficultyColor(quizConfig.difficulty))}>
                  {quizConfig.difficulty.toUpperCase()}
                  {aiMode && <span className="ml-1">🤖</span>}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Stats Bar */}
          {session && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">{session.totalPoints} XP</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Target className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">{session.correctAnswers}/{session.questionsAnswered}</span>
                </div>
                {session.streak > 0 && (
                  <div className="flex items-center space-x-1">
                    <Zap className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Streak: {session.streak}</span>
                  </div>
                )}
                {/* Quiz Progress pour general-knowledge */}
                {skill?.id === 'general-knowledge' && (
                  <div className="flex items-center space-x-1">
                    <BarChart3 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">
                      {quizProgress.current}/{quizProgress.max}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {isQuizComplete && (
                  <Badge variant="secondary" className="text-xs">
                    ✅ Terminé
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPaused(!isPaused)}
                  className="flex items-center space-x-1"
                  disabled={isQuizComplete}
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  <span className="text-xs">{isPaused ? 'Resume' : 'Pause'}</span>
                </Button>
              </div>
            </div>
          )}

          {/* Quiz Progress Bar pour general-knowledge */}
          {skill?.id === 'general-knowledge' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Progression du Quiz</span>
                <span className="text-sm text-muted-foreground">
                  {quizProgress.current} / {quizProgress.max} questions
                </span>
              </div>
              <Progress 
                value={(quizProgress.current / quizProgress.max) * 100} 
                className="h-2"
              />
              {isQuizComplete && (
                <p className="text-sm text-green-600 font-medium">
                  Quiz de connaissance générale terminé ! Vous pouvez maintenant choisir vos spécialisations.
                </p>
              )}
            </div>
          )}

          {/* Timer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Time Remaining</span>
              </div>
              <span className={cn(
                "text-sm font-bold",
                timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-foreground"
              )}>
                {timeLeft}s
              </span>
            </div>
            <Progress 
              value={(timeLeft / (quizConfig?.timeLimit || 30)) * 100} 
              className="h-2"
            />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-destructive/50 bg-destructive/10">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <p className="text-destructive">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Question */}
          {question && (
            <div className="space-y-4">
              <div className="p-4 bg-background/50 rounded-lg">
                <p className="text-lg font-medium mb-4">{question.question}</p>
                
                {/* Hints */}
                {hints.length > 0 && (
                  <div className="mb-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHints(!showHints)}
                      className="flex items-center space-x-1"
                    >
                      <Lightbulb className="h-4 w-4" />
                      <span>Show Hints ({hints.length})</span>
                    </Button>
                    {showHints && (
                      <div className="mt-2 space-y-1">
                        {hints.map((hint, index) => (
                          <p key={index} className="text-sm text-muted-foreground">{hint}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Options */}
                <div className="space-y-2">
                  {question.options.map((option, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className={cn(
                        "w-full justify-start h-auto py-3 text-left whitespace-normal",
                        getOptionClass(index)
                      )}
                      onClick={() => handleAnswer(index)}
                      disabled={isAnswered || saving}
                    >
                      <span className="mr-2 font-medium">{String.fromCharCode(65 + index)}.</span>
                      {option}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Answer Feedback */}
              {isAnswered && (
                <Card className={cn(
                  "border-2",
                  selectedAnswer === question.correctAnswer 
                    ? "border-green-500/50 bg-green-50/50" 
                    : "border-red-500/50 bg-red-50/50"
                )}>
                  <CardContent className="p-4">
                    {selectedAnswer === question.correctAnswer ? (
                      <div className="flex items-start gap-3 text-green-600">
                        <CheckCircle className="h-5 w-5 mt-1"/>
                        <div>
                          <h4 className="font-bold">Correct!</h4>
                          <p className="text-sm text-foreground/80">{question.explanation}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 text-red-600">
                          <AlertCircle className="h-5 w-5 mt-1"/>
                          <div>
                            <h4 className="font-bold">Incorrect</h4>
                            <p className="text-sm text-foreground/80">
                              The correct answer was: <strong>{question.options[question.correctAnswer]}</strong>
                            </p>
                          </div>
                        </div>
                        
                        {/* AI Explanation */}
                        {explanationLoading && (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin"/>
                            <span className="text-sm">Generating explanation...</span>
                          </div>
                        )}
                        {aiExplanation && (
                          <div className="flex items-start gap-2 p-3 bg-blue-50/50 rounded-md">
                            <Sparkles className="h-4 w-4 text-blue-500 flex-shrink-0 mt-1"/>
                            <p className="text-sm">{aiExplanation}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* AI Validation Display */}
              {showValidation && validationResult && (
                <Card className={cn(
                  "border-2",
                  validationResult.isValidated 
                    ? "border-blue-500/50 bg-blue-50/50" 
                    : "border-purple-500/50 bg-purple-50/50"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-full",
                        validationResult.isValidated ? "bg-blue-100" : "bg-purple-100"
                      )}>
                        <Sparkles className={cn(
                          "h-5 w-5",
                          validationResult.isValidated ? "text-blue-600" : "text-purple-600"
                        )} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm mb-2">
                          🤖 Analyse IA - {validationResult.masteryLevel.toUpperCase()}
                        </h4>
                        <p className="text-sm text-foreground/80 mb-3">
                          {validationResult.feedback}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="bg-white/50 p-2 rounded">
                            <span className="text-muted-foreground">Score Validation:</span>
                            <div className="font-bold text-lg">
                              {validationResult.validationScore}%
                            </div>
                          </div>
                          <div className="bg-white/50 p-2 rounded">
                            <span className="text-muted-foreground">Niveau suivant:</span>
                            <div className="font-bold text-lg">
                              {validationResult.nextRecommendations.difficulty}
                            </div>
                          </div>
                        </div>

                        {validationResult.nextRecommendations.focusAreas.length > 0 && (
                          <div className="mt-3">
                            <span className="text-xs text-muted-foreground">Axes d'amélioration:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {validationResult.nextRecommendations.focusAreas.map(area => (
                                <Badge key={area} variant="outline" className="text-xs">
                                  {area}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* AI Validation Loading */}
              {validationLoading && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      <div>
                        <h4 className="font-medium text-blue-900">🤖 Analyse IA en cours...</h4>
                        <p className="text-sm text-blue-700">
                          Validation de vos performances et génération de recommandations
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              {aiMode && (
                <Badge variant="secondary" className="text-xs">
                  🤖 Mode IA Activé
                </Badge>
              )}
              {validationResult && (
                <Badge 
                  variant={validationResult.isValidated ? "default" : "outline"} 
                  className="text-xs"
                >
                  {validationResult.isValidated ? "✅ Validé" : "📊 Analysé"}
                </Badge>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose} disabled={saving || validationLoading}>
                Close
              </Button>
              <Button onClick={handleNextQuestion} disabled={loading || saving || validationLoading}>
                {(saving || explanationLoading || validationLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isQuizComplete ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Terminer
                  </>
                ) : isAnswered ? (
                  <>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Question Suivante
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Passer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 