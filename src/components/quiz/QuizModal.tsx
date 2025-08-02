"use client";

import { useEffect, useState, useCallback } from "react";
import type { Skill, User, QuizQuestion } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { generateQuizQuestionAction } from "@/app/actions";
import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle } from "lucide-react";

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  skill: Skill | null;
  user: User;
}

const TIMER_DURATION = 30; // 30 seconds

export default function QuizModal({ isOpen, onClose, skill, user }: QuizModalProps) {
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const { toast } = useToast();

  const fetchQuestion = useCallback(async () => {
    if (!skill || !user) return;

    setLoading(true);
    setError(null);
    setQuestion(null);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setTimeLeft(TIMER_DURATION);

    try {
      const result = await generateQuizQuestionAction({
        competenceId: skill.id,
        userId: user.id,
        userLevel: user.competences[skill.id]?.level || 0,
        learningStyle: user.preferences.learningStyle,
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
  }, [skill, user, toast]);

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


  const handleAnswer = (optionIndex: number) => {
    if (isAnswered) return;
    setSelectedAnswer(optionIndex);
    setIsAnswered(true);

    if (optionIndex === question?.correctAnswer) {
      toast({
        title: "Correct!",
        description: `You've earned points towards ${skill?.name}.`,
        className: "bg-green-500 text-white"
      });
    } else {
       toast({
        title: "Incorrect",
        description: "Don't worry, here's an explanation.",
        variant: "destructive"
      });
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
                    disabled={isAnswered}
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
                      <p className="text-sm text-foreground/80 mt-2">{question.explanation}</p>
                    </div>
                  </div>
               )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={fetchQuestion} disabled={loading}>
            {isAnswered ? "Next Question" : "Skip"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
