"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  TrendingUp, 
  Target, 
  Clock, 
  Award,
  Brain,
  Zap,
  Calendar,
  BarChart3
} from 'lucide-react';
import type { User, Skill } from '@/lib/types';

interface LearningAnalyticsProps {
  user: User;
  skills: Skill[];
}

interface LearningMetrics {
  totalSkillsCompleted: number;
  totalSkillsAvailable: number;
  currentStreak: number;
  averageCompletionTime: number;
  strongestCategory: string;
  weakestCategory: string;
  learningVelocity: number;
  totalTimeSpent: number;
}

interface CategoryProgress {
  category: string;
  completed: number;
  total: number;
  percentage: number;
}

interface WeeklyProgress {
  week: string;
  skillsCompleted: number;
  timeSpent: number;
  xpGained: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function LearningAnalytics({ user, skills }: LearningAnalyticsProps) {
  // Calculate metrics
  const calculateMetrics = (): LearningMetrics => {
    const completedSkills = skills.filter(skill => user.competences[skill.id]?.completed);
    const categoryStats = skills.reduce((acc, skill) => {
      const isCompleted = user.competences[skill.id]?.completed;
      if (!acc[skill.category]) {
        acc[skill.category] = { completed: 0, total: 0 };
      }
      acc[skill.category].total++;
      if (isCompleted) acc[skill.category].completed++;
      return acc;
    }, {} as Record<string, { completed: number; total: number }>);

    const categoryPercentages = Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      percentage: (stats.completed / stats.total) * 100
    }));

    const strongest = categoryPercentages.reduce((max, curr) => 
      curr.percentage > max.percentage ? curr : max
    );
    const weakest = categoryPercentages.reduce((min, curr) => 
      curr.percentage < min.percentage ? curr : min
    );

    return {
      totalSkillsCompleted: completedSkills.length,
      totalSkillsAvailable: skills.length,
      currentStreak: 7, // Mock data - would be calculated from actual learning sessions
      averageCompletionTime: 25, // Mock data - minutes per skill
      strongestCategory: strongest.category,
      weakestCategory: weakest.category,
      learningVelocity: completedSkills.length / 7, // Skills per week
      totalTimeSpent: completedSkills.length * 25, // Mock calculation
    };
  };

  const getCategoryProgress = (): CategoryProgress[] => {
    const categoryStats = skills.reduce((acc, skill) => {
      const isCompleted = user.competences[skill.id]?.completed;
      if (!acc[skill.category]) {
        acc[skill.category] = { completed: 0, total: 0 };
      }
      acc[skill.category].total++;
      if (isCompleted) acc[skill.category].completed++;
      return acc;
    }, {} as Record<string, { completed: number; total: number }>);

    return Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      completed: stats.completed,
      total: stats.total,
      percentage: (stats.completed / stats.total) * 100
    }));
  };

  const getWeeklyProgress = (): WeeklyProgress[] => {
    // Mock data - in real app, this would come from learning session tracking
    return [
      { week: 'Week 1', skillsCompleted: 3, timeSpent: 120, xpGained: 450 },
      { week: 'Week 2', skillsCompleted: 5, timeSpent: 180, xpGained: 750 },
      { week: 'Week 3', skillsCompleted: 2, timeSpent: 90, xpGained: 300 },
      { week: 'Week 4', skillsCompleted: 4, timeSpent: 150, xpGained: 600 },
    ];
  };

  const getSkillDistribution = () => {
    const categoryProgress = getCategoryProgress();
    return categoryProgress.map((item, index) => ({
      name: item.category,
      value: item.completed,
      color: COLORS[index % COLORS.length]
    }));
  };

  const getLearningRadarData = () => {
    const categoryProgress = getCategoryProgress();
    return categoryProgress.map(item => ({
      category: item.category,
      score: item.percentage
    }));
  };

  const metrics = calculateMetrics();
  const weeklyData = getWeeklyProgress();
  const categoryProgress = getCategoryProgress();
  const skillDistribution = getSkillDistribution();
  const radarData = getLearningRadarData();

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skills Completed</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalSkillsCompleted}</div>
            <p className="text-xs text-muted-foreground">
              of {metrics.totalSkillsAvailable} total
            </p>
            <Progress 
              value={(metrics.totalSkillsCompleted / metrics.totalSkillsAvailable) * 100} 
              className="mt-2 h-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.currentStreak}</div>
            <p className="text-xs text-muted-foreground">
              days in a row
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Velocity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.learningVelocity.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              skills per week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(metrics.totalTimeSpent / 60)}h</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalTimeSpent % 60}m learning time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="progress" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Weekly Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="skillsCompleted" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skill Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={skillDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {skillDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>
                  Your progress across different skill categories
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {categoryProgress.map((category) => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {category.category}
                      </span>
                      <Badge variant="outline">
                        {category.completed}/{category.total}
                      </Badge>
                    </div>
                    <Progress value={category.percentage} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skill Radar</CardTitle>
                <CardDescription>
                  Comprehensive view of your skill distribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Progress"
                      dataKey="score"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Learning Trends</CardTitle>
              <CardDescription>
                Track your learning patterns over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="xpGained" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="XP Gained"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="timeSpent" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="Time Spent (min)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5" />
                  <span>Learning Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Strongest Category</h4>
                  <Badge variant="default" className="capitalize">
                    {metrics.strongestCategory}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Area for Improvement</h4>
                  <Badge variant="outline" className="capitalize">
                    {metrics.weakestCategory}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Average Completion Time</h4>
                  <span className="text-sm text-muted-foreground">
                    {metrics.averageCompletionTime} minutes per skill
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5" />
                  <span>Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p>🎯 <strong>Focus on {metrics.weakestCategory}</strong> to balance your skills</p>
                  <p>⚡ <strong>Maintain your streak</strong> - you're doing great!</p>
                  <p>📈 <strong>Try shorter sessions</strong> to improve retention</p>
                  <p>🏆 <strong>Challenge yourself</strong> with advanced topics in {metrics.strongestCategory}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}