// src/ai/flows/generate-explanation.ts
'use server';

/**
 * @fileOverview Generates an explanation for a quiz question when the user answers incorrectly.
 */

import { ai } from '@/ai/genkit';
import { 
  GenerateExplanationInputSchema,
  GenerateExplanationOutputSchema,
  type GenerateExplanationInput,
  type GenerateExplanationOutput 
} from '@/ai/schemas/generate-explanation-schemas';

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
