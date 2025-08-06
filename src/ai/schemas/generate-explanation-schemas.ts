/**
 * Schemas pour generate-explanation (pas "use server")
 */

import { z } from 'genkit';

export const GenerateExplanationInputSchema = z.object({
  question: z.string().describe('The quiz question that was answered incorrectly.'),
  answer: z.string().describe('The incorrect answer provided by the user.'),
  correctAnswer: z.string().describe('The correct answer to the question.'),
  topic: z.string().describe('The topic of the quiz question.'),
});

export type GenerateExplanationInput = z.infer<typeof GenerateExplanationInputSchema>;

export const GenerateExplanationOutputSchema = z.object({
  explanation: z.string().describe('The AI-generated explanation of the correct answer and underlying concepts.'),
});

export type GenerateExplanationOutput = z.infer<typeof GenerateExplanationOutputSchema>;