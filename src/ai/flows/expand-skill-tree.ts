'use server';

/**
 * @fileOverview AI agent that expands the skill tree with new branches based on community activity and user requests.
 */

import { ai } from '@/ai/genkit';
import { 
  ExpandSkillTreeInputSchema,
  ExpandSkillTreeOutputSchema,
  type ExpandSkillTreeInput,
  type ExpandSkillTreeOutput 
} from '@/ai/schemas/expand-skill-tree-schemas';

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
