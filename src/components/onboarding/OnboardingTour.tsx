"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronRight, ChevronLeft, X, Target, Users, Trophy, Map } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target: string;
  icon: React.ReactNode;
  position: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTourProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export default function OnboardingTour({ isOpen, onComplete, onSkip }: OnboardingTourProps) {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to SkillForge AI!',
      description: 'Your personalized learning companion powered by AI. Let\'s explore the key features.',
      target: 'dashboard',
      icon: <Target className="h-5 w-5" />,
      position: 'top'
    },
    {
      id: 'skill-tree',
      title: 'Interactive Skill Tree',
      description: 'Visualize your learning journey. Click on available skills to start learning. You can pan and zoom to explore.',
      target: 'skill-tree',
      icon: <Map className="h-5 w-5" />,
      position: 'left'
    },
    {
      id: 'profile',
      title: 'Your Profile',
      description: 'Track your progress, level, and achievements. Your learning statistics are updated in real-time.',
      target: 'profile-card',
      icon: <Users className="h-5 w-5" />,
      position: 'right'
    },
    {
      id: 'leaderboard',
      title: 'Leaderboard',
      description: 'See how you rank against other learners. Competition drives motivation!',
      target: 'leaderboard',
      icon: <Trophy className="h-5 w-5" />,
      position: 'right'
    }
  ];

  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50" />
      
      {/* Tour Card */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-51">
        <Card className="w-96 animate-in fade-in duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {currentStepData.icon}
                <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex space-x-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 rounded-full flex-1 ${
                    index <= currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <CardDescription className="text-sm">
              {currentStepData.description}
            </CardDescription>
            
            <div className="flex items-center justify-between pt-4">
              <div className="flex space-x-2">
                <Badge variant="outline">
                  {currentStep + 1} of {steps.length}
                </Badge>
              </div>
              
              <div className="flex space-x-2">
                {currentStep > 0 && (
                  <Button variant="outline" size="sm" onClick={handlePrevious}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                )}
                <Button size="sm" onClick={handleNext}>
                  {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                  {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}