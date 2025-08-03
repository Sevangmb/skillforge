"use client";

import type { Skill, User } from "@/lib/types";
import { useState, useEffect } from "react";
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
import { Loader2 } from "lucide-react";

interface DashboardProps {
  currentUser: User;
}

export default function Dashboard({ currentUser }: DashboardProps) {
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSkillsAndSubscribe = async () => {
      setLoading(true);
      const skillsFromDb = await getSkillsFromFirestore();
      setSkills(skillsFromDb);
      setLoading(false);

      const unsubscribe = subscribeToLeaderboard((leaderboardUsers) => {
        setUsers(leaderboardUsers);
      });

      return () => unsubscribe();
    };

    const unsubscribePromise = fetchSkillsAndSubscribe();

    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
    };
  }, []);

  const handleNodeClick = (skill: Skill) => {
    const competence = currentUser.competences[skill.id];
    const isCompleted = competence?.completed;
    
    let isAvailable = false;
    if (skill.prereqs.length === 0) {
      isAvailable = true;
    } else {
      isAvailable = skill.prereqs.every(prereqId => currentUser.competences[prereqId]?.completed);
    }
    
    if (isAvailable && !isCompleted) {
      setSelectedSkill(skill);
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <ProfileCard user={currentUser} />
        </SidebarHeader>
        <Separator className="my-2" />
        <SidebarContent>
          <Leaderboard users={users} />
        </SidebarContent>
        <SidebarFooter>
          <p className="text-xs text-muted-foreground p-2">© 2024 SkillForge AI</p>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-screen">
          <Header />
          <div className="flex-grow relative">
            {loading ? (
               <div className="absolute inset-0 bg-background flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading Skill Tree...</p>
                </div>
              </div>
            ) : (
              <SkillTree skills={skills} user={currentUser} onNodeClick={handleNodeClick} />
            )}
          </div>
        </div>
      </SidebarInset>
      <QuizModal
        isOpen={!!selectedSkill}
        onClose={() => setSelectedSkill(null)}
        skill={selectedSkill}
        user={currentUser}
      />
    </SidebarProvider>
  );
}
