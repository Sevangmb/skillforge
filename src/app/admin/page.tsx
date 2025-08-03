
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ShieldCheck, Users, BrainCircuit, Settings } from "lucide-react";
import Header from "@/components/Header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const { firebaseUser, user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("users");

  // Determine admin status reliably
  const isAdmin = user?.profile.isAdmin || firebaseUser?.email === 'sevans@hotmail.fr';

  useEffect(() => {
    // Redirect if not loading and not an admin
    if (!loading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, loading, router]);

  if (loading || !isAdmin) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Vérification de l'accès...</p>
        </div>
      </main>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-headline">Panneau d'Administration</h1>
            </div>
            <p className="text-muted-foreground">
              Gérez les utilisateurs, les compétences et le contenu de l'application.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Utilisateurs</span>
              </TabsTrigger>
              <TabsTrigger value="skills" className="flex items-center gap-2">
                <BrainCircuit className="h-4 w-4" />
                <span>Compétences</span>
              </TabsTrigger>
              <TabsTrigger value="app-settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Configuration</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>Gestion des utilisateurs</CardTitle>
                  <CardDescription>
                    Affichez et gérez les utilisateurs de la plateforme.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">La fonctionnalité de gestion des utilisateurs sera bientôt disponible.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="skills">
              <Card>
                <CardHeader>
                  <CardTitle>Gestion de l'arbre de compétences</CardTitle>
                  <CardDescription>
                    Modifiez, ajoutez ou supprimez des compétences.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                   <p className="text-muted-foreground">La fonctionnalité de gestion des compétences sera bientôt disponible.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="app-settings">
              <Card>
                <CardHeader>
                  <CardTitle>Configuration de l'application</CardTitle>
                  <CardDescription>
                    Ajustez les paramètres globaux de SkillForge AI.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                   <p className="text-muted-foreground">La fonctionnalité de configuration sera bientôt disponible.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </SidebarProvider>
  );
}
