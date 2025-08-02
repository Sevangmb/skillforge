"use client";

import type { Skill, User } from "@/lib/types";
import { useState } from "react";
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

interface DashboardProps {
  skills: Skill[];
  users: User[];
  currentUser: User;
}

export default function Dashboard({ skills, users, currentUser }: DashboardProps) {
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const handleNodeClick = (skill: Skill) => {
    // Only available skills can be clicked to start a quiz
    const competence = currentUser.competences[skill.id];
    const isCompleted = competence?.completed;
    
    let isAvailable = !isCompleted;
    if (skill.prereqs.length > 0) {
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
            <SkillTree skills={skills} user={currentUser} onNodeClick={handleNodeClick} />
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
