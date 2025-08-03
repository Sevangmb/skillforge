// Temporarily disabled for static export
// "use server";

// import { generateQuizQuestion, type GenerateQuizQuestionInput, type GenerateQuizQuestionOutput } from "@/ai/flows/generate-quiz-question";
// import { ZodError } from "zod";

export type GenerateQuizQuestionInput = {
  competenceId: string;
  userId: string;
  userLevel: number;
  learningStyle: string;
};

export type GenerateQuizQuestionOutput = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

export async function generateQuizQuestionAction(input: GenerateQuizQuestionInput): Promise<GenerateQuizQuestionOutput> {
  // Temporarily return mock data for static export
  // TODO: Implement proper API routes for AI functionality
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
