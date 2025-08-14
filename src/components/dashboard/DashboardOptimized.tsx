"use client";

import type { Skill, User } from "@/lib/types";
import { useState, useCallback, memo, useTransition, startTransition } from "react";
import dynamic from 'next/dynamic';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
} from "@/components/ui/sidebar";
import ProfileCard from "@/components/profile/ProfileCard";
import Header from "@/components/Header";
import QuizModal from "../quiz/QuizModal";
import { Separator } from "../ui/separator";
import { useSkills } from "@/hooks/useSkills";
import { Loader2, Trophy } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAchievements } from "@/hooks/useAchievements";
import { logger } from "@/lib/logger";
import { FeatureErrorBoundary } from "@/components/ErrorBoundary";

// Dynamic imports for heavy components
const SkillTree = dynamic(() => import("@/components/skill-tree/SkillTree"), {
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2">Loading Skill Tree...</span>
    </div>
  ),
  ssr: false
});

const SmartAchievementDisplay = dynamic(() => import("@/components/achievements/SmartAchievementDisplay"), {
  loading: () => (
    <div className="flex items-center justify-center h-32">
      <Loader2 className="h-6 w-6 animate-spin" />
      <span className="ml-2">Loading Achievements...</span>
    </div>
  ),
  ssr: false
});

const AILearningCoach = dynamic(() => import("@/components/coach/AILearningCoach"), {
  loading: () => (
    <div className="flex items-center justify-center h-32">
      <Loader2 className="h-6 w-6 animate-spin" />
      <span className="ml-2">Loading AI Coach...</span>
    </div>
  ),
  ssr: false
});

const Leaderboard = dynamic(() => import("@/components/leaderboard/Leaderboard"), {
  loading: () => (
    <div className="p-4">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>
    </div>
  ),
  ssr: false
});

interface DashboardProps {
  readonly currentUser: User;
}

interface DashboardState {
  selectedSkill: Skill | null;
  activeTab: 'skills' | 'achievements' | 'coach';
}

const MemoizedProfileCard = memo(ProfileCard);
const MemoizedHeader = memo(Header);

function DashboardOptimized({ currentUser }: DashboardProps) {
  const { 
    skills, 
    isLoading: skillsLoading, 
    error: skillsError,
    isSkillCompleted,
    isSkillAvailable,
  } = useSkills();

  const [state, setState] = useState<DashboardState>({
    selectedSkill: null,
    activeTab: 'skills'
  });
  
  const [isPending] = useTransition();
  
  // Memoized achievement data
  const { notifications } = useAchievements();
  const recentlyUnlocked = notifications.filter(n => !n.isRead).slice(0, 3);

  // Optimized state updater
  const updateState = useCallback((updates: Partial<DashboardState>) => {
    startTransition(() => {
      setState(prev => ({ ...prev, ...updates }));
    });
  }, []);

  // Optimized skill availability check
  const getSkillAvailability = useCallback((skill: Skill) => ({
    isAvailable: isSkillAvailable(skill.id),
    isCompleted: isSkillCompleted(skill.id)
  }), [isSkillCompleted, isSkillAvailable]);

  const handleNodeClick = useCallback((skill: Skill) => {
    const { isAvailable, isCompleted } = getSkillAvailability(skill);
    
    logger.info('Skill node clicked', {
      action: 'skill_node_click',
      skillId: skill.id,
      isAvailable,
      isCompleted
    });
    
    if (isAvailable || isCompleted) {
      updateState({ selectedSkill: skill });
    }
  }, [getSkillAvailability, updateState]);

  const handleCloseQuiz = useCallback(() => {
    updateState({ selectedSkill: null });
  }, [updateState]);
  
  const handleTabChange = useCallback((value: string) => {
    updateState({ activeTab: value as 'skills' | 'achievements' | 'coach' });
  }, [updateState]);

  // Error fallback for skills
  if (skillsError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-destructive font-medium">Error loading skills</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Reload Page
        </button>
      </div>
    );
  }
  
  return (
    <FeatureErrorBoundary>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <MemoizedProfileCard user={currentUser} />
          </SidebarHeader>
          <Separator className="my-2" />
          <SidebarContent>
            <Leaderboard />
          </SidebarContent>
          <SidebarFooter>
            <p className="text-xs text-muted-foreground p-2">© 2024 SkillForge AI</p>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <div className="flex flex-col h-screen">
            <MemoizedHeader />
            
            {/* Achievement Notification - Only render if has notifications */}
            {recentlyUnlocked.length > 0 && (
              <div className="p-4 border-b">
                <SmartAchievementDisplay showRecentOnly maxDisplay={3} compact />
              </div>
            )}
            
            <div className="flex-grow relative">
              <Tabs value={state.activeTab} onValueChange={handleTabChange} className="h-full">
                <div className="border-b px-4">
                  <TabsList className="grid w-full grid-cols-3 max-w-lg">
                    <TabsTrigger value="skills" className="flex items-center space-x-2">
                      <span>🌳 Compétences</span>
                      {skillsLoading && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
                    </TabsTrigger>
                    <TabsTrigger value="achievements" className="flex items-center space-x-2">
                      <Trophy className="h-4 w-4" />
                      <span>Achievements</span>
                      {recentlyUnlocked.length > 0 && (
                        <span className="ml-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {recentlyUnlocked.length}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="coach" className="flex items-center space-x-2">
                      <span>🧠 Coach IA</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="skills" className="h-full mt-0">
                  {skillsLoading ? (
                    <div className="absolute inset-0 bg-background flex items-center justify-center">
                      <div className="flex flex-col items-center space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <div className="text-center space-y-2">
                          <p className="text-muted-foreground">Loading skills...</p>
                          <div className="text-xs text-muted-foreground">
                            <div className="inline-flex items-center space-x-2">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                              <span>Optimized loading active</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <SkillTree 
                      skills={skills} 
                      user={currentUser} 
                      onNodeClick={handleNodeClick} 
                    />
                  )}
                </TabsContent>
                
                <TabsContent value="achievements" className="mt-0 p-4 overflow-auto h-full">
                  <div className="max-w-6xl mx-auto">
                    <div className="mb-6">
                      <h1 className="text-2xl font-bold">Smart Achievements</h1>
                      <p className="text-muted-foreground">
                        Intelligent achievements based on your real learning patterns
                      </p>
                    </div>
                    <SmartAchievementDisplay />
                  </div>
                </TabsContent>

                <TabsContent value="coach" className="h-full mt-0">
                  <div className="h-full overflow-y-auto">
                    <div className="p-6 space-y-6">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          Personal AI Coach
                        </h2>
                        <p className="text-gray-600 mb-6">
                          Your intelligent learning assistant analyzes your performance and guides you to success
                        </p>
                      </div>
                      <AILearningCoach className="max-w-4xl mx-auto" />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </SidebarInset>
        <QuizModal
          isOpen={!!state.selectedSkill}
          onClose={handleCloseQuiz}
          skill={state.selectedSkill}
          user={currentUser}
        />
      </SidebarProvider>
    </FeatureErrorBoundary>
  );
}

export default memo(DashboardOptimized);