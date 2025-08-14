"use server";

import { generateQuizQuestion } from "@/ai/flows/generate-quiz-question";
import { generateExplanation } from "@/ai/flows/generate-explanation";
import { expandSkillTree } from "@/ai/flows/expand-skill-tree";
import { type GenerateQuizQuestionInput, type GenerateQuizQuestionOutput } from "@/ai/schemas/generate-quiz-question-schemas";
import { type GenerateExplanationInput, type GenerateExplanationOutput } from "@/ai/schemas/generate-explanation-schemas";
import { type ExpandSkillTreeInput, type ExpandSkillTreeOutput } from "@/ai/schemas/expand-skill-tree-schemas";
import { getUserProfile, updateUserProfile } from "@/lib/auth";
import { saveSkillsToFirestore } from "@/lib/firestore";
import { hybridQuizService } from "@/lib/hybrid-quiz-service";
import type { User, CompetenceStatus, Skill, DailyQuizChallenge, QuizPath } from "@/lib/types";
import { ZodError } from "zod";
import { resilientAIService, PerformanceMonitor } from "@/lib/resilient-ai-service";
import { logger } from "@/lib/logger";

export type { GenerateQuizQuestionInput, GenerateQuizQuestionOutput };
export type { GenerateExplanationInput, GenerateExplanationOutput };
export type { ExpandSkillTreeInput, ExpandSkillTreeOutput };

export async function generateQuizQuestionAction(input: GenerateQuizQuestionInput): Promise<GenerateQuizQuestionOutput> {
  const monitor = PerformanceMonitor.measureAIOperation('generateQuestion');
  
  try {
    const result = await resilientAIService.generateQuestion(input);
    monitor.end(true);
    // Ensure compatibility with GenerateQuizQuestionOutput type
    return {
      question: result.question,
      options: [...result.options], // Convert readonly array to mutable array
      correctAnswer: result.correctAnswer,
      explanation: result.explanation,
    };
  } catch (error) {
    monitor.end(false);
    logger.error("AI quiz question generation failed", {
      action: 'generate_quiz_question',
      error: error instanceof Error ? error.message : String(error)
    });
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
    logger.error("AI explanation generation failed", {
      action: 'generate_explanation',
      error: error instanceof Error ? error.message : String(error)
    });
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
    logger.info("Skill tree expanded successfully", {
      action: 'expand_skill_tree',
      skillCount: result.newSkills.length,
      context: { newSkills: result.newSkills.map(s => s.name || 'unnamed') }
    });
    return result;
  } catch (error) {
    monitor.end(false);
    logger.error("Skill tree expansion failed", {
      action: 'expand_skill_tree',
      error: error instanceof Error ? error.message : String(error)
    });
    
    // Provide a more graceful fallback - don't throw error that breaks user progress
    logger.warn("Graceful fallback: skill tree expansion failed, user progress preserved", {
      action: 'expand_skill_tree_fallback'
    });
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
        logger.skillProgress(skillId, userId, true, {
          context: { triggeredExpansion: true }
        });
        await expandSkillTreeAction({
            completedCompetence: skillId,
            userId: userId,
        });
    }

  } catch (error) {
    logger.error("User progress update failed", {
      userId,
      skillId,
      action: 'update_user_progress',
      error: error instanceof Error ? error.message : String(error)
    });
    throw new Error("Failed to update user progress.");
  }
}

// Actions pour le système de parcours de quiz

export async function getDailyQuizChallengeAction(userId: string): Promise<DailyQuizChallenge | null> {
  try {
    return await hybridQuizService.getDailyChallenge(userId);
  } catch (error) {
    logger.error("Failed to get daily quiz challenge", {
      action: 'get_daily_challenge',
      userId,
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

export async function completeDailyChallengeAction(challengeId: string, score: number): Promise<void> {
  try {
    await hybridQuizService.completeDailyChallenge(challengeId, score);
  } catch (error) {
    logger.error("Failed to complete daily challenge", {
      action: 'complete_daily_challenge',
      error: error instanceof Error ? error.message : String(error),
      context: { challengeId }
    });
    throw new Error("Failed to complete daily challenge");
  }
}

export type GenerateQuizPathInput = {
  userId: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  userSkills: string[];
};

export async function generateQuizPathAction(input: GenerateQuizPathInput): Promise<QuizPath> {
  const { userId, difficulty, userSkills } = input;
  
  try {
    return await hybridQuizService.generateDynamicQuizPath(userId, userSkills, difficulty);
  } catch (error) {
    logger.error("Failed to generate quiz path", {
      action: 'generate_quiz_path',
      userId,
      error: error instanceof Error ? error.message : String(error)
    });
    throw new Error("Failed to generate quiz path");
  }
}
