"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, Zap, Clock, TrendingUp, Award } from "lucide-react";
import type { QuizSession } from "@/lib/types";

interface QuizStatsProps {
  session: QuizSession;
  onClose: () => void;
}

export function QuizStats({ session, onClose }: QuizStatsProps) {
  const accuracy = session.questionsAnswered > 0 
    ? (session.correctAnswers / session.questionsAnswered) * 100 
    : 0;
  
  const averagePoints = session.questionsAnswered > 0 
    ? session.totalPoints / session.questionsAnswered 
    : 0;

  const getAccuracyColor = (acc: number) => {
    if (acc >= 80) return "text-green-600";
    if (acc >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getAccuracyBadge = (acc: number) => {
    if (acc >= 90) return { text: "Expert", color: "bg-green-100 text-green-800" };
    if (acc >= 80) return { text: "Advanced", color: "bg-blue-100 text-blue-800" };
    if (acc >= 60) return { text: "Intermediate", color: "bg-yellow-100 text-yellow-800" };
    return { text: "Beginner", color: "bg-red-100 text-red-800" };
  };

  const accuracyBadge = getAccuracyBadge(accuracy);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span>Session Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{session.totalPoints}</div>
              <div className="text-sm text-muted-foreground">Total XP</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{session.correctAnswers}/{session.questionsAnswered}</div>
              <div className="text-sm text-muted-foreground">Correct Answers</div>
            </div>
          </div>

          {/* Accuracy */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Accuracy</span>
              <div className="flex items-center space-x-2">
                <span className={`text-lg font-bold ${getAccuracyColor(accuracy)}`}>
                  {accuracy.toFixed(1)}%
                </span>
                <Badge className={accuracyBadge.color}>
                  {accuracyBadge.text}
                </Badge>
              </div>
            </div>
            <Progress value={accuracy} className="h-2" />
          </div>

          {/* Streak */}
          {session.streak > 0 && (
            <div className="flex items-center justify-between p-3 bg-orange-50/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-orange-500" />
                <span className="font-medium">Best Streak</span>
              </div>
              <span className="text-lg font-bold text-orange-600">{session.streak}</span>
            </div>
          )}

          {/* Average Points */}
          <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <span className="font-medium">Average Points</span>
            </div>
            <span className="text-lg font-bold text-blue-600">{averagePoints.toFixed(1)}</span>
          </div>

          {/* Session Duration */}
          <div className="flex items-center justify-between p-3 bg-purple-50/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-purple-500" />
              <span className="font-medium">Session Duration</span>
            </div>
            <span className="text-lg font-bold text-purple-600">
              {Math.round((Date.now() - session.startTime.getTime()) / 1000 / 60)}m
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Earned */}
      {session.correctAnswers >= 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-yellow-500" />
              <span>Achievements Earned</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {session.correctAnswers >= 10 && (
                <div className="flex items-center space-x-2 p-2 bg-yellow-50/50 rounded-md">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">Quiz Master</span>
                  <Badge variant="secondary" className="text-xs">Rare</Badge>
                </div>
              )}
              {session.streak >= 5 && (
                <div className="flex items-center space-x-2 p-2 bg-orange-50/50 rounded-md">
                  <Zap className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Streak Master</span>
                  <Badge variant="secondary" className="text-xs">Epic</Badge>
                </div>
              )}
              {accuracy >= 90 && (
                <div className="flex items-center space-x-2 p-2 bg-green-50/50 rounded-md">
                  <Target className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Perfect Accuracy</span>
                  <Badge variant="secondary" className="text-xs">Legendary</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 