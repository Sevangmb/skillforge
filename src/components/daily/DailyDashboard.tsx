"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, TrendingUp, Target, BookOpen } from 'lucide-react';
import DailyChallenge from './DailyChallenge';
import QuizPathOverview from './QuizPathOverview';
import FirebaseDebug from '@/components/debug/FirebaseDebug';
import DemoModeIndicator from '@/components/dev/DemoModeIndicator';

interface DailyDashboardProps {
  className?: string;
}

export function DailyDashboard({ className }: DailyDashboardProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête du tableau de bord */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord</h1>
          <p className="text-muted-foreground">
            Votre apprentissage personnalisé vous attend
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>

      {/* Indicateur de mode démonstration */}
      <DemoModeIndicator />

      {/* Debug Firebase - A retirer après résolution */}
      <div className="mb-6">
        <FirebaseDebug />
      </div>

      {/* Grille principale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Défi quotidien - Prend 2 colonnes sur grand écran */}
        <div className="lg:col-span-2">
          <DailyChallenge />
        </div>

        {/* Statistiques rapides */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Série actuelle
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7 jours</div>
              <p className="text-xs text-muted-foreground">
                +2 depuis hier
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Points cette semaine
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">245</div>
              <p className="text-xs text-muted-foreground">
                +12% par rapport à la semaine dernière
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Parcours actifs
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                2 en cours, 1 nouveau
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Onglets pour différentes vues */}
      <Tabs defaultValue="paths" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="paths">Parcours</TabsTrigger>
          <TabsTrigger value="progress">Progression</TabsTrigger>
          <TabsTrigger value="achievements">Réussites</TabsTrigger>
        </TabsList>
        
        <TabsContent value="paths" className="space-y-4">
          <QuizPathOverview />
        </TabsContent>
        
        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Progression Hebdomadaire</CardTitle>
              <CardDescription>
                Votre activité d'apprentissage cette semaine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Graphiques de progression à venir...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Réussites Récentes</CardTitle>
              <CardDescription>
                Vos derniers accomplissements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Système de réussites à venir...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DailyDashboard;