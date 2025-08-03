
"use client";

import type { Skill, User } from "@/lib/types";
import { useEffect, useState } from "react";
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
import MobileSkillView from "@/components/mobile/MobileSkillView";
import { SkillTreeSkeleton } from "@/components/ui/SkillTreeSkeleton";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { AchievementsWidget } from "@/components/dashboard/AchievementsWidget";
import EnhancedQuizModal from "@/components/quiz/EnhancedQuizModal";
import LearningRecommendations from "@/components/recommendations/LearningRecommendations";
import LearningAnalyticsDashboard from "@/components/analytics/LearningAnalyticsDashboard";
import SpecializationUnlockModal from "../specialization/SpecializationUnlockModal";
import { useNewSpecializations } from "@/hooks/useSpecializations";
import { Separator } from "../ui/separator";
import { getSkillsFromFirestore, subscribeToLeaderboard } from "@/lib/firestore";
import { useToast } from "@/hooks/useToast";
import { debounce, BREAKPOINTS, ANIMATION_DELAYS } from "@/lib/utils";
import { 
  useAppStore, 
  useSkills, 
  useSelectedSkill, 
  useUser,
  useIsAuthenticated,
  useCurrentView,
  useSidebarOpen
} from "@/stores/useAppStore";

interface DashboardProps {
  currentUser: User;
}

export default function Dashboard({ currentUser }: DashboardProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [dashboardView, setDashboardView] = useState<'skills' | 'analytics'>('skills');
  const { success, error } = useToast();
  
  // Zustand store hooks - must be declared before using user
  const {
    setSkills,
    setSelectedSkill,
    setUser,
    setLoading,
    setCurrentView,
    setSidebarOpen,
    checkAndUnlockAchievements,
    isLoading
  } = useAppStore();
  
  const skills = useSkills();
  const selectedSkill = useSelectedSkill();
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const currentView = useCurrentView();
  const sidebarOpen = useSidebarOpen();

  // Hook for managing specialization unlocks - moved after user is defined
  const { hasNewSpecializations, latestProgression, markAsViewed } = useNewSpecializations(user);

  // Mobile detection with debouncing
  useEffect(() => {
    const checkMobile = debounce(() => {
      const mobile = window.innerWidth < BREAKPOINTS.mobile;
      setIsMobile(mobile);
      setCurrentView(mobile ? 'mobile' : 'desktop');
      if (mobile) {
        setSidebarOpen(false);
      }
    }, 100);

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setCurrentView, setSidebarOpen]);

  // Initialize user in store
  useEffect(() => {
    setUser(currentUser);
  }, [currentUser, setUser]);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      if (!isMounted) return;
      
      setLoading(true);
      try {
        const skillsFromDb = await getSkillsFromFirestore();
        if (isMounted) {
          setSkills(skillsFromDb);
          success("Skills loaded", "Your learning path is ready!");
          
          // Check for achievements after skills are loaded
          const achievementTimeout = setTimeout(() => {
            checkAndUnlockAchievements();
          }, 1000);
          
          return () => clearTimeout(achievementTimeout);
        }
      } catch (err) {
        if (isMounted) {
          error("Failed to load skills", "Please try refreshing the page.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    const unsubscribe = subscribeToLeaderboard((users) => {
      // Note: Leaderboard users could also be moved to store if needed
      // For now, keeping it local to avoid over-engineering
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [setSkills, setLoading, success, error, checkAndUnlockAchievements]);

  const handleNodeClick = (skill: Skill) => {
    if (!user) return;
    
    const competence = user.competences[skill.id];
    const isCompleted = competence?.completed;
    
    let isAvailable = false;
    if (skill.prereqs.length === 0) {
      isAvailable = true;
    } else {
      isAvailable = skill.prereqs.every(prereqId => user.competences[prereqId]?.completed);
    }
    
    if (isAvailable && !isCompleted) {
      setSelectedSkill(skill);
      success("Skill selected", `Starting quiz for ${skill.name}`);
    } else if (isCompleted) {
      success("Skill completed", `You've already mastered ${skill.name}!`);
    } else {
      error("Skill locked", "Complete prerequisites to unlock this skill.");
    }
  };

  const handleSpecializationQuizSelect = (quizId: string) => {
    success("Specialized Quiz Selected", `Starting specialized quiz: ${quizId}`);
    // TODO: Implement specialized quiz selection logic
  };

  const handleSpecializationModalClose = () => {
    if (latestProgression) {
      markAsViewed(latestProgression.completedSkillId);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <SkillTreeSkeleton />
        </div>
      </div>
    );
  }

  // Mobile layout
  if (isMobile) {
    return (
      <div className="h-screen flex flex-col">
        <Header 
          currentView={dashboardView} 
          onViewChange={(view) => setDashboardView(view as 'skills' | 'analytics')}
        />
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <SkillTreeSkeleton />
          ) : dashboardView === 'skills' ? (
            <MobileSkillView 
              skills={skills} 
              user={user} 
              onSkillClick={handleNodeClick} 
            />
          ) : (
            <div className="p-4">
              <LearningAnalyticsDashboard user={user} skills={skills} />
            </div>
          )}
        </div>
        <EnhancedQuizModal
          isOpen={!!selectedSkill}
          onClose={() => setSelectedSkill(null)}
          skill={selectedSkill}
          user={user}
        />
        <SpecializationUnlockModal
          isOpen={hasNewSpecializations}
          onClose={handleSpecializationModalClose}
          progression={latestProgression}
          onSelectQuiz={handleSpecializationQuizSelect}
        />
      </div>
    );
  }

  // Desktop layout
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <ProfileCard user={user} />
        </SidebarHeader>
        <Separator className="my-2" />
        <SidebarContent className="space-y-4">
          <DashboardStats />
          <Separator />
          <LearningRecommendations 
            user={user} 
            skills={skills} 
            onSkillSelect={(skillId) => {
              const skill = skills.find(s => s.id === skillId);
              if (skill) handleNodeClick(skill);
            }}
          />
          <Separator />
          <AchievementsWidget />
          <Separator />
          <Leaderboard users={[]} /> {/* TODO: Move leaderboard to store */}
        </SidebarContent>
        <SidebarFooter>
          <p className="text-xs text-muted-foreground p-2">© 2024 SkillForge AI</p>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-screen">
          <Header 
            currentView={dashboardView} 
            onViewChange={(view) => setDashboardView(view as 'skills' | 'analytics')}
          />
          <div className="flex-grow relative overflow-auto">
            {isLoading ? (
              <SkillTreeSkeleton />
            ) : dashboardView === 'skills' ? (
              <SkillTree skills={skills} user={user} onNodeClick={handleNodeClick} />
            ) : (
              <div className="p-6">
                <LearningAnalyticsDashboard user={user} skills={skills} />
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
      <EnhancedQuizModal
        isOpen={!!selectedSkill}
        onClose={() => setSelectedSkill(null)}
        skill={selectedSkill}
        user={user}
      />
      <SpecializationUnlockModal
        isOpen={hasNewSpecializations}
        onClose={handleSpecializationModalClose}
        progression={latestProgression}
        onSelectQuiz={handleSpecializationQuizSelect}
      />
    </SidebarProvider>
  );
}
