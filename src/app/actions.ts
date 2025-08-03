"use server";

import { generateQuizQuestion, type GenerateQuizQuestionInput, type GenerateQuizQuestionOutput } from "@/ai/flows/generate-quiz-question";
import { generateExplanation, type GenerateExplanationInput, type GenerateExplanationOutput } from "@/ai/flows/generate-explanation";
import { expandSkillTree, type ExpandSkillTreeInput, type ExpandSkillTreeOutput } from "@/ai/flows/expand-skill-tree";
import { getServerUserProfile, updateServerUserProfile, createServerUserProfile } from "@/lib/server-auth";
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
    console.log("Updating user progress:", { userId, skillId, pointsEarned });

    // Vérifier que les paramètres sont valides
    if (!userId || !skillId || pointsEarned === undefined) {
      throw new Error("Invalid input parameters");
    }

    let user = await getServerUserProfile(userId);
    
    // Si l'utilisateur n'existe pas, le créer
    if (!user) {
      console.log("User not found, creating new user profile for:", userId);
      user = await createServerUserProfile(userId);
    }

    console.log("Current user data:", {
      totalPoints: user.profile.totalPoints,
      level: user.profile.level,
      currentCompetence: user.competences[skillId]
    });

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

    console.log("Updated competence data:", {
      skillId,
      oldLevel: currentCompetence.level,
      newCompetenceLevel,
      isCompleted,
      newTotalPoints,
      newUserLevel: newLevel
    });

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

    await updateServerUserProfile(userId, updates);
    console.log("User progress updated successfully");

    // If skill is now completed and wasn't before, trigger skill tree expansion
    if (isCompleted && !currentCompetence.completed) {
      console.log(`Competence ${skillId} completed. Triggering skill tree expansion...`);
      try {
        await expandSkillTreeAction({
          completedCompetence: skillId,
          userId: userId,
        });
      } catch (expansionError) {
        console.warn("Skill tree expansion failed, but user progress was saved:", expansionError);
        // Don't throw here - user progress is more important
      }
    }

  } catch (error) {
    console.error("Error updating user progress:", error);
    // Retourner une erreur plus descriptive
    if (error instanceof Error) {
      throw new Error(`Failed to update user progress: ${error.message}`);
    } else {
      throw new Error("Failed to update user progress: Unknown error");
    }
  }
}

export type GenerateSpecializedQuizzesActionInput = {
  userId: string;
  completedSkillId: string;
  validationScore: number;
};

export type GenerateSpecializedQuizzesActionOutput = {
  success: boolean;
  progression?: any;
  message: string;
};

/**
 * Action pour générer automatiquement 3 quiz spécialisés après succès
 */
export async function generateSpecializedQuizzesAction(
  input: GenerateSpecializedQuizzesActionInput
): Promise<GenerateSpecializedQuizzesActionOutput> {
  try {
    console.log("Generating specialized quizzes for:", input);

    // Valider les paramètres
    if (!input.userId || !input.completedSkillId || input.validationScore < 70) {
      return {
        success: false,
        message: "Invalid parameters or validation score too low for specialization"
      };
    }

    // Récupérer l'utilisateur et le skill
    const user = await getServerUserProfile(input.userId);
    if (!user) {
      return {
        success: false,
        message: "User not found"
      };
    }

    // Récupérer les détails du skill (mock pour l'instant)
    const completedSkill = {
      id: input.completedSkillId,
      name: input.completedSkillId === 'general-knowledge' ? 'Connaissances Générales' : 'Skill',
      description: 'A completed skill',
      category: 'General',
      position: { x: 450, y: 250 }
    };

    // Import dynamique pour éviter les dépendances circulaires
    const { specializedQuizManager } = await import('@/lib/specialized-quiz-system');
    
    const mockValidationResult = {
      isValidated: true,
      validationScore: input.validationScore,
      masteryLevel: 'intermediate',
      feedback: 'Good job!',
      nextRecommendations: {
        difficulty: 2,
        questionCount: 5,
        focusAreas: ['general']
      }
    };

    // Générer la progression
    const progression = await specializedQuizManager.generateProgressionAfterSuccess(
      user,
      completedSkill as any,
      mockValidationResult
    );

    if (progression) {
      return {
        success: true,
        progression,
        message: `Generated ${progression.specializedQuizzes.length} specialized quizzes for skill tree progression`
      };
    } else {
      return {
        success: false,
        message: "Failed to generate specialized quizzes"
      };
    }

  } catch (error) {
    console.error("Error generating specialized quizzes:", error);
    return {
      success: false,
      message: `Failed to generate specialized quizzes: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
