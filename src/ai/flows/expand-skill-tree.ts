'use server';

/**
 * @fileOverview AI agent that expands the skill tree with new branches based on community activity and user requests.
 *
 * - expandSkillTree - A function that handles the skill tree expansion process.
 * - ExpandSkillTreeInput - The input type for the expandSkillTree function.
 * - ExpandSkillTreeOutput - The return type for the expandSkillTree function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExpandSkillTreeInputSchema = z.object({
  completedCompetence: z.string().describe('The ID of the competence that was just completed.'),
  userId: z.string().describe('The ID of the user who completed the competence.'),
  userRequest: z.string().optional().describe('An optional request from the user for a new branch.'),
});
export type ExpandSkillTreeInput = z.infer<typeof ExpandSkillTreeInputSchema>;

const NewSkillSchema = z.object({
  name: z.string().describe('The name of the new skill.'),
  description: z.string().describe('A short description of the new skill.'),
  icon: z.string().describe('An emoji representing the skill.'),
  cost: z.number().describe('The cost of the skill in points.'),
  category: z.string().describe('The category of the skill.'),
  prerequisites: z.array(z.string()).describe('An array of skill IDs that are prerequisites for this skill.'),
});

const ExpandSkillTreeOutputSchema = z.object({
  newSkills: z.array(NewSkillSchema).describe('An array of new skills to add to the skill tree.'),
});
export type ExpandSkillTreeOutput = z.infer<typeof ExpandSkillTreeOutputSchema>;

export async function expandSkillTree(input: ExpandSkillTreeInput): Promise<ExpandSkillTreeOutput> {
  return expandSkillTreeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'expandSkillTreePrompt',
  input: {schema: ExpandSkillTreeInputSchema},
  output: {schema: ExpandSkillTreeOutputSchema},
  prompt: `You are an AI that expands a skill tree for an educational platform.

  The skill tree is a collaborative, community-driven learning resource.
  When a user completes a competence, or makes a request, you generate new skills to add to the tree.

  Completed Competence: {{{completedCompetence}}}
  User ID: {{{userId}}}
  User Request: {{#if userRequest}}{{{userRequest}}}{{else}}None{{/if}}

  Based on this information, generate new skills that would logically follow the completed competence or fulfill the user request. Consider community activity and emerging trends in the subject area.

  Output an array of new skills, each with a name, description, icon, cost, category, and prerequisites.
  `,
});

const expandSkillTreeFlow = ai.defineFlow(
  {
    name: 'expandSkillTreeFlow',
    inputSchema: ExpandSkillTreeInputSchema,
    outputSchema: ExpandSkillTreeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
