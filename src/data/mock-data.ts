
import type { Skill, User } from "@/lib/types";

const skills: Skill[] = [
  // Point de départ unique de l'arbre de compétences
  { 
    id: 'general-knowledge', 
    name: 'Test de connaissances générales', 
    description: 'Évaluez vos connaissances de base pour débloquer vos premières compétences.', 
    icon: 'BrainCircuit', 
    cost: 0, 
    category: 'Évaluation Initiale', 
    position: { x: 450, y: 250 }, 
    prereqs: [], 
    level: 1, 
    isSecret: false 
  },
];

const users: User[] = [
  {
    id: 'user1',
    profile: { displayName: 'Sev An', email: 'sevans@hotmail.fr', totalPoints: 1250, level: 15, isAdmin: true },
    competences: {
      'maths': { level: 10, completed: true },
      'physique': { level: 8, completed: true },
      'informatique': { level: 12, completed: true },
      'chimie': { level: 5, completed: true },
      'biologie': { level: 7, completed: true },
    },
    preferences: { learningStyle: 'Visual', favoriteTopics: ['Frontend', 'AI'], adaptiveMode: 'Focus', language: 'fr' }
  },
  {
    id: 'user2',
    profile: { displayName: 'CyberLearner', email: 'cyber@example.com', totalPoints: 980, level: 12, isAdmin: false },
    competences: {},
    preferences: { learningStyle: 'Kinaesthetic', favoriteTopics: ['Backend'], adaptiveMode: 'Default', language: 'en' }
  },
  {
    id: 'user3',
    profile: { displayName: 'DataDiva', email: 'data@example.com', totalPoints: 1500, level: 18, isAdmin: false },
    competences: {},
    preferences: { learningStyle: 'Auditory', favoriteTopics: ['Databases', 'AI'], adaptiveMode: 'Objective', language: 'es' }
  }
];

export const getSkillTree = (): Skill[] => skills;
export const getUsers = (): User[] => users.sort((a, b) => b.profile.totalPoints - a.profile.totalPoints);
