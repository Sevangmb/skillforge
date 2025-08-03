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
  language: z.string().describe("The user's preferred language (e.g., 'en', 'fr')."),
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
  prompt: `You are an AI tutor creating a quiz for a learning platform. Your goal is to generate an educational question in "{{language}}".

  - Skill being tested: {{{competenceId}}}
  - User's current level in this skill: {{{userLevel}}}/100
  - User's preferred learning style: {{{learningStyle}}}

  Instructions:
  1.  If the competenceId is 'general-knowledge', create a question that assesses broad, foundational knowledge to help determine a starting point for the user's skill tree. The question should be engaging and not overly specific to one domain.
  2.  For any other competenceId, generate a question that is relevant to that specific skill and appropriate for the user's level.
  3.  The question, options, and explanation must all be in "{{language}}".
  4.  Ensure the output is a valid JSON object.

  JSON Output Format:
  {
    "question": "A clear and precise question.",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0, // Index of the correct option
    "explanation": "A brief explanation of the correct answer."
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
