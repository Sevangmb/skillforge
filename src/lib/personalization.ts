// AI-powered learning path personalization system
import type { User, Skill, QuizSession } from './types';

export interface LearningRecommendation {
  skillId: string;
  reason: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  estimatedDifficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutes
  prerequisites: string[];
  nextSkills: string[];
}

export interface UserLearningProfile {
  preferredDifficulty: 'beginner' | 'intermediate' | 'advanced';
  learningVelocity: number; // skills per week
  strongSubjects: string[];
  challengingSubjects: string[];
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  sessionDuration: number; // preferred minutes per session
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  streakDays: number;
}

export interface LearningAnalytics {
  totalSkillsCompleted: number;
  averageQuizScore: number;
  totalTimeSpent: number; // minutes
  completionRate: number; // percentage
  streakRecord: number;
  categoryProgress: Record<string, { completed: number; total: number }>;
  weeklyActivity: Array<{ week: string; skillsCompleted: number; timeSpent: number }>;
  difficultyPreference: Record<string, number>;
}

class PersonalizationEngine {
  private static instance: PersonalizationEngine;

  static getInstance(): PersonalizationEngine {
    if (!PersonalizationEngine.instance) {
      PersonalizationEngine.instance = new PersonalizationEngine();
    }
    return PersonalizationEngine.instance;
  }

  /**
   * Generate personalized learning recommendations for a user
   */
  generateRecommendations(
    user: User,
    skills: Skill[],
    userProfile: UserLearningProfile,
    analytics: LearningAnalytics
  ): LearningRecommendation[] {
    const recommendations: LearningRecommendation[] = [];
    
    // 1. Find available skills (prerequisites met)
    const availableSkills = this.getAvailableSkills(user, skills);
    
    // 2. Score each available skill based on user profile
    const scoredSkills = availableSkills.map(skill => ({
      skill,
      score: this.calculateSkillScore(skill, user, userProfile, analytics),
    }));

    // 3. Sort by score and create recommendations
    scoredSkills
      .sort((a, b) => b.score - a.score)
      .slice(0, 5) // Top 5 recommendations
      .forEach(({ skill, score }) => {
        recommendations.push({
          skillId: skill.id,
          reason: this.generateRecommendationReason(skill, user, userProfile, analytics),
          confidence: Math.min(score / 100, 1),
          priority: this.determinePriority(score),
          estimatedDifficulty: this.estimateSkillDifficulty(skill, userProfile),
          estimatedTime: this.estimateCompletionTime(skill, userProfile),
          prerequisites: skill.prereqs,
          nextSkills: this.getNextSkills(skill, skills),
        });
      });

    return recommendations;
  }

  /**
   * Analyze user learning patterns and generate profile
   */
  generateUserProfile(
    user: User,
    skills: Skill[],
    quizSessions: QuizSession[]
  ): UserLearningProfile {
    const completedSkills = skills.filter(skill => user.competences[skill.id]?.completed);
    
    // Analyze learning velocity
    const learningVelocity = this.calculateLearningVelocity(completedSkills, quizSessions);
    
    // Identify strong and challenging subjects
    const { strongSubjects, challengingSubjects } = this.analyzeSubjectPerformance(
      user, skills, quizSessions
    );

    // Determine preferred difficulty based on completion patterns
    const preferredDifficulty = this.determinePreferredDifficulty(user, skills);

    return {
      preferredDifficulty,
      learningVelocity,
      strongSubjects,
      challengingSubjects,
      learningStyle: user.preferences.learningStyle as any || 'visual',
      sessionDuration: this.estimatePreferredSessionDuration(quizSessions),
      timeOfDay: 'evening', // Could be enhanced with actual usage data
      streakDays: this.calculateCurrentStreak(quizSessions),
    };
  }

  /**
   * Generate comprehensive learning analytics
   */
  generateAnalytics(
    user: User,
    skills: Skill[],
    quizSessions: QuizSession[]
  ): LearningAnalytics {
    const completedSkills = skills.filter(skill => user.competences[skill.id]?.completed);
    
    // Calculate category progress
    const categoryProgress = this.calculateCategoryProgress(skills, user);
    
    // Calculate weekly activity (mock data for now)
    const weeklyActivity = this.generateWeeklyActivity(quizSessions);

    return {
      totalSkillsCompleted: completedSkills.length,
      averageQuizScore: this.calculateAverageQuizScore(quizSessions),
      totalTimeSpent: this.calculateTotalTimeSpent(quizSessions),
      completionRate: (completedSkills.length / skills.length) * 100,
      streakRecord: this.calculateStreakRecord(quizSessions),
      categoryProgress,
      weeklyActivity,
      difficultyPreference: this.analyzeDifficultyPreference(user, skills),
    };
  }

