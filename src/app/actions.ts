"use server";

import { generateQuizQuestion, type GenerateQuizQuestionInput, type GenerateQuizQuestionOutput } from "@/ai/flows/generate-quiz-question";
import { ZodError } from "zod";

export async function generateQuizQuestionAction(input: GenerateQuizQuestionInput): Promise<GenerateQuizQuestionOutput> {
  try {
    console.log("Generating question for:", input.competenceId);
    
    // In a real app, you might add more complex logic, caching, or validation here.
    const question = await generateQuizQuestion(input);

    if (!question || !question.question) {
        throw new Error("AI failed to generate a valid question.");
    }
    
    console.log("Generated question:", question.question);
    return question;

  } catch (e) {
    console.error("Error in generateQuizQuestionAction:", e);
    if (e instanceof ZodError) {
      throw new Error(`Invalid data from AI model: ${e.message}`);
    }
    // For now, return a mock question on failure to avoid breaking the UI
    // In production, you'd want more robust error handling.
    return {
      question: `What is the core purpose of HTML in web development?`,
      options: [
        "To define the structure and content of a web page.",
        "To style the visual presentation of a web page.",
        "To handle user interactions and dynamic content.",
        "To manage server-side logic and databases."
      ],
      correctAnswer: 0,
      explanation: "HTML (HyperText Markup Language) is the standard markup language for documents designed to be displayed in a web browser. It provides the fundamental structure of web pages."
    };
  }
}
