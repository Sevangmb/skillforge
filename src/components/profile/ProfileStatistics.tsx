"use client";

import { useState, useMemo } from 'react';
import { User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Clock,
  Calendar,
  Zap,
  Trophy,
  Brain,
  Activity,
  PieChart
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell
} from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ProfileStatisticsProps {
  user: User;
}

// Mock data for statistics - in real app, this would come from analytics
const mockProgressData = (() => {
  const endDate = new Date();
  const startDate = subDays(endDate, 30);
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  return days.map((date, index) => ({
    date: format(date, 'dd/MM'),
    points: Math.floor(Math.random() * 200) + 50,
    questionsAnswered: Math.floor(Math.random() * 20) + 5,
    timeSpent: Math.floor(Math.random() * 120) + 30, // minutes
    streak: index > 15 ? Math.max(0, index - 15) : 0
  }));
})();

const mockCategoryData = [
  { name: 'Mathématiques', completed: 8, total: 12, color: '#3B82F6' },
  { name: 'Sciences', completed: 6, total: 10, color: '#10B981' },
  { name: 'Langues', completed: 4, total: 8, color: '#F59E0B' },
  { name: 'Histoire', completed: 3, total: 6, color: '#EF4444' },
  { name: 'Arts', completed: 2, total: 4, color: '#8B5CF6' }
];

const mockTimeData = [
  { period: 'Lun', minutes: 45 },
  { period: 'Mar', minutes: 62 },
  { period: 'Mer', minutes: 38 },
  { period: 'Jeu', minutes: 71 },
  { period: 'Ven', minutes: 55 },
  { period: 'Sam', minutes: 89 },
  { period: 'Dim', minutes: 34 }
];

const mockQuizStats = {
  totalQuestions: 1247,
  correctAnswers: 1089,
  averageTime: 12.5, // seconds per question
  streak: 7,
  bestStreak: 23,
  topCategories: ['Mathématiques', 'Sciences', 'Langues']
};

export default function ProfileStatistics({ user }: ProfileStatisticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  const stats = useMemo(() => {
    const totalCompleted = Object.values(user.competences).filter(c => c.completed).length;
    const totalSkills = Object.keys(user.competences).length;
    const averageScore = Object.values(user.competences)
      .filter(c => c.averageScore !== undefined)
      .reduce((acc, c, _, arr) => acc + (c.averageScore! / arr.length), 0);
    
    const totalAttempts = Object.values(user.competences)
      .reduce((acc, c) => acc + (c.attempts || 0), 0);

    return {
      completionRate: totalSkills > 0 ? (totalCompleted / totalSkills) * 100 : 0,
      averageScore: Math.round(averageScore),
      totalAttempts,
      currentStreak: mockQuizStats.streak,
      bestStreak: mockQuizStats.bestStreak
    };
  }, [user]);

  const totalTimeThisWeek = mockTimeData.reduce((acc, day) => acc + day.minutes, 0);
  const avgTimePerDay = totalTimeThisWeek / 7;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taux de réussite</p>
                <p className="text-2xl font-bold">{stats.averageScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Trophy className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Complétion</p>
                <p className="text-2xl font-bold">{Math.round(stats.completionRate)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Zap className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Série actuelle</p>
                <p className="text-2xl font-bold">{stats.currentStreak}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Temps/jour</p>
                <p className="text-2xl font-bold">{Math.round(avgTimePerDay)}min</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Progression
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Catégories
          </TabsTrigger>
          <TabsTrigger value="time" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Temps d'étude
          </TabsTrigger>
          <TabsTrigger value="quiz" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Quiz
          </TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Progression des points (30 derniers jours)</CardTitle>
              <CardDescription>
                Évolution de vos points au fil du temps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockProgressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="points" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Record de série</CardTitle>
                <CardDescription>
                  Votre meilleure série de jours consécutifs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-orange-500 mb-2">
                    {stats.bestStreak}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    jours consécutifs
                  </p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm">Série actuelle</p>
                  <p className="text-2xl font-semibold">{stats.currentStreak} jours</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activité récente</CardTitle>
                <CardDescription>
                  Vos dernières sessions d'apprentissage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockProgressData.slice(-5).reverse().map((day, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{day.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {day.points} pts
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {day.timeSpent}min
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Progression par catégorie</CardTitle>
              <CardDescription>
                Votre avancement dans chaque domaine de compétences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockCategoryData.map((category, index) => {
                  const percentage = (category.completed / category.total) * 100;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{category.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {category.completed}/{category.total}
                        </span>
                      </div>
                      <Progress 
                        value={percentage} 
                        className="h-2"
                        style={{ 
                          '--progress-foreground': category.color 
                        } as React.CSSProperties}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{Math.round(percentage)}% complété</span>
                        <span>{category.total - category.completed} restantes</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Temps d'étude hebdomadaire</CardTitle>
              <CardDescription>
                Répartition de vos sessions d'apprentissage par jour
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockTimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="period" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => [`${value} min`, 'Temps d\'étude']}
                    />
                    <Bar dataKey="minutes" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{totalTimeThisWeek}</p>
                <p className="text-sm text-muted-foreground">Minutes cette semaine</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{Math.round(avgTimePerDay)}</p>
                <p className="text-sm text-muted-foreground">Minutes par jour</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  {mockTimeData.filter(d => d.minutes > 30).length}
                </p>
                <p className="text-sm text-muted-foreground">Jours > 30min</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quiz" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Brain className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{mockQuizStats.totalQuestions}</p>
                <p className="text-sm text-muted-foreground">Questions répondues</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Trophy className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  {Math.round((mockQuizStats.correctAnswers / mockQuizStats.totalQuestions) * 100)}%
                </p>
                <p className="text-sm text-muted-foreground">Taux de réussite</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{mockQuizStats.averageTime}s</p>
                <p className="text-sm text-muted-foreground">Temps moyen</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Zap className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.totalAttempts}</p>
                <p className="text-sm text-muted-foreground">Tentatives totales</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance des quiz</CardTitle>
              <CardDescription>
                Détails sur vos résultats aux quiz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Répartition des réponses</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Réponses correctes</span>
                      <span className="text-sm font-medium text-green-600">
                        {mockQuizStats.correctAnswers}
                      </span>
                    </div>
                    <Progress 
                      value={(mockQuizStats.correctAnswers / mockQuizStats.totalQuestions) * 100} 
                      className="h-2"
                    />
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Réponses incorrectes: {mockQuizStats.totalQuestions - mockQuizStats.correctAnswers}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Catégories favorites</h4>
                  <div className="space-y-2">
                    {mockQuizStats.topCategories.map((category, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-sm w-4 h-4 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-sm">{category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}