  private getAvailableSkills(user: User, skills: Skill[]): Skill[] {
    return skills.filter(skill => {
      // Skip already completed skills
      if (user.competences[skill.id]?.completed) return false;
      
      // Check if all prerequisites are met
      return skill.prereqs.every(prereqId => 
        user.competences[prereqId]?.completed
      );
    });
  }

  private calculateSkillScore(
    skill: Skill,
    user: User,
    profile: UserLearningProfile,
    analytics: LearningAnalytics
  ): number {
    let score = 50; // Base score

    // Boost score for strong subjects
    if (profile.strongSubjects.includes(skill.category)) {
      score += 30;
    }

    // Reduce score for challenging subjects (but don't avoid them completely)
    if (profile.challengingSubjects.includes(skill.category)) {
      score -= 10;
    }

    // Consider difficulty preference
    const skillDifficulty = this.estimateSkillDifficulty(skill, profile);
    if (skillDifficulty === profile.preferredDifficulty) {
      score += 20;
    }

    // Boost popular categories
    const categoryCompletion = analytics.categoryProgress[skill.category];
    if (categoryCompletion && categoryCompletion.completed > 0) {
      score += 15;
    }

    // Random factor to add variety (10% variance)
    score += Math.random() * 10 - 5;

    return Math.max(0, score);
  }

  private generateRecommendationReason(
    skill: Skill,
    user: User,
    profile: UserLearningProfile,
    analytics: LearningAnalytics
  ): string {
    const reasons = [];

    if (profile.strongSubjects.includes(skill.category)) {
      reasons.push(`Building on your strength in ${skill.category}`);
    }

    if (skill.prereqs.length === 0) {
      reasons.push("Perfect starting point with no prerequisites");
    }

    const categoryProgress = analytics.categoryProgress[skill.category];
    if (categoryProgress && categoryProgress.completed > 0) {
      reasons.push(`Continue your progress in ${skill.category}`);
    }

    if (reasons.length === 0) {
      reasons.push("Recommended based on your learning pattern");
    }

    return reasons[0];
  }

  private determinePriority(score: number): 'high' | 'medium' | 'low' {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }

  private estimateSkillDifficulty(
    skill: Skill,
    profile: UserLearningProfile
  ): 'beginner' | 'intermediate' | 'advanced' {
    // Simple heuristic based on prerequisites and level
    if (skill.prereqs.length === 0 && skill.level <= 2) return 'beginner';
    if (skill.prereqs.length <= 2 && skill.level <= 4) return 'intermediate';
    return 'advanced';
  }

  private estimateCompletionTime(skill: Skill, profile: UserLearningProfile): number {
    const baseTime = 30; // 30 minutes base
    const difficultyMultiplier = {
      beginner: 0.8,
      intermediate: 1.0,
      advanced: 1.5,
    };

    const difficulty = this.estimateSkillDifficulty(skill, profile);
    return Math.round(baseTime * difficultyMultiplier[difficulty]);
  }

  private getNextSkills(skill: Skill, allSkills: Skill[]): string[] {
    return allSkills
      .filter(s => s.prereqs.includes(skill.id))
      .map(s => s.id)
      .slice(0, 3);
  }

  private calculateLearningVelocity(
    completedSkills: Skill[],
    quizSessions: QuizSession[]
  ): number {
    // Simple calculation - could be enhanced with actual timestamps
    const recentSessions = quizSessions.slice(-10);
    return Math.max(1, recentSessions.length * 0.7); // skills per week
  }

