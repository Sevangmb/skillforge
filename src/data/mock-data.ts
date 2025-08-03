
import type { Skill, User } from "@/lib/types";

const skills: Skill[] = [
  { id: 'programmation', name: 'Programmation', description: 'Logique, algorithmes et langages.', icon: 'Code', cost: 0, category: 'Tech', position: { x: 50, y: 150 }, prereqs: [], level: 1, isSecret: false },
  { id: 'maths', name: 'Mathématiques', description: 'Nombres, structures et formes.', icon: 'Cpu', cost: 0, category: 'Sciences', position: { x: 250, y: 150 }, prereqs: [], level: 1, isSecret: false },
  { id: 'geographie', name: 'Géographie', description: 'Cartes, pays et paysages.', icon: 'Cloud', cost: 0, category: 'Culture', position: { x: 450, y: 150 }, prereqs: [], level: 1, isSecret: false },
  { id: 'cuisine', name: 'Cuisine', description: 'Recettes, techniques et saveurs.', icon: 'Database', cost: 0, category: 'Arts', position: { x: 150, y: 350 }, prereqs: [], level: 1, isSecret: false },
  { id: 'francais', name: 'Français', description: 'Grammaire, orthographe et littérature.', icon: 'GitBranch', cost: 0, category: 'Langues', position: { x: 350, y: 350 }, prereqs: [], level: 1, isSecret: false },
];

const users: User[] = [
  {
    id: 'user1',
    profile: { displayName: 'Alex Nova', email: 'alex@example.com', totalPoints: 1250, level: 15 },
    competences: {
      'programmation': { level: 10, completed: false },
    },
    preferences: { learningStyle: 'Visual', favoriteTopics: ['Frontend', 'AI'], adaptiveMode: 'Focus', language: 'fr' }
  },
  {
    id: 'user2',
    profile: { displayName: 'CyberLearner', email: 'cyber@example.com', totalPoints: 980, level: 12 },
    competences: {},
    preferences: { learningStyle: 'Kinaesthetic', favoriteTopics: ['Backend'], adaptiveMode: 'Default', language: 'en' }
  },
  {
    id: 'user3',
    profile: { displayName: 'DataDiva', email: 'data@example.com', totalPoints: 1500, level: 18 },
    competences: {},
    preferences: { learningStyle: 'Auditory', favoriteTopics: ['Databases', 'AI'], adaptiveMode: 'Objective', language: 'es' }
  }
];

export const getSkillTree = (): Skill[] => skills;
export const getUsers = (): User[] => users.sort((a, b) => b.profile.totalPoints - a.profile.totalPoints);
