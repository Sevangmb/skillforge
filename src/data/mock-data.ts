import type { Skill, User } from "@/lib/types";

const skills: Skill[] = [
  { id: 'html', name: 'HTML Basics', description: 'Learn the foundation of the web.', icon: 'Code', cost: 10, category: 'Web Basics', position: { x: 50, y: 300 }, prereqs: [], level: 1, isSecret: false },
  { id: 'css', name: 'CSS Styling', description: 'Make your websites look beautiful.', icon: 'Code', cost: 15, category: 'Web Basics', position: { x: 250, y: 300 }, prereqs: ['html'], level: 1, isSecret: false },
  { id: 'js_basics', name: 'JavaScript Basics', description: 'Add interactivity to your pages.', icon: 'Code', cost: 20, category: 'Programming', position: { x: 450, y: 300 }, prereqs: ['html', 'css'], level: 1, isSecret: false },
  { id: 'react', name: 'React.js', description: 'Build powerful single-page applications.', icon: 'Code', cost: 50, category: 'Frontend', position: { x: 650, y: 150 }, prereqs: ['js_basics'], level: 2, isSecret: false },
  { id: 'nextjs', name: 'Next.js', description: 'Master server-side rendering with React.', icon: 'Code', cost: 60, category: 'Frontend', position: { x: 850, y: 150 }, prereqs: ['react'], level: 3, isSecret: false },
  { id: 'nodejs', name: 'Node.js', description: 'Run JavaScript on the server.', icon: 'Server', cost: 40, category: 'Backend', position: { x: 650, y: 450 }, prereqs: ['js_basics'], level: 2, isSecret: false },
  { id: 'firestore', name: 'Firestore', description: 'Learn NoSQL databases with Firebase.', icon: 'Database', cost: 45, category: 'Backend', position: { x: 850, y: 450 }, prereqs: ['nodejs'], level: 3, isSecret: false },
  { id: 'cloud_functions', name: 'Cloud Functions', description: 'Serverless computing with Firebase.', icon: 'Cloud', cost: 55, category: 'Backend', position: { x: 1050, y: 450 }, prereqs: ['firestore'], level: 4, isSecret: false },
  { id: 'gen_ai', name: 'Generative AI', description: 'Integrate LLMs into your apps.', icon: 'Cpu', cost: 100, category: 'AI', position: { x: 1250, y: 300 }, prereqs: ['cloud_functions', 'nextjs'], level: 4, isSecret: false },
  { id: 'git', name: 'Git & GitHub', description: 'Version control your projects.', icon: 'GitBranch', cost: 25, category: 'Tools', position: { x: 450, y: 550 }, prereqs: ['js_basics'], level: 1, isSecret: true },
];

const users: User[] = [
  {
    id: 'user1',
    profile: { displayName: 'Alex Nova', email: 'alex@example.com', totalPoints: 1250, level: 15 },
    competences: {
      'html': { level: 100, completed: true },
      'css': { level: 100, completed: true },
      'js_basics': { level: 80, completed: false },
      'react': { level: 20, completed: false },
    },
    preferences: { learningStyle: 'Visual', favoriteTopics: ['Frontend', 'AI'], adaptiveMode: 'Focus' }
  },
  {
    id: 'user2',
    profile: { displayName: 'CyberLearner', email: 'cyber@example.com', totalPoints: 980, level: 12 },
    competences: {},
    preferences: { learningStyle: 'Kinaesthetic', favoriteTopics: ['Backend'], adaptiveMode: 'Default' }
  },
  {
    id: 'user3',
    profile: { displayName: 'DataDiva', email: 'data@example.com', totalPoints: 1500, level: 18 },
    competences: {},
    preferences: { learningStyle: 'Auditory', favoriteTopics: ['Databases', 'AI'], adaptiveMode: 'Objective' }
  }
];

export const getSkillTree = (): Skill[] => skills;
export const getUsers = (): User[] => users.sort((a, b) => b.profile.totalPoints - a.profile.totalPoints);
