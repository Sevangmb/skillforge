'use server';

/**
 * @fileOverview AI flow for generating 3 specialized quizzes after completing a quiz successfully.
 * Creates deeper learning paths in related domains for skill tree progression.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateSpecializedQuizzesInputSchema = z.object({
  completedSkillId: z.string().describe('The ID of the skill that was just completed successfully.'),
  userId: z.string().describe('The ID of the user who completed the skill.'),
  userLevel: z.number().describe('The current level of the user (0-100).'),
  userPreferences: z.object({
    learningStyle: z.string().describe('The learning style of the user (Visual, Auditory, Kinesthetic).'),
    favoriteTopics: z.array(z.string()).describe('Array of favorite topics of the user.'),
    language: z.string().describe('Preferred language for the quizzes.')
  }).describe('User preferences and learning context.'),
  completedSkillDetails: z.object({
    name: z.string().describe('Name of the completed skill.'),
    category: z.string().describe('Category of the completed skill.'),
    description: z.string().describe('Description of the completed skill.')
  }).describe('Details about the skill that was completed.'),
});
export type GenerateSpecializedQuizzesInput = z.infer<typeof GenerateSpecializedQuizzesInputSchema>;

const SpecializedQuizSchema = z.object({
  id: z.string().describe('Unique identifier for this specialized quiz.'),
  name: z.string().describe('Name of the specialized quiz.'),
  description: z.string().describe('Description explaining what this quiz focuses on.'),
  category: z.string().describe('Category/domain of specialization.'),
  icon: z.string().describe('Emoji icon representing this specialization.'),
  difficulty: z.enum(['intermediate', 'advanced', 'expert']).describe('Difficulty level of this specialization.'),
  estimatedTime: z.number().describe('Estimated time to complete in minutes.'),
  prerequisites: z.array(z.string()).describe('Array of skill IDs that are prerequisites.'),
  specialization: z.object({
    domain: z.string().describe('Specific domain of specialization.'),
    depth: z.string().describe('How deep this specialization goes (foundational, applied, mastery).'),
    practicalApplications: z.array(z.string()).describe('Real-world applications of this specialization.'),
    nextSteps: z.array(z.string()).describe('What skills naturally follow after this one.')
  }).describe('Specialization details and progression path.'),
  cost: z.number().describe('Point cost to unlock this specialization (50-200).'),
  unlockMessage: z.string().describe('Motivational message shown when this quiz is unlocked.')
});

const GenerateSpecializedQuizzesOutputSchema = z.object({
  specializedQuizzes: z.array(SpecializedQuizSchema).length(3).describe('Exactly 3 specialized quizzes for skill tree progression.'),
  progressionRationale: z.string().describe('Explanation of how these 3 quizzes create a coherent learning progression.'),
  unlockCelebration: z.object({
    title: z.string().describe('Celebratory title for completing the quiz.'),
    message: z.string().describe('Encouraging message about the new opportunities unlocked.'),
    motivationalQuote: z.string().describe('An inspiring quote related to learning and growth.')
  }).describe('Celebration message for completing the initial quiz.')
});
export type GenerateSpecializedQuizzesOutput = z.infer<typeof GenerateSpecializedQuizzesOutputSchema>;

export async function generateSpecializedQuizzes(input: GenerateSpecializedQuizzesInput): Promise<GenerateSpecializedQuizzesOutput> {
  return generateSpecializedQuizzesFlow(input);
}

const generateSpecializedQuizzesPrompt = ai.definePrompt({
  name: 'generateSpecializedQuizzesPrompt',
  input: { schema: GenerateSpecializedQuizzesInputSchema },
  output: { schema: GenerateSpecializedQuizzesOutputSchema },
  prompt: `You are an AI learning specialist who creates personalized skill progression paths. 

A user has just successfully completed: "{{{completedSkillDetails.name}}}" in the category "{{{completedSkillDetails.category}}}"

User Context:
- User ID: {{{userId}}}
- User Level: {{{userLevel}}}/100
- Learning Style: {{{userPreferences.learningStyle}}}
- Favorite Topics: {{#each userPreferences.favoriteTopics}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
- Language: {{{userPreferences.language}}}

Mission: Generate exactly 3 specialized quizzes that represent natural progressions from the completed skill. These should create branching paths in the skill tree, each focusing on a different aspect or application of the foundational knowledge.

Guidelines:
1. **Coherent Progression**: Each quiz should build meaningfully on the completed skill
2. **Diverse Specializations**: The 3 quizzes should explore different aspects/applications
3. **Increasing Depth**: Progress from foundational → applied → mastery levels
4. **Practical Relevance**: Connect to real-world applications and career paths
5. **User Alignment**: Consider the user's learning style and favorite topics
6. **Engaging Content**: Create compelling descriptions that motivate learning

Specialization Strategy:
- Quiz 1: **Foundational Extension** - Deeper dive into core concepts
- Quiz 2: **Applied Knowledge** - Practical applications and use cases  
- Quiz 3: **Advanced Mastery** - Expert-level concepts and innovation

Each quiz should:
- Have a unique, memorable name
- Clear value proposition in description
- Appropriate difficulty progression (intermediate → advanced → expert)
- Realistic time estimates (15-45 minutes)
- Meaningful prerequisites
- Inspiring unlock messages

Output in {{{userPreferences.language}}} language.`,
});

const generateSpecializedQuizzesFlow = ai.defineFlow(
  {
    name: 'generateSpecializedQuizzesFlow',
    inputSchema: GenerateSpecializedQuizzesInputSchema,
    outputSchema: GenerateSpecializedQuizzesOutputSchema,
  },
  async input => {
    const { output } = await generateSpecializedQuizzesPrompt(input);
    return output!;
  }
);