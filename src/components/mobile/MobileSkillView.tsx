"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronRight, 
  Lock, 
  CheckCircle, 
  Circle, 
  Star,
  BookOpen,
  Target,
  TrendingUp
} from 'lucide-react';
import type { Skill, User } from '@/lib/types';

interface MobileSkillViewProps {
  skills: Skill[];
  user: User;
  onSkillClick: (skill: Skill) => void;
}

export default function MobileSkillView({ skills, user, onSkillClick }: MobileSkillViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Group skills by category
  const categories = ['all', ...Array.from(new Set(skills.map(skill => skill.category)))];
  
  const getSkillStatus = (skill: Skill) => {
    if (user.competences[skill.id]?.completed) return 'completed';
    const prereqsMet = skill.prereqs.every(id => user.competences[id]?.completed);
    if (prereqsMet) return 'available';
    return skill.isSecret ? 'secret' : 'locked';
  };

  const getFilteredSkills = () => {
    const filtered = selectedCategory === 'all' 
      ? skills 
      : skills.filter(skill => skill.category === selectedCategory);
    
    // Sort by status priority: available > completed > locked
    return filtered.sort((a, b) => {
      const statusA = getSkillStatus(a);
      const statusB = getSkillStatus(b);
      
      const priority = { available: 0, completed: 1, locked: 2, secret: 3 };
      return priority[statusA] - priority[statusB];
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'available':
        return <Circle className="h-5 w-5 text-blue-500" />;
      case 'locked':
        return <Lock className="h-5 w-5 text-muted-foreground" />;
      case 'secret':
        return <Star className="h-5 w-5 text-purple-500" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'available':
        return 'border-blue-200 bg-blue-50 cursor-pointer hover:bg-blue-100';
      case 'locked':
        return 'border-muted bg-muted/20';
      case 'secret':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-muted bg-muted/20';
    }
  };

  const calculateProgress = () => {
    const completed = skills.filter(skill => user.competences[skill.id]?.completed).length;
    return (completed / skills.length) * 100;
  };

  const getCompletedByCategory = (category: string) => {
    const categorySkills = category === 'all' ? skills : skills.filter(s => s.category === category);
    const completed = categorySkills.filter(skill => user.competences[skill.id]?.completed).length;
    return { completed, total: categorySkills.length };
  };

  return (
    <div className="h-full flex flex-col">
      {/* Progress Header */}
      <div className="p-4 border-b bg-card">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Learning Journey</h2>
            <Badge variant="outline" className="flex items-center space-x-1">
              <TrendingUp className="h-3 w-3" />
              <span>Level {user.profile.level}</span>
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{Math.round(calculateProgress())}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs 
        value={selectedCategory} 
        onValueChange={setSelectedCategory}
        className="flex-1 flex flex-col"
      >
        <div className="border-b">
          <ScrollArea className="w-full">
            <TabsList className="w-full justify-start h-12 bg-transparent p-0">
              {categories.map(category => {
                const { completed, total } = getCompletedByCategory(category);
                return (
                  <TabsTrigger 
                    key={category}
                    value={category}
                    className="flex-shrink-0 px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <span className="text-sm font-medium capitalize">
                        {category}
                      </span>
                      <span className="text-xs opacity-75">
                        {completed}/{total}
                      </span>
                    </div>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </ScrollArea>
        </div>

        {/* Skills List */}
        <TabsContent value={selectedCategory} className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {getFilteredSkills().map(skill => {
                const status = getSkillStatus(skill);
                const isClickable = status === 'available' && !user.competences[skill.id]?.completed;
                
                return (
                  <Card 
                    key={skill.id}
                    className={`transition-all duration-200 ${getStatusColor(status)}`}
                    onClick={() => isClickable && onSkillClick(skill)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        {/* Status Icon */}
                        <div className="flex-shrink-0 mt-1">
                          {getStatusIcon(status)}
                        </div>

                        {/* Skill Info */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium text-sm">{skill.name}</h3>
                              <p className="text-xs text-muted-foreground mt-1">
                                {skill.description}
                              </p>
                            </div>
                            {isClickable && (
                              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                          </div>

                          {/* Skill Metadata */}
                          <div className="flex items-center space-x-3 text-xs">
                            <Badge variant="secondary" className="flex items-center space-x-1">
                              <BookOpen className="h-3 w-3" />
                              <span>Level {skill.level}</span>
                            </Badge>
                            <Badge variant="outline" className="flex items-center space-x-1">
                              <Target className="h-3 w-3" />
                              <span>{skill.cost} XP</span>
                            </Badge>
                          </div>

                          {/* Prerequisites */}
                          {skill.prereqs.length > 0 && status === 'locked' && (
                            <div className="text-xs text-muted-foreground">
                              <span>Requires: </span>
                              {skill.prereqs.map((prereqId, index) => {
                                const prereqSkill = skills.find(s => s.id === prereqId);
                                return (
                                  <span key={prereqId}>
                                    {prereqSkill?.name}
                                    {index < skill.prereqs.length - 1 && ', '}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}