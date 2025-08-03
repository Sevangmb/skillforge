
import type { Skill, User } from "@/lib/types";

const skills: Skill[] = [
  { id: 'html', name: 'HTML Basics', description: 'Learn the foundation of the web.', icon: 'Code', cost: 10, category: 'Web Basics', position: { x: 50, y: 300 }, prereqs: [], level: 1, isSecret: false },
  { id: 'css', name: 'CSS Styling', description: 'Make your websites look beautiful.', icon: 'Code', cost: 15, category: 'Web Basics', position: { x: 250, y: 300 }, prereqs: ['html'], level: 1, isSecret: false },
  { id: 'js_basics', name: 'JavaScript Basics', description: 'Add interactivity to your pages.', icon: 'Code', cost: 20, category: 'Programming', position: { x: 450, y: 300 }, prereqs: ['html', 'css'], level: 1, isSecret: false },
  { id: 'git', name: 'Git & GitHub', description: 'Version control for your projects.', icon: 'GitBranch', cost: 25, category: 'Tools', position: { x: 250, y: 500 }, prereqs: ['html'], level: 1, isSecret: false },
];

const users: User[] = [
  {
    id: 'user1',
    profile: { displayName: 'Alex Nova', email: 'alex@example.com', totalPoints: 1250, level: 15 },
    competences: {
      'html': { level: 100, completed: true },
      'css': { level: 100, completed: true },
      'js_basics': { level: 80, completed: false },
    },
    preferences: { learningStyle: 'Visual', favoriteTopics: ['Frontend', 'AI'], adaptiveMode: 'Focus', language: 'en' }
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
    preferences: { learningStyle: 'Auditory', favoriteTopics: ['Databases', 'AI'], adaptiveMode: 'Objective', language: 'en' }
  }
];

export const getSkillTree = (): Skill[] => skills;
export const getUsers = (): User[] => users.sort((a, b) => b.profile.totalPoints - a.profile.totalPoints);
