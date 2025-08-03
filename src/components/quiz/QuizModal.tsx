"use client";

import { useEffect, useState, useCallback } from "react";
import type { Skill, User, QuizQuestion } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { generateQuizQuestionAction, updateUserProgressAction, generateExplanationAction } from "@/app/actions";
import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, CheckCircle, Loader2, Sparkles } from "lucide-react";
import { updateUserProgress } from "@/lib/client-progress";

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  skill: Skill | null;
  user: User;
}

const TIMER_DURATION = 30; // 30 seconds
const POINTS_PER_CORRECT_ANSWER = 10;

export default function QuizModal({ isOpen, onClose, skill, user }: QuizModalProps) {
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);

  const { toast } = useToast();
  const { currentLanguage } = useLanguage();
  const { refreshUser } = useAuth();

  const fetchQuestion = useCallback(async () => {
    if (!skill || !user) return;

    setLoading(true);
    setError(null);
    setQuestion(null);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setTimeLeft(TIMER_DURATION);
    setAiExplanation(null);

    try {
      const result = await generateQuizQuestionAction({
        competenceId: skill.id,
        userId: user.id,
        userLevel: user.competences[skill.id]?.level || 0,
        learningStyle: user.preferences.learningStyle,
        language: currentLanguage,
      });
      setQuestion(result);
    } catch (err) {
      setError("Failed to generate a question. Please try again.");
      toast({
        title: "Error",
        description: "Could not fetch a new question.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [skill, user, toast, currentLanguage]);

  useEffect(() => {
    if (isOpen) {
      fetchQuestion();
    }
  }, [isOpen, fetchQuestion]);

  useEffect(() => {
    if (!isOpen || loading || isAnswered || !question) return;

    if (timeLeft === 0) {
      setIsAnswered(true);
      toast({
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
  }, [isOpen, loading, isAnswered, timeLeft, question, toast]);


  const handleAnswer = async (optionIndex: number) => {
    if (isAnswered) return;
    setSelectedAnswer(optionIndex);
    setIsAnswered(true);

    if (optionIndex === question?.correctAnswer) {
      setSaving(true);
      try {
        console.log("Saving progress for user:", user.id, "skill:", skill?.id);
        
        await updateUserProgress({
          skillId: skill!.id,
          pointsEarned: POINTS_PER_CORRECT_ANSWER,
        });

        await refreshUser(); // Refresh user data in the app

        toast({
          title: "Correct!",
          description: `You've earned ${POINTS_PER_CORRECT_ANSWER} points towards ${skill?.name}.`,
          className: "bg-green-500 text-white"
        });
      } catch (e) {
        console.error("Error saving progress:", e);
        toast({
          title: "Error",
          description: "Could not save your progress. Please try again.",
          variant: "destructive"
        });
      } finally {
        setSaving(false);
      }
    } else {
       toast({
        title: "Incorrect",
        description: "Generating a personalized explanation...",
        variant: "destructive"
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
  };

  const getOptionClass = (index: number) => {
    if (!isAnswered) {
      return "border-primary/50 hover:bg-primary/20";
    }
    if (index === question?.correctAnswer) {
      return "bg-green-500/30 border-green-500";
    }
    if (index === selectedAnswer) {
      return "bg-red-500/30 border-red-500";
    }
    return "border-primary/30 opacity-60";
  };


  // Offline Quiz Fallback Component
  const OfflineQuizFallback = () => (
    <div className="p-4 text-center">
      <h3 className="text-lg font-semibold mb-2">Quiz Temporarily Unavailable</h3>
      <p className="text-muted-foreground mb-4">
        We're having trouble loading the quiz. You can try again or continue exploring other skills.
      </p>
      <div className="space-y-2">
        <Button onClick={() => window.location.reload()} className="w-full">
          Try Again
        </Button>
        <Button variant="outline" onClick={onClose} className="w-full">
          Close
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-secondary border-primary/50">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl text-primary">{skill?.name}</DialogTitle>
          <DialogDescription>Answer the question to increase your competence.</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Progress value={(timeLeft / TIMER_DURATION) * 100} className="w-full h-2 mb-4" />
          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}
          {error && <p className="text-destructive">{error}</p>}
          {question && (
            <div>
              <p className="text-lg mb-4">{question.question}</p>
              <div className="space-y-2">
                {question.options.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className={cn("w-full justify-start h-auto py-2 text-left whitespace-normal", getOptionClass(index))}
                    onClick={() => handleAnswer(index)}
                    disabled={isAnswered || saving}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {isAnswered && question && (
             <div className="mt-4 p-4 rounded-md bg-background/50">
               {selectedAnswer === question.correctAnswer ? (
                  <div className="flex items-start gap-3 text-green-400">
                    <CheckCircle className="h-5 w-5 mt-1"/>
                    <div>
                      <h4 className="font-bold">Correct!</h4>
                      <p className="text-sm text-foreground/80">{question.explanation}</p>
                    </div>
                  </div>
               ) : (
                  <div className="flex items-start gap-3 text-red-400">
                    <AlertCircle className="h-5 w-5 mt-1"/>
                    <div>
                      <h4 className="font-bold">Incorrect</h4>
                       <p className="text-sm text-foreground/80">The correct answer was: <strong>{question.options[question.correctAnswer]}</strong></p>
                       <div className="mt-2 text-sm text-foreground/80">
                         {explanationLoading && (
                           <div className="flex items-center gap-2">
                             <Loader2 className="h-4 w-4 animate-spin"/>
                             <span>Generating explanation...</span>
                           </div>
                         )}
                         {aiExplanation && (
                           <div className="flex items-start gap-2">
                             <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-1"/>
                             <p>{aiExplanation}</p>
                           </div>
                         )}
                       </div>
                    </div>
                  </div>
               )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Close</Button>
          <Button onClick={fetchQuestion} disabled={loading || saving}>
            {(saving || explanationLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isAnswered ? "Next Question" : "Skip"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
