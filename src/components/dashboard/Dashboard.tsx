
"use client";

import type { Skill, User } from "@/lib/types";
import { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
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
import { getSkillsFromFirestore, subscribeToLeaderboard } from "@/lib/firestore";
import { Loader2, Trophy } from "lucide-react";
import SmartAchievementDisplay from "@/components/achievements/SmartAchievementDisplay";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRecentlyUnlockedAchievements } from "@/stores/useAppStore";
import { logger } from "@/lib/logger";
import { FeatureErrorBoundary } from "@/components/ErrorBoundary";

interface DashboardProps {
  readonly currentUser: User;
}

interface DashboardState {
  selectedSkill: Skill | null;
  skills: Skill[];
  leaderboardUsers: User[];
  loading: boolean;
  activeTab: 'skills' | 'achievements';
  error: string | null;
}

function Dashboard({ currentUser }: DashboardProps) {
  // Consolidated state for better performance
  const [state, setState] = useState<DashboardState>({
    selectedSkill: null,
    skills: [],
    leaderboardUsers: [],
    loading: true,
    activeTab: 'skills',
    error: null
  });
  
  const isMountedRef = useRef(true);
  const recentlyUnlocked = useRecentlyUnlockedAchievements();
  
  // Optimized state setters
  const updateState = useCallback((updates: Partial<DashboardState>) => {
    if (!isMountedRef.current) return;
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!isMountedRef.current) return;
      
      try {
        updateState({ loading: true, error: null });
        
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout: Skills loading took too long')), 10000)
        );
        
        const skillsFromDb = await Promise.race([
          getSkillsFromFirestore(),
          timeoutPromise
        ]);
        
        if (isMountedRef.current) {
          logger.info('Skills loaded successfully', {
            action: 'dashboard_skills_loaded',
            skillCount: skillsFromDb.length,
            isAvailable: skillsFromDb.length > 0
          });
          updateState({ skills: skillsFromDb, loading: false });
        }
      } catch (error) {
        logger.error('Failed to fetch skills', {
          error: error instanceof Error ? error.message : String(error),
          action: 'dashboard_skills_fetch'
        });
        
        if (isMountedRef.current) {
          updateState({ 
            error: 'Failed to load skills. Please refresh the page.',
            loading: false 
          });
        }
      }
    }

    fetchData();

    const unsubscribe = subscribeToLeaderboard((users) => {
      if (isMountedRef.current) {
        updateState({ leaderboardUsers: users });
      }
    });

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, [updateState]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Memoized skill availability check
  const getSkillAvailability = useMemo(() => {
    const cache = new Map<string, { isAvailable: boolean; isCompleted: boolean }>();
    
    return (skill: Skill) => {
      if (cache.has(skill.id)) {
        return cache.get(skill.id)!;
      }
      
      const competence = currentUser.competences[skill.id];
      const isCompleted = competence?.completed ?? false;
      const isAvailable = skill.prereqs.length === 0 || 
        skill.prereqs.every(prereqId => currentUser.competences[prereqId]?.completed);
      
      const result = { isAvailable, isCompleted };
      cache.set(skill.id, result);
      return result;
    };
  }, [currentUser.competences]);

  const handleNodeClick = useCallback((skill: Skill) => {
    const { isAvailable, isCompleted } = getSkillAvailability(skill);
    
    if (isAvailable && !isCompleted) {
      updateState({ selectedSkill: skill });
    } else {
      logger.debug('Skill not clickable', {
        action: 'skill_node_click',
        skillId: skill.id,
        isAvailable,
        isCompleted
      });
    }
  }, [getSkillAvailability, updateState]);

  const handleCloseQuiz = useCallback(() => {
    updateState({ selectedSkill: null });
  }, [updateState]);
  
  const handleTabChange = useCallback((value: string) => {
    updateState({ activeTab: value as 'skills' | 'achievements' });
  }, [updateState]);

  // Error fallback component
  const ErrorFallback = useCallback(() => (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <p className="text-destructive font-medium">Failed to load dashboard</p>
      <p className="text-muted-foreground text-sm">{state.error}</p>
      <button 
        onClick={() => window.location.reload()} 
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Retry
      </button>
    </div>
  ), [state.error]);
  
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
                <SmartAchievementDisplay showRecentOnly maxDisplay={5} />
              </div>
            )}
            
            <div className="flex-grow relative">
              {state.error ? (
                <ErrorFallback />
              ) : (
                <Tabs value={state.activeTab} onValueChange={handleTabChange} className="h-full">
                  <div className="border-b px-4">
                    <TabsList className="grid w-full grid-cols-2 max-w-md">
                      <TabsTrigger value="skills" className="flex items-center space-x-2">
                        <span>🌳 Compétences</span>
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
                    {state.loading ? (
                      <div className="absolute inset-0 bg-background flex items-center justify-center">
                        <div className="flex flex-col items-center space-y-4">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-muted-foreground">Loading Skill Tree...</p>
                        </div>
                      </div>
                    ) : (
                      <SkillTree 
                        skills={state.skills} 
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
