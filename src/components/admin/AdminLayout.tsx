"use client";

import { useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Users, 
  BarChart3, 
  Settings, 
  FileText, 
  AlertTriangle,
  Eye,
  UserCheck,
  Activity,
  Database
} from 'lucide-react';
import { getRoleInfo } from '@/lib/admin/permissions';
import AdminDashboard from './AdminDashboard';
import UserManagement from './UserManagement';
import ContentModeration from './ContentModeration';
import ModerationNotifications from './ModerationNotifications';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { role, isAdmin, isModerator, isLoading, canAccessAdmin } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 text-primary mx-auto animate-pulse" />
          <h2 className="text-2xl font-semibold">Vérification des permissions...</h2>
          <p className="text-muted-foreground">Chargement de l'interface d'administration</p>
        </div>
      </div>
    );
  }

  if (!canAccessAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-2xl text-red-600">Accès refusé</CardTitle>
            <CardDescription>
              Vous n'avez pas les permissions nécessaires pour accéder à cette zone.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Votre rôle actuel :</p>
                <Badge className={getRoleInfo(role).color}>
                  {getRoleInfo(role).name}
                </Badge>
              </div>
              <Button 
                onClick={() => window.history.back()} 
                variant="outline" 
                className="w-full"
              >
                Retour
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const adminTabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      description: 'Vue d\'ensemble du système'
    },
    {
      id: 'users',
      label: 'Utilisateurs',
      icon: Users,
      description: 'Gestion des utilisateurs'
    },
    {
      id: 'content',
      label: 'Contenu',
      icon: FileText,
      description: 'Modération du contenu'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: Activity,
      description: 'Statistiques détaillées'
    },
    {
      id: 'system',
      label: 'Système',
      icon: Settings,
      description: 'Configuration système',
      adminOnly: true
    },
    {
      id: 'logs',
      label: 'Logs',
      icon: Database,
      description: 'Journaux d\'audit'
    }
  ].filter(tab => !tab.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Administration SkillForge</h1>
                <p className="text-sm text-muted-foreground">
                  Interface de gestion et de modération
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ModerationNotifications 
                onNotificationClick={(itemId) => {
                  if (itemId === 'content-tab') {
                    setActiveTab('content');
                  }
                  // In a real app, you would scroll to the specific item
                }}
              />
              <div className="text-right">
                <p className="text-sm font-medium">Connecté en tant que</p>
                <Badge className={getRoleInfo(role).color}>
                  {getRoleInfo(role).name}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Permission Alert for Moderators */}
        {isModerator && !isAdmin && (
          <Alert className="mb-6">
            <Eye className="h-4 w-4" />
            <AlertDescription>
              Vous accédez à l'interface en tant que <strong>Modérateur</strong>. 
              Certaines fonctionnalités sont réservées aux Administrateurs.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            {adminTabs.map(tab => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center space-x-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {adminTabs.map(tab => (
            <TabsContent key={tab.id} value={tab.id} className="space-y-6">
              <div className="flex items-center space-x-4 mb-6">
                <tab.icon className="h-6 w-6 text-primary" />
                <div>
                  <h2 className="text-2xl font-semibold">{tab.label}</h2>
                  <p className="text-muted-foreground">{tab.description}</p>
                </div>
              </div>
              
              {/* Tab Content will be rendered here */}
              <div className="min-h-96">
                {tab.id === 'dashboard' && <AdminDashboard />}
                
                {tab.id === 'users' && <UserManagement />}

                {tab.id === 'content' && <ContentModeration />}

                {tab.id === 'analytics' && (
                  <div className="text-center py-12">
                    <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Analytics Avancées</h3>
                    <p className="text-muted-foreground">Système d'analytics détaillé en cours de développement...</p>
                  </div>
                )}

                {tab.id === 'system' && isAdmin && (
                  <div className="text-center py-12">
                    <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Configuration Système</h3>
                    <p className="text-muted-foreground">Paramètres système en cours de développement...</p>
                  </div>
                )}

                {tab.id === 'logs' && (
                  <div className="text-center py-12">
                    <Database className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Journaux d'Audit</h3>
                    <p className="text-muted-foreground">Système de logs en cours de développement...</p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}