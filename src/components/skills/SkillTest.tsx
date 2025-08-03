"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Award,
  TrendingUp,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Flag,
  Lightbulb,
  Eye,
  Target
} from 'lucide-react';
import { HTML_BASICS_QUESTIONS, calculateTestScore } from '@/lib/skills/skillData';
import type { SkillQuestion, TestAnswer, SkillLevel } from '@/lib/types/skills';

interface SkillTestProps {
  level: SkillLevel;
  questions: SkillQuestion[];
  onComplete: (score: number, answers: TestAnswer[]) => void;
  onExit: () => void;
}

export default function SkillTest({ level, questions, onComplete, onExit }: SkillTestProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | number | null)[]>(new Array(questions.length).fill(null));
  const [timeRemaining, setTimeRemaining] = useState((level.testConfiguration.timeLimit || 30) * 60); // Convert to seconds
  const [showHint, setShowHint] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [testCompleted, setTestCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [testAnswers, setTestAnswers] = useState<TestAnswer[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Timer countdown
  useEffect(() => {
    if (testCompleted) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Auto-submit when time runs out
          handleSubmitTest(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testCompleted]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (value: string | number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = value;
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    recordQuestionTime();
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowHint(false);
      setQuestionStartTime(Date.now());
    }
  };

  const handlePreviousQuestion = () => {
    recordQuestionTime();
    
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setShowHint(false);
      setQuestionStartTime(Date.now());
    }
  };

  const recordQuestionTime = () => {
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
    // In a real app, you'd store this data
  };

  const handleShowHint = () => {
    setShowHint(true);
    setHintsUsed(prev => prev + 1);
  };

  const handleSubmitTest = (timeExpired = false) => {
    recordQuestionTime();

    // Calculate results
    const testAnswers: TestAnswer[] = questions.map((question, index) => {
      const userAnswer = answers[index];
      let isCorrect = false;

      // Check if answer is correct based on question type
      if (question.type === 'multiple_choice' || question.type === 'true_false') {
        isCorrect = userAnswer === question.correctAnswer;
      } else if (question.type === 'fill_blank' && question.blanks) {
        // Simplified check for fill-in-the-blank
        const answerStr = String(userAnswer).toLowerCase().trim();
        isCorrect = question.blanks.some(blank => 
          blank.toLowerCase().trim() === answerStr
        );
      }

      return {
        questionId: question.id,
        selectedAnswer: userAnswer,
        isCorrect,
        pointsEarned: isCorrect ? question.points : 0,
        timeSpent: 45, // Mock time spent
        hintsUsed: showHint && index === currentQuestionIndex ? 1 : 0,
        attempts: 1,
      };
    });

    const score = calculateTestScore(testAnswers, questions);
    
    setTestAnswers(testAnswers);
    setFinalScore(score);
    setTestCompleted(true);
  };

  const handleRetakeTest = () => {
    setCurrentQuestionIndex(0);
    setAnswers(new Array(questions.length).fill(null));
    setTimeRemaining((level.testConfiguration.timeLimit || 30) * 60);
    setShowHint(false);
    setHintsUsed(0);
    setTestCompleted(false);
    setFinalScore(0);
    setTestAnswers([]);
    setQuestionStartTime(Date.now());
  };

  const handleCompleteTest = () => {
    onComplete(finalScore, testAnswers);
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const currentAnswer = answers[currentQuestionIndex];

    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline">
              Question {currentQuestionIndex + 1} sur {questions.length}
            </Badge>
            <div className="flex items-center space-x-2">
              <Badge className={`${timeRemaining < 300 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                <Clock className="h-3 w-3 mr-1" />
                {formatTime(timeRemaining)}
              </Badge>
              <Badge variant="outline">
                {currentQuestion.points} pts
              </Badge>
            </div>
          </div>

          <h3 className="text-lg font-medium mb-4">{currentQuestion.question}</h3>
        </div>

        {/* Answer Options */}
        {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
          <RadioGroup 
            value={String(currentAnswer || '')} 
            onValueChange={(value) => handleAnswerChange(parseInt(value))}
          >
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value={String(index)} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {currentQuestion.type === 'true_false' && (
          <RadioGroup 
            value={String(currentAnswer || '')} 
            onValueChange={(value) => handleAnswerChange(parseInt(value))}
          >
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="1" id="true" />
              <Label htmlFor="true" className="flex-1 cursor-pointer">Vrai</Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="0" id="false" />
              <Label htmlFor="false" className="flex-1 cursor-pointer">Faux</Label>
            </div>
          </RadioGroup>
        )}

        {currentQuestion.type === 'fill_blank' && (
          <div className="space-y-2">
            <Label>Votre réponse:</Label>
            <Input
              value={String(currentAnswer || '')}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Tapez votre réponse..."
              className="text-lg"
            />
          </div>
        )}

        {/* Hint Section */}
        {currentQuestion.hints && currentQuestion.hints.length > 0 && (
          <div className="space-y-2">
            {!showHint ? (
              <Button variant="outline" size="sm" onClick={handleShowHint}>
                <Lightbulb className="h-4 w-4 mr-1" />
                Indice ({hintsUsed} utilisé{hintsUsed > 1 ? 's' : ''})
              </Button>
            ) : (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Indice</span>
                </div>
                <p className="text-sm text-yellow-700">{currentQuestion.hints[0]}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (testCompleted) {
    const passed = finalScore >= level.testConfiguration.passingScore;
    const correctAnswers = testAnswers.filter(a => a.isCorrect).length;

    return (
      <Dialog open={testCompleted} onOpenChange={() => {}}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {passed ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
              <span>Test {passed ? 'Réussi' : 'Échoué'}</span>
            </DialogTitle>
            <DialogDescription>
              {level.name} - Résultats de votre test
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Score Display */}
            <div className="text-center p-6 border rounded-lg">
              <div className={`text-4xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-red-600'}`}>
                {finalScore}%
              </div>
              <div className="text-lg text-muted-foreground">
                {correctAnswers} sur {questions.length} bonnes réponses
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Seuil de réussite: {level.testConfiguration.passingScore}%
              </div>
            </div>

            {/* Performance Breakdown */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{correctAnswers}</div>
                <div className="text-sm text-muted-foreground">Correctes</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{questions.length - correctAnswers}</div>
                <div className="text-sm text-muted-foreground">Incorrectes</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{hintsUsed}</div>
                <div className="text-sm text-muted-foreground">Indices</div>
              </div>
            </div>

            {/* Rewards */}
            {passed && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Award className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Récompenses obtenues</span>
                </div>
                <div className="space-y-1 text-sm text-green-700">
                  <div>✓ +{level.rewards.points} points d'expérience</div>
                  {level.rewards.unlocksNext && (
                    <div>✓ Niveau suivant débloqué</div>
                  )}
                  {level.rewards.badges && level.rewards.badges.length > 0 && (
                    <div>✓ Badge obtenu: {level.rewards.badges.join(', ')}</div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onExit} className="flex-1">
                Retour au Dashboard
              </Button>
              {!passed && (
                <Button onClick={handleRetakeTest} className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reprendre le Test
                </Button>
              )}
              {passed && (
                <Button onClick={handleCompleteTest} className="flex-1">
                  <Target className="h-4 w-4 mr-1" />
                  Continuer
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{level.name}</h2>
          <p className="text-muted-foreground">{level.description}</p>
        </div>
        <Button variant="outline" onClick={onExit}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Quitter
        </Button>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progression</span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}% complété
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card>
        <CardContent className="pt-6">
          {renderQuestion()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Précédent
        </Button>

        <div className="flex space-x-2">
          {questions.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full ${
                index === currentQuestionIndex
                  ? 'bg-blue-500'
                  : answers[index] !== null
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {currentQuestionIndex === questions.length - 1 ? (
          <Button onClick={() => handleSubmitTest()} disabled={answers.some(a => a === null)}>
            <Flag className="h-4 w-4 mr-1" />
            Terminer le Test
          </Button>
        ) : (
          <Button
            onClick={handleNextQuestion}
            disabled={answers[currentQuestionIndex] === null}
          >
            Suivant
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}