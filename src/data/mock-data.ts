
import type { Skill, User } from "@/lib/types";

const skills: Skill[] = [
  // Level 1: Disciplines de base
  { id: 'maths', name: 'Mathématiques', description: 'La science des nombres et des formes.', icon: 'Cpu', cost: 10, category: 'Sciences Fondamentales', position: { x: 350, y: 50 }, prereqs: [], level: 1, isSecret: false },
  { id: 'physique', name: 'Physique', description: 'L\'étude de la matière et de l\'énergie.', icon: 'Atom', cost: 10, category: 'Sciences Fondamentales', position: { x: 550, y: 50 }, prereqs: [], level: 1, isSecret: false },
  { id: 'chimie', name: 'Chimie', description: 'La science des substances.', icon: 'FlaskConical', cost: 10, category: 'Sciences Fondamentales', position: { x: 150, y: 250 }, prereqs: [], level: 1, isSecret: false },
  { id: 'biologie', name: 'Biologie', description: 'L\'étude du vivant.', icon: 'Dna', cost: 10, category: 'Sciences Fondamentales', position: { x: 350, y: 250 }, prereqs: [], level: 1, isSecret: false },
  { id: 'informatique', name: 'Informatique', description: 'Le traitement de l\'information.', icon: 'Code', cost: 10, category: 'Technologie', position: { x: 550, y: 250 }, prereqs: [], level: 1, isSecret: false },
  { id: 'histoire', name: 'Histoire', description: 'L\'étude du passé.', icon: 'Scroll', cost: 10, category: 'Sciences Humaines', position: { x: 750, y: 250 }, prereqs: [], level: 1, isSecret: false },
  { id: 'langues', name: 'Langues', description: 'L\'art de la communication.', icon: 'Languages', cost: 10, category: 'Sciences Humaines', position: { x: 150, y: 450 }, prereqs: [], level: 1, isSecret: false },
  { id: 'geographie', name: 'Géographie', description: 'La description de la Terre.', icon: 'Globe', cost: 10, category: 'Sciences Humaines', position: { x: 750, y: 50 }, prereqs: [], level: 1, isSecret: false },

  // Level 2: Combinaisons intermédiaires
  { id: 'mecanique', name: 'Mécanique', description: 'L\'étude du mouvement et des forces.', icon: 'Cog', cost: 25, category: 'Physique Appliquée', position: { x: 450, y: 150 }, prereqs: ['maths', 'physique'], level: 2, isSecret: false },
  { id: 'genetique', name: 'Génétique', description: 'L\'étude de l\'hérédité.', icon: 'Helix', cost: 25, category: 'Biologie Appliquée', position: { x: 250, y: 350 }, prereqs: ['biologie', 'chimie'], level: 2, isSecret: false },
  { id: 'ia', name: 'Intelligence Artificielle', description: 'Créer des machines intelligentes.', icon: 'BrainCircuit', cost: 25, category: 'Informatique Avancée', position: { x: 450, y: 350 }, prereqs: ['informatique', 'maths'], level: 2, isSecret: false },
  { id: 'geopolitique', name: 'Géopolitique', description: 'Relations de pouvoir dans le monde.', icon: 'Landmark', cost: 25, category: 'Relations Internationales', position: { x: 750, y: 150 }, prereqs: ['histoire', 'geographie'], level: 2, isSecret: false },
  { id: 'linguistique', name: 'Linguistique Historique', description: 'L\'évolution des langues.', icon: 'Milestone', cost: 25, category: 'Histoire des Langues', position: { x: 450, y: 450 }, prereqs: ['langues', 'histoire'], level: 2, isSecret: false },

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
