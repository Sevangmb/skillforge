"use client";

import { useAuth } from "@/contexts/AuthContext";
import Dashboard from "@/components/dashboard/Dashboard";
import { getSkillTree, getUsers } from "@/data/mock-data";
import AuthModal from "@/components/auth/AuthModal";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Mock data for now - in real app, this would come from Firestore
  const skills = getSkillTree();
  const users = getUsers();

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Loading SkillForge AI...</span>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline text-primary">
              Welcome to SkillForge AI
            </CardTitle>
            <CardDescription>
              The Civilization of learning with generative AI. Sign in to start your learning journey.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setShowAuthModal(true)} 
              className="w-full"
              size="lg"
            >
              Get Started
            </Button>
          </CardContent>
        </Card>
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Dashboard skills={skills} users={[user, ...users]} currentUser={user} />
    </main>
  );
}
