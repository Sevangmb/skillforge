
"use client";

import type { Skill, User } from "@/lib/types";
import { useState, useEffect, useCallback, useMemo, memo, useRef, useTransition } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
} from "@/components/ui/sidebar";
import ProfileCard from "@/components/profile/ProfileCard";
import Leaderboard from "@/components/leaderboard/Leaderboard";
import Header from "@/components/Header";
import SkillTree from "@/components/skill-tree/SkillTree";
import QuizModal from "../quiz/QuizModal";
import { Separator } from "../ui/separator";
import { useSkills } from "@/hooks/useSkills";
import { subscribeToLeaderboard } from "@/lib/firestore";
import { Loader2, Trophy, RefreshCw } from "lucide-react";
import SmartAchievementDisplay from "@/components/achievements/SmartAchievementDisplay";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAchievements } from "@/hooks/useAchievements";
import { logger } from "@/lib/logger";
import { FeatureErrorBoundary } from "@/components/ErrorBoundary";

interface DashboardProps {
  readonly currentUser: User;
}

interface DashboardState {
  selectedSkill: Skill | null;
  leaderboardUsers: User[];
  activeTab: 'skills' | 'achievements';
}

function Dashboard({ currentUser }: DashboardProps) {
  // Use the new skills hook for better performance and caching
  const { 
    skills, 
    userProgress,
    isLoading: skillsLoading, 
    error: skillsError,
    refreshData,
    isSkillCompleted,
    isSkillAvailable,
    getSkillCompletionPercentage
  } = useSkills();

  // Simplified local state
  const [state, setState] = useState<DashboardState>({
    selectedSkill: null,
    leaderboardUsers: [],
    activeTab: 'skills'
  });
  
  const isMountedRef = useRef(true);
  // Use achievements hook for recent unlocks
  const { notifications, unreadNotifications } = useAchievements();
  const recentlyUnlocked = notifications.filter(n => !n.isRead).slice(0, 3);
  const [isPending, startTransition] = useTransition();
  
  // Optimized state setters with transitions for non-urgent updates
  const updateState = useCallback((updates: Partial<DashboardState>) => {
    if (!isMountedRef.current) return;
    setState(prev => ({ ...prev, ...updates }));
  }, []);
  
  const updateStateWithTransition = useCallback((updates: Partial<DashboardState>) => {
    if (!isMountedRef.current) return;
    startTransition(() => {
      setState(prev => ({ ...prev, ...updates }));
    });
  }, []);

  useEffect(() => {
    // Skills are now loaded by the useSkills hook automatically
    // Just log when skills are available
    if (skills.length > 0) {
      logger.info('Skills loaded via useSkills hook', {
        skillsCount: skills.length,
        completionPercentage: getSkillCompletionPercentage()
      } as any);
    }

    const unsubscribe = subscribeToLeaderboard((users) => {
      if (isMountedRef.current) {
        // Use transition for leaderboard updates (non-urgent)
        updateStateWithTransition({ leaderboardUsers: users });
      }
    });

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, [skills.length, userProgress.size, getSkillCompletionPercentage, updateStateWithTransition]);

  // Simplified skill availability check using the hook functions
  const getSkillAvailability = useCallback((skill: Skill) => {
    const isCompleted = isSkillCompleted(skill.id);
    const isAvailable = isSkillAvailable(skill.id);
    
    return { isAvailable, isCompleted };
  }, [isSkillCompleted, isSkillAvailable]);

  const handleNodeClick = useCallback((skill: Skill) => {
    const { isAvailable, isCompleted } = getSkillAvailability(skill);
    
    logger.info('Skill node clicked', {
      action: 'skill_node_click',
      skillId: skill.id,
      skillName: skill.name,
      isAvailable,
      isCompleted,
      userLevel: currentUser.competences[skill.id]?.level || 0
    });
    
    if (isAvailable && !isCompleted) {
      updateState({ selectedSkill: skill });
      logger.info('Opening quiz modal', {
        action: 'quiz_modal_open',
        skillId: skill.id,
        skillName: skill.name
      });
    } else if (isCompleted) {
      // For completed skills, allow reviewing/retaking
      updateState({ selectedSkill: skill });
      logger.info('Retaking completed skill', {
        action: 'skill_retake',
        skillId: skill.id
      });
    } else {
      logger.debug('Skill not available - prerequisites not met', {
        action: 'skill_node_blocked',
        skillId: skill.id,
        prereqs: [...skill.prereqs],
        completedSkills: Object.keys(currentUser.competences).filter(id => currentUser.competences[id].completed)
      });
    }
  }, [getSkillAvailability, updateState, currentUser]);

  const handleCloseQuiz = useCallback(() => {
    updateState({ selectedSkill: null });
  }, [updateState]);
  
  const handleTabChange = useCallback((value: string) => {
    updateState({ activeTab: value as 'skills' | 'achievements' });
  }, [updateState]);

  // Fonction de retry utilisant le hook useSkills
  const retryLoadSkills = useCallback(async () => {
    try {
      logger.info('Retrying skills load via useSkills hook', {
        action: 'dashboard_skills_retry'
      });

      await refreshData();

      logger.info('Skills retry successful via hook', {
        action: 'dashboard_skills_retry_success',
        skillsCount: skills.length
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Skills retry failed via hook', {
        action: 'dashboard_skills_retry_error',
        error: errorMessage
      });
    }
  }, [refreshData, skills.length]);

  // Error fallback component avec retry intelligent
  const SkillsErrorFallback = useCallback(() => (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <p className="text-destructive font-medium">Erreur de chargement des compétences</p>
      <p className="text-muted-foreground text-sm">{skillsError}</p>
      <div className="flex space-x-2">
        <button 
          onClick={retryLoadSkills}
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Réessayer
        </button>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
        >
          Recharger la page
        </button>
      </div>
    </div>
  ), [skillsError, retryLoadSkills]);
  
  return (
    <FeatureErrorBoundary>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <ProfileCard user={currentUser} />
          </SidebarHeader>
          <Separator className="my-2" />
          <SidebarContent>
            <Leaderboard users={state.leaderboardUsers} />
          </SidebarContent>
          <SidebarFooter>
            <p className="text-xs text-muted-foreground p-2">© 2024 SkillForge AI</p>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <div className="flex flex-col h-screen">
            <Header />
            
            {/* Achievement Notification */}
            {recentlyUnlocked.length > 0 && (
              <div className="p-4 border-b">
                <SmartAchievementDisplay showRecentOnly maxDisplay={5} compact />
              </div>
            )}
            
            <div className="flex-grow relative">
              {skillsError ? (
                <SkillsErrorFallback />
              ) : (
                <Tabs value={state.activeTab} onValueChange={handleTabChange} className="h-full">
                  <div className="border-b px-4">
                    <TabsList className="grid w-full grid-cols-2 max-w-md">
                      <TabsTrigger value="skills" className="flex items-center space-x-2">
                        <span>🌳 Compétences</span>
                        {skillsLoading && (
                          <Loader2 className="h-3 w-3 animate-spin ml-1" />
                        )}
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
                    </TabsList>
                  </div>
                  
                  <TabsContent value="skills" className="h-full mt-0">
                    {skillsLoading ? (
                      <div className="absolute inset-0 bg-background flex items-center justify-center">
                        <div className="flex flex-col items-center space-y-4">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <div className="text-center space-y-2">
                            <p className="text-muted-foreground">Chargement des compétences...</p>
                            <p className="text-xs text-muted-foreground">
                              Connexion à Firebase et chargement via useSkills hook
                            </p>
                            <div className="text-xs text-muted-foreground mt-4">
                              <div className="inline-flex items-center space-x-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span>Système de compétences actif</span>
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
                          Achievements intelligents basés sur vos patterns d'apprentissage réels
                        </p>
                      </div>
                      
                      <SmartAchievementDisplay />
                    </div>
                  </TabsContent>
                </Tabs>
              )}
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

export default memo(Dashboard);
