// src/ai/flows/generate-explanation.ts
'use server';

/**
 * @fileOverview Generates an explanation for a quiz question when the user answers incorrectly.
 *
 * - generateExplanation - A function that generates the explanation.
 * - GenerateExplanationInput - The input type for the generateExplanation function.
 * - GenerateExplanationOutput - The return type for the generateExplanation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateExplanationInputSchema = z.object({
  question: z.string().describe('The quiz question that was answered incorrectly.'),
  answer: z.string().describe('The incorrect answer provided by the user.'),
  correctAnswer: z.string().describe('The correct answer to the question.'),
  topic: z.string().describe('The topic of the quiz question.'),
});
export type GenerateExplanationInput = z.infer<typeof GenerateExplanationInputSchema>;

const GenerateExplanationOutputSchema = z.object({
  explanation: z.string().describe('The AI-generated explanation of the correct answer and underlying concepts.'),
});
export type GenerateExplanationOutput = z.infer<typeof GenerateExplanationOutputSchema>;

export async function generateExplanation(input: GenerateExplanationInput): Promise<GenerateExplanationOutput> {
  return generateExplanationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateExplanationPrompt',
  input: {schema: GenerateExplanationInputSchema},
  output: {schema: GenerateExplanationOutputSchema},
  prompt: `You are an expert tutor, skilled at explaining complex topics in a clear and concise way.

  A user has answered the following quiz question incorrectly. Provide an explanation of the correct answer and the underlying concepts, tailored to their mistake.

  Topic: {{{topic}}}
  Question: {{{question}}}
  Your Answer: {{{answer}}}
  Correct Answer: {{{correctAnswer}}}

  Explanation:`,
});

const generateExplanationFlow = ai.defineFlow(
  {
    name: 'generateExplanationFlow',
    inputSchema: GenerateExplanationInputSchema,
    outputSchema: GenerateExplanationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
