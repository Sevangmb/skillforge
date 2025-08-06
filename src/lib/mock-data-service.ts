/**
 * Service de données mockées pour contourner les problèmes Firebase
 * Utilisé en mode développement quand Firebase n'est pas configuré
 */

import type { QuizPath, QuizStep, DailyQuizChallenge, QuizQuestion } from './types';
import { logger } from './logger';

export class MockDataService {
  private static instance: MockDataService;
  
  static getInstance(): MockDataService {
    if (!MockDataService.instance) {
      MockDataService.instance = new MockDataService();
    }
    return MockDataService.instance;
  }

  private constructor() {
    logger.info('MockDataService initialized', {
      action: 'mock_service_init',
      context: { mode: 'development_fallback' }
    });
  }

  // Données mockées pour les parcours de quiz
  private mockQuizPaths: QuizPath[] = [
    {
      id: 'path-javascript-001',
      title: 'Maîtrise JavaScript ES6+',
      description: 'Approfondissez vos connaissances des fonctionnalités modernes de JavaScript',
      category: 'programming',
      difficulty: 'intermediate',
      estimatedDuration: 45,
      totalSteps: 6,
      currentStep: 2,
      isCompleted: false,
      unlockDate: new Date(),
      createdByAI: true,
      tags: ['javascript', 'es6', 'modern']
    },
    {
      id: 'path-react-hooks-001',
      title: 'React Hooks Avancés',
      description: 'Maîtrisez useEffect, useContext, et les hooks personnalisés',
      category: 'frontend',
      difficulty: 'advanced',
      estimatedDuration: 60,
      totalSteps: 8,
      currentStep: 0,
      isCompleted: false,
      unlockDate: new Date(),
      createdByAI: true,
      tags: ['react', 'hooks', 'advanced']
    },
    {
      id: 'path-typescript-001',
      title: 'TypeScript pour Débutants',
      description: 'Ajoutez la sécurité des types à votre code JavaScript',
      category: 'programming',
      difficulty: 'beginner',
      estimatedDuration: 30,
      totalSteps: 4,
      currentStep: 4,
      isCompleted: true,
      unlockDate: new Date(Date.now() - 86400000), // Hier
      createdByAI: true,
      tags: ['typescript', 'types', 'basics']
    }
  ];

  // Étapes mockées pour les quiz
  private mockQuizSteps: QuizStep[] = [
    {
      id: 'step-js-001-1',
      pathId: 'path-javascript-001',
      stepNumber: 1,
      type: 'lesson',
      title: 'Introduction aux Arrow Functions',
      content: `# Les Arrow Functions en JavaScript

Les arrow functions sont une syntaxe moderne pour écrire des fonctions en JavaScript.

## Syntaxe de base
\`\`\`javascript
// Fonction traditionnelle
function add(a, b) {
  return a + b;
}

// Arrow function
const add = (a, b) => a + b;
\`\`\`

## Avantages
- Syntaxe plus courte
- Binding automatique du contexte \`this\`
- Idéales pour les callbacks`,
      isCompleted: true,
      attempts: 1,
      maxAttempts: 3,
      pointsReward: 20
    },
    {
      id: 'step-js-001-2',
      pathId: 'path-javascript-001',
      stepNumber: 2,
      type: 'quiz',
      title: 'Quiz: Arrow Functions',
      questions: [
        {
          question: 'Quelle est la syntaxe correcte pour une arrow function qui retourne la somme de deux nombres ?',
          options: [
            'const sum = (a, b) => { return a + b; }',
            'const sum = (a, b) => a + b',
            'const sum = (a, b) -> a + b',
            'Les réponses A et B sont correctes'
          ],
          correctAnswer: 3,
          explanation: 'Les deux syntaxes sont valides : avec ou sans accolades pour un retour simple.'
        },
        {
          question: 'Dans quel cas une arrow function ne peut PAS remplacer une fonction traditionnelle ?',
          options: [
            'Quand on utilise des paramètres',
            'Quand on a besoin de hoisting',
            'Quand on retourne une valeur',
            'Quand on utilise des callbacks'
          ],
          correctAnswer: 1,
          explanation: 'Les arrow functions ne sont pas hoistées, contrairement aux fonctions traditionnelles.'
        }
      ],
      isCompleted: false,
      attempts: 0,
      maxAttempts: 3,
      pointsReward: 35
    }
  ];

  // Défi quotidien mocké
  private mockDailyChallenge: DailyQuizChallenge = {
    id: 'daily-' + new Date().toISOString().split('T')[0],
    date: new Date().toISOString().split('T')[0],
    userId: 'mock-user',
    pathId: 'path-javascript-001',
    stepId: 'step-js-001-2',
    isCompleted: false,
    streakCount: 3,
    bonusPointsEarned: 0
  };

  /**
   * Simule la génération d'un nouveau parcours de quiz
   */
  async generateDynamicQuizPath(userId: string, userSkills: string[], difficulty: 'beginner' | 'intermediate' | 'advanced'): Promise<QuizPath> {
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 1000));

    const topics = [
      'Node.js APIs', 'Vue.js Composition', 'Python Flask', 
      'CSS Grid', 'WebAssembly', 'GraphQL'
    ];
    
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    
    const newPath: QuizPath = {
      id: `path-generated-${Date.now()}`,
      title: `Parcours ${randomTopic}`,
      description: `Approfondissez vos connaissances en ${randomTopic} avec ce parcours adaptatif généré par IA`,
      category: difficulty === 'beginner' ? 'basics' : 'advanced',
      difficulty,
      estimatedDuration: difficulty === 'beginner' ? 30 : difficulty === 'intermediate' ? 45 : 60,
      totalSteps: difficulty === 'beginner' ? 4 : difficulty === 'intermediate' ? 6 : 8,
      currentStep: 0,
      isCompleted: false,
      unlockDate: new Date(),
      createdByAI: true,
      tags: [randomTopic.toLowerCase().replace(/\s+/g, ''), 'generated']
    };

    // Ajouter à la liste mockée
    this.mockQuizPaths.unshift(newPath);

    logger.info('Mock quiz path generated', {
      action: 'mock_generate_path',
      context: { pathId: newPath.id, topic: randomTopic }
    });

    return newPath;
  }

  /**
   * Récupère le défi quotidien (mocké)
   */
  async getDailyChallenge(userId: string): Promise<DailyQuizChallenge | null> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.mockDailyChallenge;
  }

  /**
   * Marque un défi comme terminé
   */
  async completeDailyChallenge(challengeId: string, score: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    this.mockDailyChallenge.isCompleted = true;
    this.mockDailyChallenge.completedAt = new Date();
    this.mockDailyChallenge.score = score;
    this.mockDailyChallenge.bonusPointsEarned = score >= 90 ? 50 : score >= 80 ? 30 : 20;

    logger.info('Mock daily challenge completed', {
      action: 'mock_complete_challenge',
      context: { challengeId, score }
    });
  }

  /**
   * Récupère les parcours actifs
   */
  async getActivePaths(limit: number = 3): Promise<QuizPath[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.mockQuizPaths.filter(path => !path.isCompleted).slice(0, limit);
  }

  /**
   * Récupère les détails d'une étape
   */
  async getStepDetails(stepId: string): Promise<QuizStep | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.mockQuizSteps.find(step => step.id === stepId) || null;
  }

  /**
   * Vérifie si le mode mock est actif
   */
  isInMockMode(): boolean {
    return true;
  }
}

// Export de l'instance singleton
export const mockDataService = MockDataService.getInstance();