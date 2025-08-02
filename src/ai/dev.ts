import { config } from 'dotenv';
config();

import '@/ai/flows/generate-explanation.ts';
import '@/ai/flows/expand-skill-tree.ts';
import '@/ai/flows/generate-quiz-question.ts';