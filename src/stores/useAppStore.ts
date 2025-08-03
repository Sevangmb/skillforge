import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import type { User, Skill, Achievement } from '@/lib/types';
import { ACHIEVEMENTS, checkAchievements } from '@/lib/achievements';

// Types for store state
interface AppState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Skills state
  skills: Skill[];
  selectedSkill: Skill | null;
  
  // UI state
  sidebarOpen: boolean;
  currentView: 'desktop' | 'mobile';
  onboardingCompleted: boolean;
  
  // Achievements state
  achievements: Achievement[];
  recentUnlockedAchievements: Achievement[];
  
  // Modal states
  quizModalOpen: boolean;
  settingsModalOpen: boolean;
  achievementModalOpen: boolean;
}

// Actions interface
interface AppActions {
  // User actions
  setUser: (user: User | null) => void;
  updateUserProgress: (skillId: string, completed: boolean, points?: number) => void;
  setLoading: (loading: boolean) => void;
  
  // Skills actions
  setSkills: (skills: Skill[]) => void;
  setSelectedSkill: (skill: Skill | null) => void;
  
  // UI actions
  setSidebarOpen: (open: boolean) => void;
  setCurrentView: (view: 'desktop' | 'mobile') => void;
  setOnboardingCompleted: (completed: boolean) => void;
  
  // Achievement actions
  setAchievements: (achievements: Achievement[]) => void;
  unlockAchievement: (achievementId: string) => void;
  checkAndUnlockAchievements: () => void;
  clearRecentAchievements: () => void;
  
  // Modal actions
  setQuizModalOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
  setAchievementModalOpen: (open: boolean) => void;
}

type AppStore = AppState & AppActions;

// Initial state
const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  skills: [],
  selectedSkill: null,
  sidebarOpen: true,
  currentView: 'desktop',
  onboardingCompleted: false,
  achievements: ACHIEVEMENTS,
  recentUnlockedAchievements: [],
  quizModalOpen: false,
  settingsModalOpen: false,
  achievementModalOpen: false,
};

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        ...initialState,

        // User actions
        setUser: (user) => set({ user, isAuthenticated: !!user }),
        
        updateUserProgress: (skillId, completed, points = 0) => set((state) => {
          if (!state.user) return state;
          
          const currentCompetence = state.user.competences[skillId];
          const newTotalPoints = state.user.profile.totalPoints + points;
          const newLevel = Math.floor(newTotalPoints / 1000) + 1;
          
          const newUser = {
            ...state.user,
            competences: {
              ...state.user.competences,
              [skillId]: {
                level: currentCompetence?.level || 1,
                completed,
              },
            },
            profile: {
              ...state.user.profile,
              totalPoints: newTotalPoints,
              level: newLevel,
            },
          };

          return { user: newUser };
        }),
        
        setLoading: (isLoading) => set({ isLoading }),

        // Skills actions
        setSkills: (skills) => set({ skills }),
        setSelectedSkill: (selectedSkill) => set({ selectedSkill }),

        // UI actions
        setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
        setCurrentView: (currentView) => set({ currentView }),
        setOnboardingCompleted: (onboardingCompleted) => set({ onboardingCompleted }),

        // Achievement actions
        setAchievements: (achievements) => set({ achievements }),
        
        unlockAchievement: (achievementId) => set((state) => ({
          achievements: state.achievements.map(achievement =>
            achievement.id === achievementId
              ? { ...achievement, unlocked: true, unlockedAt: new Date() }
              : achievement
          ),
        })),

        checkAndUnlockAchievements: () => set((state) => {
          if (!state.user || !state.skills.length) return state;

          const unlockedAchievements = checkAchievements(state.user, state.skills);
          
          if (unlockedAchievements.length === 0) return state;

          // Update achievements
          const updatedAchievements = state.achievements.map(achievement => {
            const unlocked = unlockedAchievements.find(u => u.id === achievement.id);
            return unlocked ? { ...achievement, unlocked: true, unlockedAt: new Date() } : achievement;
          });

          return {
            achievements: updatedAchievements,
            recentUnlockedAchievements: [...state.recentUnlockedAchievements, ...unlockedAchievements]
          };
        }),

        clearRecentAchievements: () => set({ recentUnlockedAchievements: [] }),

        // Modal actions
        setQuizModalOpen: (quizModalOpen) => set({ quizModalOpen }),
        setSettingsModalOpen: (settingsModalOpen) => set({ settingsModalOpen }),
        setAchievementModalOpen: (achievementModalOpen) => set({ achievementModalOpen }),
      })),
      {
        name: 'skillforge-app-store',
        partialize: (state) => ({
          onboardingCompleted: state.onboardingCompleted,
          sidebarOpen: state.sidebarOpen,
          currentView: state.currentView,
          achievements: state.achievements,
        }),
      }
    ),
    {
      name: 'SkillForge App Store',
    }
  )
);

// Basic selectors - these are stable and memoized
export const useUser = () => useAppStore((state) => state.user);
export const useIsAuthenticated = () => useAppStore((state) => state.isAuthenticated);
export const useSkills = () => useAppStore((state) => state.skills);
export const useSelectedSkill = () => useAppStore((state) => state.selectedSkill);
export const useUserLevel = () => useAppStore((state) => state.user?.profile.level || 1);
export const useTotalXP = () => useAppStore((state) => state.user?.profile.totalPoints || 0);

// Computed selectors for better performance
export const useCompletedSkillsCount = () => useAppStore((state) => {
  if (!state.user) return 0;
  return Object.values(state.user.competences).filter(comp => comp.completed).length;
});

export const useUnlockedAchievementsCount = () => useAppStore((state) => 
  state.achievements.filter(achievement => achievement.unlocked).length
);

// Achievement hooks - basic data only
export const useAchievements = () => useAppStore((state) => state.achievements);
export const useRecentUnlockedAchievements = () => 
  useAppStore((state) => state.recentUnlockedAchievements);

// UI hooks
export const useSidebarOpen = () => useAppStore((state) => state.sidebarOpen);
export const useCurrentView = () => useAppStore((state) => state.currentView);
export const useOnboardingCompleted = () => useAppStore((state) => state.onboardingCompleted);

// Modal hooks
export const useQuizModal = () => useAppStore((state) => ({
  isOpen: state.quizModalOpen,
  setOpen: state.setQuizModalOpen,
}));

export const useSettingsModal = () => useAppStore((state) => ({
  isOpen: state.settingsModalOpen,
  setOpen: state.setSettingsModalOpen,
}));

export const useAchievementModal = () => useAppStore((state) => ({
  isOpen: state.achievementModalOpen,
  setOpen: state.setAchievementModalOpen,
}));