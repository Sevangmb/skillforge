"use server";

import { generateQuizQuestion, type GenerateQuizQuestionInput, type GenerateQuizQuestionOutput } from "@/ai/flows/generate-quiz-question";
import { generateExplanation, type GenerateExplanationInput, type GenerateExplanationOutput } from "@/ai/flows/generate-explanation";
import { expandSkillTree, type ExpandSkillTreeInput, type ExpandSkillTreeOutput } from "@/ai/flows/expand-skill-tree";
import { getUserProfile, updateUserProfile } from "@/lib/auth";
import { saveSkillsToFirestore } from "@/lib/firestore";
import type { User, CompetenceStatus, Skill } from "@/lib/types";
import { ZodError } from "zod";

export type { GenerateQuizQuestionInput, GenerateQuizQuestionOutput };
export type { GenerateExplanationInput, GenerateExplanationOutput };
export type { ExpandSkillTreeInput, ExpandSkillTreeOutput };

export async function generateQuizQuestionAction(input: GenerateQuizQuestionInput): Promise<GenerateQuizQuestionOutput> {
  try {
    const result = await generateQuizQuestion(input);
    return result;
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("Validation error calling Genkit flow:", error.errors);
      throw new Error("AI response validation failed.");
    }
    console.error("Error calling Genkit flow:", error);
    throw new Error("Failed to generate quiz question.");
  }
}

export async function generateExplanationAction(input: GenerateExplanationInput): Promise<GenerateExplanationOutput> {
  try {
    const result = await generateExplanation(input);
    return result;
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("Validation error calling Genkit flow:", error.errors);
      throw new Error("AI response validation failed.");
    }
    console.error("Error calling Genkit flow:", error);
    throw new Error("Failed to generate explanation.");
  }
}

export async function expandSkillTreeAction(input: ExpandSkillTreeInput): Promise<ExpandSkillTreeOutput> {
    try {
        const result = await expandSkillTree(input);
        // Here, you would typically save the new skills to Firestore
        // For now, we'll just log them.
        console.log("New skills generated:", result.newSkills);
        return result;
    } catch (error) {
        if (error instanceof ZodError) {
            console.error("Validation error calling expandSkillTree flow:", error.errors);
            throw new Error("AI response validation failed for skill tree expansion.");
        }
        console.error("Error calling expandSkillTree flow:", error);
        throw new Error("Failed to expand skill tree.");
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
