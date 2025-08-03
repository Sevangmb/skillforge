"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck } from "lucide-react";
import Header from "@/components/Header";

export default function AdminPage() {
  const { firebaseUser, user, loading } = useAuth();
  const router = useRouter();

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
    <div className="min-h-screen bg-background">
      <Header />
      <main className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl font-headline">Panneau d'Administration</CardTitle>
            </div>
            <CardDescription>
              Gérez les utilisateurs, les compétences et le contenu de l'application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Bienvenue dans le panneau d'administration, {user?.profile.displayName || firebaseUser?.email}.</p>
            <p className="mt-4 text-muted-foreground">
              D'autres fonctionnalités de gestion seront bientôt disponibles ici.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