  private analyzeSubjectPerformance(
    user: User,
    skills: Skill[],
    quizSessions: QuizSession[]
  ): { strongSubjects: string[]; challengingSubjects: string[] } {
    const categoryScores: Record<string, { total: number; count: number }> = {};

    skills.forEach(skill => {
      const competence = user.competences[skill.id];
      if (competence?.completed) {
        if (!categoryScores[skill.category]) {
          categoryScores[skill.category] = { total: 0, count: 0 };
        }
        categoryScores[skill.category].total += competence.level || 1;
        categoryScores[skill.category].count += 1;
      }
    });

    const categoryAverages = Object.entries(categoryScores).map(([category, data]) => ({
      category,
      average: data.total / data.count,
    }));

    categoryAverages.sort((a, b) => b.average - a.average);

    return {
      strongSubjects: categoryAverages.slice(0, 2).map(c => c.category),
      challengingSubjects: categoryAverages.slice(-2).map(c => c.category),
    };
  }

  private determinePreferredDifficulty(user: User, skills: Skill[]): 'beginner' | 'intermediate' | 'advanced' {
    const completedSkills = skills.filter(skill => user.competences[skill.id]?.completed);
    const avgLevel = completedSkills.reduce((sum, skill) => sum + skill.level, 0) / completedSkills.length;
    
    if (avgLevel <= 2) return 'beginner';
    if (avgLevel <= 4) return 'intermediate';
    return 'advanced';
  }

  private estimatePreferredSessionDuration(quizSessions: QuizSession[]): number {
    // Default to 30 minutes - could be enhanced with actual session data
    return 30;
  }

  private calculateCurrentStreak(quizSessions: QuizSession[]): number {
    // Simplified streak calculation - would need actual timestamps
    return Math.min(quizSessions.length, 7);
  }

  private calculateCategoryProgress(skills: Skill[], user: User): Record<string, { completed: number; total: number }> {
    const progress: Record<string, { completed: number; total: number }> = {};

    skills.forEach(skill => {
      if (!progress[skill.category]) {
        progress[skill.category] = { completed: 0, total: 0 };
      }
      progress[skill.category].total += 1;
      if (user.competences[skill.id]?.completed) {
        progress[skill.category].completed += 1;
      }
    });

    return progress;
  }

  private generateWeeklyActivity(quizSessions: QuizSession[]): Array<{ week: string; skillsCompleted: number; timeSpent: number }> {
    // Mock weekly activity data - would be enhanced with real timestamps
    return [
      { week: 'Week 1', skillsCompleted: 3, timeSpent: 120 },
      { week: 'Week 2', skillsCompleted: 5, timeSpent: 180 },
      { week: 'Week 3', skillsCompleted: 2, timeSpent: 90 },
      { week: 'Week 4', skillsCompleted: 4, timeSpent: 150 },
    ];
  }

  private calculateAverageQuizScore(quizSessions: QuizSession[]): number {
    if (quizSessions.length === 0) return 0;
    // Mock calculation - would use actual quiz scores
    return 78;
  }

  private calculateTotalTimeSpent(quizSessions: QuizSession[]): number {
    // Mock calculation - would use actual session durations
    return quizSessions.length * 25; // 25 minutes average per session
  }

  private calculateStreakRecord(quizSessions: QuizSession[]): number {
    // Mock calculation - would analyze actual learning streaks
    return Math.min(quizSessions.length + 2, 15);
  }

  private analyzeDifficultyPreference(user: User, skills: Skill[]): Record<string, number> {
    const completedSkills = skills.filter(skill => user.competences[skill.id]?.completed);
    const difficultyDistribution = { beginner: 0, intermediate: 0, advanced: 0 };

    completedSkills.forEach(skill => {
      if (skill.level <= 2) difficultyDistribution.beginner += 1;
      else if (skill.level <= 4) difficultyDistribution.intermediate += 1;
      else difficultyDistribution.advanced += 1;
    });

    return difficultyDistribution;
  }
}

// Export singleton instance
export const personalizationEngine = PersonalizationEngine.getInstance();

// Convenience functions
export function getPersonalizedRecommendations(
  user: User,
  skills: Skill[],
  quizSessions: QuizSession[] = []
): Promise<LearningRecommendation[]> {
  return new Promise((resolve) => {
    const profile = personalizationEngine.generateUserProfile(user, skills, quizSessions);
    const analytics = personalizationEngine.generateAnalytics(user, skills, quizSessions);
    const recommendations = personalizationEngine.generateRecommendations(user, skills, profile, analytics);
    resolve(recommendations);
  });
}

export function getUserLearningAnalytics(
  user: User,
  skills: Skill[],
  quizSessions: QuizSession[] = []
): LearningAnalytics {
  return personalizationEngine.generateAnalytics(user, skills, quizSessions);
}