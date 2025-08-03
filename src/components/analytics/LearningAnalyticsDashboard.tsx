"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  Clock,
  Trophy,
  Target,
  Brain,
  Flame,
  BookOpen,
  Award,
  Calendar,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User, Skill } from '@/lib/types';
import type { LearningAnalytics, UserLearningProfile } from '@/lib/personalization';
import { getUserLearningAnalytics, personalizationEngine } from '@/lib/personalization';

interface LearningAnalyticsDashboardProps {
  user: User;
  skills: Skill[];
  className?: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

export function LearningAnalyticsDashboard({ 
  user, 
  skills, 
  className 
}: LearningAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<LearningAnalytics | null>(null);
  const [profile, setProfile] = useState<UserLearningProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [user.id, skills.length]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Mock quiz sessions - in real app, this would come from database
      const mockQuizSessions = Array.from({ length: 10 }, (_, i) => ({
        skillId: skills[i % skills.length]?.id || 'skill-1',
        currentLevel: Math.floor(Math.random() * 3) + 1,
        questionsAnswered: Math.floor(Math.random() * 10) + 5,
        correctAnswers: Math.floor(Math.random() * 8) + 3,
        streak: Math.floor(Math.random() * 5) + 1,
        totalPoints: Math.floor(Math.random() * 100) + 50,
        startTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      }));

      const analyticsData = getUserLearningAnalytics(user, skills, mockQuizSessions);
      const profileData = personalizationEngine.generateUserProfile(user, skills, mockQuizSessions);
      
      setAnalytics(analyticsData);
      setProfile(profileData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics || !profile) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>Learning Analytics</CardTitle>
          <CardDescription>Loading your learning insights...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const categoryData = Object.entries(analytics.categoryProgress).map(([category, data]) => ({
    category: category.replace(/([A-Z])/g, ' $1').trim(),
    completed: data.completed,
    total: data.total,
    percentage: Math.round((data.completed / data.total) * 100),
  }));

  const difficultyData = Object.entries(analytics.difficultyPreference).map(([difficulty, count]) => ({
    name: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
    value: count,
    percentage: Math.round((count / analytics.totalSkillsCompleted) * 100),
  }));

  const weeklyData = analytics.weeklyActivity;

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Skills Completed</p>
                <p className="text-2xl font-bold text-yellow-600">{analytics.totalSkillsCompleted}</p>
                <p className="text-xs text-muted-foreground">{analytics.completionRate.toFixed(1)}% completion rate</p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold text-green-600">{analytics.averageQuizScore}%</p>
                <p className="text-xs text-muted-foreground">Last 10 quizzes</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Time Invested</p>
                <p className="text-2xl font-bold text-blue-600">{Math.round(analytics.totalTimeSpent / 60)}h</p>
                <p className="text-xs text-muted-foreground">{analytics.totalTimeSpent} minutes total</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold text-orange-600">{profile.streakDays} days</p>
                <p className="text-xs text-muted-foreground">Record: {analytics.streakRecord} days</p>
              </div>
              <Flame className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Progress by Category</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="category" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="completed" fill="#8884d8" name="Completed" />
                    <Bar dataKey="total" fill="#e0e0e0" name="Total" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Weekly Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Weekly Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="skillsCompleted"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      name="Skills Completed"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="timeSpent"
                      stroke="#82ca9d"
                      name="Time Spent (min)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Difficulty Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Difficulty Preference</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={difficultyData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {difficultyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Learning Velocity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Learning Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Learning Velocity</span>
                    <span className="text-sm text-muted-foreground">
                      {profile.learningVelocity.toFixed(1)} skills/week
                    </span>
                  </div>
                  <Progress value={(profile.learningVelocity / 10) * 100} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Session Duration</span>
                    <span className="text-sm text-muted-foreground">
                      {profile.sessionDuration} minutes
                    </span>
                  </div>
                  <Progress value={(profile.sessionDuration / 120) * 100} className="h-2" />
                </div>

                <div className="pt-4 space-y-2">
                  <h4 className="text-sm font-medium">Strong Subjects</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.strongSubjects.map((subject) => (
                      <Badge key={subject} variant="secondary" className="text-xs">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Areas for Growth</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.challengingSubjects.map((subject) => (
                      <Badge key={subject} variant="outline" className="text-xs">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Learning Style</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {profile.learningStyle.charAt(0).toUpperCase() + profile.learningStyle.slice(1)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Your preferred learning approach
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Preferred Difficulty</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {profile.preferredDifficulty.charAt(0).toUpperCase() + profile.preferredDifficulty.slice(1)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Your comfort zone level
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Best Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {profile.timeOfDay.charAt(0).toUpperCase() + profile.timeOfDay.slice(1)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Your peak learning time
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>AI-Generated Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <h4 className="font-medium text-blue-900 mb-2">Strength Pattern</h4>
                <p className="text-sm text-blue-800">
                  You excel in {profile.strongSubjects.join(' and ')} with a {analytics.averageQuizScore}% average score. 
                  Your {profile.learningStyle} learning style is well-suited for these topics.
                </p>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-400">
                <h4 className="font-medium text-amber-900 mb-2">Growth Opportunity</h4>
                <p className="text-sm text-amber-800">
                  Consider spending more time on {profile.challengingSubjects[0]} to round out your skill set. 
                  Your current {profile.learningVelocity.toFixed(1)} skills per week pace is excellent for gradual improvement.
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                <h4 className="font-medium text-green-900 mb-2">Learning Recommendation</h4>
                <p className="text-sm text-green-800">
                  Your {profile.streakDays}-day streak shows great consistency! 
                  Try tackling {profile.preferredDifficulty} level skills during your preferred {profile.timeOfDay} learning sessions.
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                <h4 className="font-medium text-purple-900 mb-2">Achievement Forecast</h4>
                <p className="text-sm text-purple-800">
                  At your current pace, you're on track to complete {Math.round(profile.learningVelocity * 4)} more skills this month. 
                  Consider setting a goal to reach {analytics.totalSkillsCompleted + 5} total skills by month-end!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default LearningAnalyticsDashboard;