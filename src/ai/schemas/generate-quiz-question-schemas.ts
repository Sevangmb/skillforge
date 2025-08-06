/**
 * Schemas pour generate-quiz-question (pas "use server")
 */

import { z } from 'genkit';

export const GenerateQuizQuestionInputSchema = z.object({
  competenceId: z.string().describe('The ID of the competence for which to generate a question.'),
  userId: z.string().describe('The ID of the user for whom to generate the question.'),
  userLevel: z.number().describe('The user level (0-100) in the specified competence.'),
  learningStyle: z.string().describe('The learning style of the user.'),
  language: z.string().describe("The user's preferred language (e.g., 'en', 'fr')."),
});

export type GenerateQuizQuestionInput = z.infer<typeof GenerateQuizQuestionInputSchema>;

export const GenerateQuizQuestionOutputSchema = z.object({
  question: z.string().describe('The generated quiz question.'),
  options: z.array(z.string()).describe('The options for the quiz question.'),
  correctAnswer: z.number().describe('The index of the correct answer in the options array.'),
  explanation: z.string().describe('A short explanation of the correct answer.'),
});

export type GenerateQuizQuestionOutput = z.infer<typeof GenerateQuizQuestionOutputSchema>;