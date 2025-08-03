"use client";

import { useState } from "react";
import { SidebarTrigger } from "./ui/sidebar";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import AuthButton from "./auth/AuthButton";
import AdminButton from "./admin/AdminButton";
import { BarChart3, Brain, Target } from "lucide-react";

interface HeaderProps {
  currentView?: string;
  onViewChange?: (view: string) => void;
}

export default function Header({ currentView = "skills", onViewChange }: HeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-4">
         <SidebarTrigger className="md:hidden" />
         <h1 className="text-2xl font-bold font-headline text-primary">SkillForge AI</h1>
      </div>
      
      {/* Navigation Tabs */}
      <div className="hidden md:block">
        <Tabs value={currentView} onValueChange={onViewChange} className="w-auto">
          <TabsList>
            <TabsTrigger value="skills" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Skills
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex items-center gap-4">
        <AdminButton />
        <AuthButton />
      </div>
    </header>
  );
}
