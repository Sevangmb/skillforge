"use server";

import { generateQuizQuestion, type GenerateQuizQuestionInput, type GenerateQuizQuestionOutput } from "@/ai/flows/generate-quiz-question";
import { generateExplanation, type GenerateExplanationInput, type GenerateExplanationOutput } from "@/ai/flows/generate-explanation";
import { expandSkillTree, type ExpandSkillTreeInput, type ExpandSkillTreeOutput } from "@/ai/flows/expand-skill-tree";
import { getUserProfile, updateUserProfile } from "@/lib/auth";
import { saveSkillsToFirestore } from "@/lib/firestore";
import type { User, CompetenceStatus, Skill } from "@/lib/types";
import { ZodError } from "zod";
import { resilientAIService, PerformanceMonitor } from "@/lib/resilient-ai-service";

export type { GenerateQuizQuestionInput, GenerateQuizQuestionOutput };
export type { GenerateExplanationInput, GenerateExplanationOutput };
export type { ExpandSkillTreeInput, ExpandSkillTreeOutput };

export async function generateQuizQuestionAction(input: GenerateQuizQuestionInput): Promise<GenerateQuizQuestionOutput> {
  const monitor = PerformanceMonitor.measureAIOperation('generateQuestion');
  
  try {
    const result = await resilientAIService.generateQuestion(input);
    monitor.end(true);
    return result;
  } catch (error) {
    monitor.end(false);
    console.error("Error in generateQuizQuestionAction:", error);
    throw new Error("Failed to generate quiz question after all fallback attempts");
  }
}

export async function generateExplanationAction(input: GenerateExplanationInput): Promise<GenerateExplanationOutput> {
  const monitor = PerformanceMonitor.measureAIOperation('generateExplanation');
  
  try {
    const result = await resilientAIService.generateExplanation(input);
    monitor.end(true);
    return { explanation: result };
  } catch (error) {
    monitor.end(false);
    console.error("Error in generateExplanationAction:", error);
    throw new Error("Failed to generate explanation after all fallback attempts");
  }
}

export async function expandSkillTreeAction(input: ExpandSkillTreeInput): Promise<ExpandSkillTreeOutput> {
  const monitor = PerformanceMonitor.measureAIOperation('expandSkillTree');
  
  try {
    const result = await resilientAIService.expandSkillTree(input);
    monitor.end(true);
    
    // Here, you would typically save the new skills to Firestore
    // For now, we'll just log them.
    console.log("New skills generated:", result.newSkills);
    return result;
  } catch (error) {
    monitor.end(false);
    console.error("Error in expandSkillTreeAction:", error);
    
    // Provide a more graceful fallback - don't throw error that breaks user progress
    console.warn("Skill tree expansion failed, but user progress will still be saved");
    return { newSkills: [] }; // Return empty array instead of throwing
  }
}


export type UpdateUserProgressInput = {
  userId: string;
  skillId: string;
  pointsEarned: number;
};

export async function updateUserProgressAction(input: UpdateUserProgressInput): Promise<void> {
  const { userId, skillId, pointsEarned } = input;

  try {
    const user = await getUserProfile(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Calculate new total points and level
    const newTotalPoints = (user.profile.totalPoints || 0) + pointsEarned;
    const newLevel = Math.floor(newTotalPoints / 100) + 1;

    // Update competence
    const currentCompetence = user.competences[skillId] || { level: 0, completed: false };
    const newCompetenceLevel = currentCompetence.level + 1;
    const isCompleted = newCompetenceLevel >= 10; // Complete skill at level 10

    const updatedCompetence: CompetenceStatus = {
      level: newCompetenceLevel,
      completed: isCompleted,
    };

    // Prepare updates
    const updates: Partial<User> = {
      profile: {
        ...user.profile,
        totalPoints: newTotalPoints,
        level: newLevel,
      },
      competences: {
        ...user.competences,
        [skillId]: updatedCompetence,
      },
    };

    await updateUserProfile(userId, updates);

    // If skill is now completed and wasn't before, trigger skill tree expansion
    if (isCompleted && !currentCompetence.completed) {
        console.log(`Competence ${skillId} completed. Triggering skill tree expansion...`);
        await expandSkillTreeAction({
            completedCompetence: skillId,
            userId: userId,
        });
    }

  } catch (error) {
    console.error("Error updating user progress:", error);
    throw new Error("Failed to update user progress.");
  }
}
