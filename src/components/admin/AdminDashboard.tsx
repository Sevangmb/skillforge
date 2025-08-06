"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  BookOpen, 
  Trophy, 
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Zap
} from 'lucide-react';
import type { SystemMetrics } from '@/lib/types/admin';

// Mock data - in real app, this would come from analytics API
const MOCK_METRICS: SystemMetrics = {
  totalUsers: 2847,
  activeUsers: 1923,
  totalSkills: 156,
  completedQuizzes: 12847,
  averageSessionTime: 23.5, // minutes
  signupsToday: 12,
  signupsThisWeek: 89,
  signupsThisMonth: 347,
  topSkillCategories: [
    { category: 'Frontend Development', completions: 1247, percentage: 32.1 },
    { category: 'Backend Development', completions: 983, percentage: 25.3 },
    { category: 'Data Science', completions: 756, percentage: 19.5 },
    { category: 'DevOps', completions: 542, percentage: 14.0 },
    { category: 'Mobile Development', completions: 356, percentage: 9.1 }
  ]
};

export default function AdminDashboard() {
  const metrics = MOCK_METRICS;

  const getActivityLevel = (activeUsers: number, totalUsers: number): {
    level: string;
    color: string;
    percentage: number;
  } => {
    const percentage = (activeUsers / totalUsers) * 100;
    
    if (percentage >= 70) {
      return { level: 'Excellent', color: 'text-green-600', percentage };
    } else if (percentage >= 50) {
      return { level: 'Bon', color: 'text-blue-600', percentage };
    } else if (percentage >= 30) {
      return { level: 'Moyen', color: 'text-yellow-600', percentage };
    } else {
      return { level: 'Faible', color: 'text-red-600', percentage };
    }
  };

  const activityLevel = getActivityLevel(metrics.activeUsers, metrics.totalUsers);

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers.toLocaleString()}</div>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="outline" className={activityLevel.color}>
                {metrics.activeUsers.toLocaleString()} actifs
              </Badge>
              <span className="text-xs text-muted-foreground">
                ({activityLevel.percentage.toFixed(1)}%)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compétences</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalSkills}</div>
            <p className="text-xs text-muted-foreground">
              disponibles sur la plateforme
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quiz Complétés</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completedQuizzes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {(metrics.completedQuizzes / metrics.totalUsers).toFixed(1)} par utilisateur
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Session Moyenne</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageSessionTime} min</div>
            <div className="flex items-center space-x-1 mt-2">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-600">+12% cette semaine</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Inscriptions Aujourd'hui</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{metrics.signupsToday}</div>
            <p className="text-xs text-muted-foreground mt-1">nouveaux utilisateurs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Cette Semaine</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{metrics.signupsThisWeek}</div>
            <p className="text-xs text-muted-foreground mt-1">inscriptions hebdomadaires</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Ce Mois</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{metrics.signupsThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">croissance mensuelle</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>Catégories les Plus Populaires</span>
          </CardTitle>
          <CardDescription>
            Répartition des compétences complétées par catégorie
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {metrics.topSkillCategories.map((category, index) => (
            <div key={category.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                    {index + 1}
                  </Badge>
                  <span className="font-medium">{category.category}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{category.completions.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{category.percentage}%</div>
                </div>
              </div>
              <Progress value={category.percentage} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>État du Système</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">API Backend</span>
              <Badge className="bg-green-100 text-green-800">Opérationnel</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Base de Données</span>
              <Badge className="bg-green-100 text-green-800">Opérationnel</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Firebase Auth</span>
              <Badge className="bg-green-100 text-green-800">Opérationnel</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">CDN</span>
              <Badge className="bg-green-100 text-green-800">Opérationnel</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span>Alertes Récentes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p className="text-sm">Aucune alerte système</p>
              <p className="text-xs">Tous les services fonctionnent normalement</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}