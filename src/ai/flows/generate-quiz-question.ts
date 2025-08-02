'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating quiz questions tailored to a user's skill level and selected skill.
 *
 * - generateQuizQuestion - A function that generates a quiz question based on the provided input.
 * - GenerateQuizQuestionInput - The input type for the generateQuizQuestion function.
 * - GenerateQuizQuestionOutput - The return type for the generateQuizQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuizQuestionInputSchema = z.object({
  competenceId: z.string().describe('The ID of the competence for which to generate a question.'),
  userId: z.string().describe('The ID of the user for whom to generate the question.'),
  userLevel: z.number().describe('The user level (0-100) in the specified competence.'),
  learningStyle: z.string().describe('The learning style of the user.'),
});
export type GenerateQuizQuestionInput = z.infer<typeof GenerateQuizQuestionInputSchema>;

const GenerateQuizQuestionOutputSchema = z.object({
  question: z.string().describe('The generated quiz question.'),
  options: z.array(z.string()).describe('The options for the quiz question.'),
  correctAnswer: z.number().describe('The index of the correct answer in the options array.'),
  explanation: z.string().describe('A short explanation of the correct answer.'),
});
export type GenerateQuizQuestionOutput = z.infer<typeof GenerateQuizQuestionOutputSchema>;

export async function generateQuizQuestion(input: GenerateQuizQuestionInput): Promise<GenerateQuizQuestionOutput> {
  return generateQuizQuestionFlow(input);
}

const generateQuizQuestionPrompt = ai.definePrompt({
  name: 'generateQuizQuestionPrompt',
  input: {schema: GenerateQuizQuestionInputSchema},
  output: {schema: GenerateQuizQuestionOutputSchema},
  prompt: `Génère une question éducative pour:
    - Compétence: {{{competenceId}}}
    - Niveau utilisateur: {{{userLevel}}}/100
    - Style d'apprentissage: {{{learningStyle}}}

    Format JSON requis:
    {
      "question": "Question claire et précise",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Explication courte si échec"
    }`,
});

const generateQuizQuestionFlow = ai.defineFlow(
  {
    name: 'generateQuizQuestionFlow',
    inputSchema: GenerateQuizQuestionInputSchema,
    outputSchema: GenerateQuizQuestionOutputSchema,
  },
  async input => {
    const {output} = await generateQuizQuestionPrompt(input);
    return output!;
  }
);
