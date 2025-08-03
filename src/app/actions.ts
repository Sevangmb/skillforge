"use server";

import { generateQuizQuestion, type GenerateQuizQuestionInput, type GenerateQuizQuestionOutput } from "@/ai/flows/generate-quiz-question";
import { ZodError } from "zod";

export type { GenerateQuizQuestionInput, GenerateQuizQuestionOutput };

export async function generateQuizQuestionAction(input: GenerateQuizQuestionInput): Promise<GenerateQuizQuestionOutput> {
  try {
    // Call the real Genkit flow
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
