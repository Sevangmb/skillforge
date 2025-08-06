/**
 * Schemas pour expand-skill-tree (pas "use server")
 */

import { z } from 'genkit';

export const ExpandSkillTreeInputSchema = z.object({
  completedCompetence: z.string().describe('The ID of the competence that was just completed.'),
  userId: z.string().describe('The ID of the user who completed the competence.'),
  userRequest: z.string().optional().describe('An optional request from the user for a new branch.'),
});

export type ExpandSkillTreeInput = z.infer<typeof ExpandSkillTreeInputSchema>;

export const NewSkillSchema = z.object({
  name: z.string().describe('The name of the new skill.'),
  description: z.string().describe('A short description of the new skill.'),
  icon: z.string().describe('An emoji representing the skill.'),
  cost: z.number().describe('The cost of the skill in points.'),
  category: z.string().describe('The category of the skill.'),
  prerequisites: z.array(z.string()).describe('An array of skill IDs that are prerequisites for this skill.'),
});

export const ExpandSkillTreeOutputSchema = z.object({
  newSkills: z.array(NewSkillSchema).describe('An array of new skills to add to the skill tree.'),
});

export type ExpandSkillTreeOutput = z.infer<typeof ExpandSkillTreeOutputSchema>;