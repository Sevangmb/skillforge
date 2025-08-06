"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Dashboard from "@/components/dashboard/Dashboard";
import DailyDashboard from "@/components/daily/DailyDashboard";
import AuthModal from "@/components/auth/AuthModal";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Calendar, TreePine } from "lucide-react";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { t, loadingTranslations } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  // Detect when user just logged in
  useEffect(() => {
    if (user && !authLoading) {
      setIsFirstLogin(true);
      // Remove the flag after animation
      const timer = setTimeout(() => {
        setIsFirstLogin(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, authLoading]);

  const isLoading = authLoading || loadingTranslations;

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="text-lg text-white">{t('common.loading')}</span>
          </div>
          <p className="text-sm text-gray-400">Preparing your SkillForge experience...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-headline text-primary">
                {t('auth.welcomeTitle')}
              </CardTitle>
              <CardDescription>
                {t('auth.welcomeDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setShowAuthModal(true)} 
                className="w-full"
                size="lg"
              >
                {t('auth.getStarted')}
              </Button>
            </CardContent>
          </Card>
          <AuthModal 
            isOpen={showAuthModal} 
            onClose={() => setShowAuthModal(false)} 
          />
        </div>
      </main>
    );
  }

  // Show welcome animation for first login
  if (isFirstLogin) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 animate-in fade-in duration-1000">
          <h1 className="text-4xl font-headline text-primary">Welcome to SkillForge!</h1>
          <p className="text-xl text-muted-foreground">Building your personalized learning experience...</p>
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background animate-in fade-in duration-500">
      <div className="container mx-auto p-6">
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
            <TabsTrigger value="daily" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t('navigation.daily') || 'Quotidien'}
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center gap-2">
              <TreePine className="h-4 w-4" />
              {t('navigation.skills') || 'Compétences'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily" className="mt-0">
            <DailyDashboard />
          </TabsContent>
          
          <TabsContent value="skills" className="mt-0">
            <Dashboard currentUser={user} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
