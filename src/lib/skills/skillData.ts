import type { 
  SkillDomain, 
  SkillLevel, 
  SkillTest, 
  SkillQuestion, 
  UserProgress,
  SkillTestConfiguration
} from '@/lib/types/skills';

// Global configuration for skill testing
export const SKILL_TEST_CONFIG: SkillTestConfiguration = {
  globalSettings: {
    defaultPassingScore: 70,
    maxAttemptsPerTest: 3,
    timePerQuestion: 90,
    pointsPerCorrectAnswer: 10,
    enableHints: true,
    enablePartialCredit: false,
  },
  difficultySettings: {
    easy: { timeMultiplier: 1.5, pointsMultiplier: 0.8 },
    medium: { timeMultiplier: 1.0, pointsMultiplier: 1.0 },
    hard: { timeMultiplier: 0.75, pointsMultiplier: 1.2 },
  },
  progressionRules: {
    minScoreToUnlock: 70,
    allowSkipLevels: false,
    showLockedContent: true,
    retakeDelay: 24, // 24 hours
  },
};

// Domaines généraux visibles au départ - progression simplifiée
export const SKILL_DOMAINS: SkillDomain[] = [
  {
    id: 'web-fundamentals',
    name: 'Développement Web',
    description: 'Apprenez les bases du développement web : HTML, CSS, JavaScript',
    icon: '🌐',
    color: 'bg-blue-500',
    level: 1,
    isVisible: true, // Toujours visible - point d'entrée
    metadata: {
      estimatedHours: 30,
      difficulty: 'beginner',
      tags: ['html', 'css', 'javascript', 'web'],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
    },
  },
  {
    id: 'programming-logic',
    name: 'Logique de Programmation', 
    description: 'Maîtrisez les concepts fondamentaux de la programmation',
    icon: '🧠',
    color: 'bg-indigo-500',
    level: 1,
    isVisible: true, // Visible dès le début - domaine général
    metadata: {
      estimatedHours: 25,
      difficulty: 'beginner',
      tags: ['algorithmique', 'logique', 'programmation', 'bases'],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
    },
  },
  {
    id: 'digital-tools',
    name: 'Outils Numériques',
    description: 'Découvrez les outils essentiels du développeur moderne',
    icon: '🛠️',
    color: 'bg-slate-500',
    level: 1,
    isVisible: true, // Visible dès le début - compétences transversales
    metadata: {
      estimatedHours: 20,
      difficulty: 'beginner',
      tags: ['git', 'terminal', 'editeur', 'outils'],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
    },
  },
  // Domaines spécialisés - cachés au début
  {
    id: 'frontend-frameworks',
    name: 'Frameworks Frontend',
    description: 'Maîtrisez React, Vue et les frameworks modernes',
    icon: '⚛️',
    color: 'bg-cyan-500',
    level: 2,
    isVisible: false, // Débloqué après les fondamentaux
    unlockCriteria: {
      requiredDomains: ['web-fundamentals'],
      requiredPoints: 400,
    },
    metadata: {
      estimatedHours: 40,
      difficulty: 'intermediate',
      tags: ['react', 'vue', 'angular', 'component'],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
    },
  },
  {
    id: 'backend-development',
    name: 'Développement Backend',
    description: 'APIs, bases de données et architecture serveur',
    icon: '🔧',
    color: 'bg-green-500',
    level: 2,
    isVisible: false, // Débloqué après logique + outils
    unlockCriteria: {
      requiredDomains: ['programming-logic', 'digital-tools'],
      requiredPoints: 300,
    },
    metadata: {
      estimatedHours: 50,
      difficulty: 'intermediate',
      tags: ['node', 'api', 'database', 'server'],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
    },
  },
  {
    id: 'fullstack-mastery',
    name: 'Maîtrise Fullstack',
    description: 'Applications complètes end-to-end',
    icon: '🚀',
    color: 'bg-purple-500',
    level: 3,
    isVisible: false, // Débloqué après frontend et backend
    unlockCriteria: {
      requiredDomains: ['frontend-frameworks', 'backend-development'],
      requiredPoints: 1000,
      requiredLevel: 8,
    },
    metadata: {
      estimatedHours: 60,
      difficulty: 'advanced',
      tags: ['fullstack', 'deployment', 'production'],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
    },
  },
];

// Skill levels for web fundamentals domain (example)
export const WEB_FUNDAMENTALS_LEVELS: SkillLevel[] = [
  {
    id: 'html-basics',
    domainId: 'web-fundamentals',
    level: 1,
    name: 'HTML - Les Bases',
    description: 'Structure et sémantique HTML',
    objectives: [
      'Comprendre la structure d\'un document HTML',
      'Utiliser les balises sémantiques appropriées',
      'Créer des formulaires fonctionnels',
      'Maîtriser les attributs essentiels'
    ],
    prerequisites: [], // First level, no prerequisites
    isVisible: true, // Always visible in unlocked domain
    unlockCriteria: {
      previousLevelSuccess: false, // First level
    },
    testConfiguration: {
      questionCount: 15,
      timeLimit: 20, // 20 minutes
      passingScore: 70,
      maxAttempts: 3,
      randomizeQuestions: true,
      randomizeOptions: true,
    },
    rewards: {
      points: 150,
      unlocksNext: true,
      badges: ['html-novice'],
    },
    metadata: {
      estimatedDuration: 25,
      difficulty: 3,
      createdBy: 'system',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
    },
  },
  {
    id: 'css-styling',
    domainId: 'web-fundamentals',
    level: 2,
    name: 'CSS - Mise en Forme',
    description: 'Styles, mise en page et responsive design',
    objectives: [
      'Appliquer des styles CSS efficaces',
      'Comprendre le modèle de boîte',
      'Créer des mises en page flexibles',
      'Maîtriser les bases du responsive design'
    ],
    prerequisites: ['html-basics'],
    isVisible: false, // Unlocked after HTML basics
    unlockCriteria: {
      previousLevelSuccess: true,
      minScore: 70,
    },
    testConfiguration: {
      questionCount: 20,
      timeLimit: 30,
      passingScore: 70,
      maxAttempts: 3,
      randomizeQuestions: true,
      randomizeOptions: true,
    },
    rewards: {
      points: 200,
      unlocksNext: true,
      badges: ['css-stylist'],
    },
    metadata: {
      estimatedDuration: 35,
      difficulty: 4,
      createdBy: 'system',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
    },
  },
  {
    id: 'javascript-fundamentals',
    domainId: 'web-fundamentals',
    level: 3,
    name: 'JavaScript - Fondamentaux',
    description: 'Logique, DOM et événements',
    objectives: [
      'Maîtriser la syntaxe JavaScript',
      'Manipuler le DOM efficacement',
      'Gérer les événements utilisateur',
      'Comprendre les concepts de base (variables, fonctions, objets)'
    ],
    prerequisites: ['css-styling'],
    isVisible: false,
    unlockCriteria: {
      previousLevelSuccess: true,
      minScore: 75, // Higher requirement for JS
    },
    testConfiguration: {
      questionCount: 25,
      timeLimit: 40,
      passingScore: 75,
      maxAttempts: 3,
      randomizeQuestions: true,
      randomizeOptions: true,
    },
    rewards: {
      points: 300,
      unlocksNext: true,
      unlocksSkills: ['frontend-frameworks', 'backend-development'], // Unlocks domain choices
      badges: ['js-developer'],
    },
    metadata: {
      estimatedDuration: 45,
      difficulty: 6,
      createdBy: 'system',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
    },
  },
];

// Niveaux pour le domaine Logique de Programmation
export const PROGRAMMING_LOGIC_LEVELS: SkillLevel[] = [
  {
    id: 'variables-basics',
    domainId: 'programming-logic',
    level: 1,
    name: 'Variables et Types',
    description: 'Comprendre les variables et types de données',
    objectives: [
      'Déclarer et utiliser des variables',
      'Comprendre les types de données de base',
      'Manipuler les chaînes de caractères',
      'Utiliser les nombres et booléens'
    ],
    prerequisites: [],
    isVisible: true,
    unlockCriteria: {
      previousLevelSuccess: false,
    },
    testConfiguration: {
      questionCount: 12,
      timeLimit: 15,
      passingScore: 70,
      maxAttempts: 3,
      randomizeQuestions: true,
      randomizeOptions: true,
    },
    rewards: {
      points: 120,
      unlocksNext: true,
      badges: ['variable-master'],
    },
    metadata: {
      estimatedDuration: 20,
      difficulty: 2,
      createdBy: 'system',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
    },
  },
  {
    id: 'control-structures',
    domainId: 'programming-logic',
    level: 2,
    name: 'Structures de Contrôle',
    description: 'Conditions, boucles et logique de programme',
    objectives: [
      'Utiliser les conditions if/else',
      'Créer des boucles for et while',
      'Comprendre la logique booléenne',
      'Résoudre des problèmes simples'
    ],
    prerequisites: ['variables-basics'],
    isVisible: false,
    unlockCriteria: {
      previousLevelSuccess: true,
      minScore: 70,
    },
    testConfiguration: {
      questionCount: 15,
      timeLimit: 25,
      passingScore: 75,
      maxAttempts: 3,
      randomizeQuestions: true,
      randomizeOptions: true,
    },
    rewards: {
      points: 180,
      unlocksNext: true,
      badges: ['logic-ninja'],
    },
    metadata: {
      estimatedDuration: 30,
      difficulty: 4,
      createdBy: 'system',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
    },
  },
];

// Niveaux pour le domaine Outils Numériques
export const DIGITAL_TOOLS_LEVELS: SkillLevel[] = [
  {
    id: 'command-line-basics',
    domainId: 'digital-tools',
    level: 1,
    name: 'Terminal et Ligne de Commande',
    description: 'Maîtriser les bases du terminal',
    objectives: [
      'Naviguer dans le système de fichiers',
      'Créer et manipuler des fichiers',
      'Comprendre les commandes de base',
      'Utiliser les arguments et options'
    ],
    prerequisites: [],
    isVisible: true,
    unlockCriteria: {
      previousLevelSuccess: false,
    },
    testConfiguration: {
      questionCount: 10,
      timeLimit: 15,
      passingScore: 70,
      maxAttempts: 3,
      randomizeQuestions: true,
      randomizeOptions: true,
    },
    rewards: {
      points: 100,
      unlocksNext: true,
      badges: ['terminal-warrior'],
    },
    metadata: {
      estimatedDuration: 18,
      difficulty: 3,
      createdBy: 'system',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
    },
  },
  {
    id: 'version-control',
    domainId: 'digital-tools',
    level: 2,
    name: 'Contrôle de Version avec Git',
    description: 'Gérer le code avec Git et GitHub',
    objectives: [
      'Initialiser un dépôt Git',
      'Effectuer des commits efficaces',
      'Comprendre les branches',
      'Collaborer avec GitHub'
    ],
    prerequisites: ['command-line-basics'],
    isVisible: false,
    unlockCriteria: {
      previousLevelSuccess: true,
      minScore: 70,
    },
    testConfiguration: {
      questionCount: 12,
      timeLimit: 20,
      passingScore: 75,
      maxAttempts: 3,
      randomizeQuestions: true,
      randomizeOptions: true,
    },
    rewards: {
      points: 150,
      unlocksNext: true,
      unlocksSkills: ['backend-development'], // Débloque backend après outils
      badges: ['git-master'],
    },
    metadata: {
      estimatedDuration: 25,
      difficulty: 5,
      createdBy: 'system',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
    },
  },
];

// Sample questions for HTML basics test
export const HTML_BASICS_QUESTIONS: SkillQuestion[] = [
  {
    id: 'html-q1',
    testId: 'html-basics-test',
    type: 'multiple_choice',
    difficulty: 'easy',
    points: 10,
    question: 'Quelle balise HTML est utilisée pour créer un titre principal?',
    options: ['<title>', '<h1>', '<header>', '<main>'],
    correctAnswer: 1,
    explanation: 'La balise <h1> est utilisée pour les titres principaux dans le contenu de la page.',
    hints: ['Pensez à la hiérarchie des titres', 'C\'est la plus grande balise de titre'],
    metadata: {
      tags: ['html', 'semantic', 'headings'],
      estimatedTime: 30,
      createdBy: 'system',
      createdAt: new Date('2024-01-01'),
    },
  },
  {
    id: 'html-q2',
    testId: 'html-basics-test',
    type: 'multiple_choice',
    difficulty: 'medium',
    points: 15,
    question: 'Quels attributs sont OBLIGATOIRES pour une balise <img>?',
    options: ['src uniquement', 'alt uniquement', 'src et alt', 'src, alt et title'],
    correctAnswer: 2,
    explanation: 'Les attributs src (source de l\'image) et alt (texte alternatif) sont obligatoires pour l\'accessibilité.',
    hints: ['L\'accessibilité est importante', 'Il faut au minimum la source et une alternative'],
    metadata: {
      tags: ['html', 'attributes', 'accessibility', 'images'],
      estimatedTime: 45,
      createdBy: 'system',
      createdAt: new Date('2024-01-01'),
    },
  },
  {
    id: 'html-q3',
    testId: 'html-basics-test',
    type: 'true_false',
    difficulty: 'easy',
    points: 8,
    question: 'La balise <div> a une signification sémantique spécifique.',
    correctAnswer: 0, // False
    explanation: 'La balise <div> est un conteneur générique sans signification sémantique particulière.',
    metadata: {
      tags: ['html', 'semantic', 'div'],
      estimatedTime: 20,
      createdBy: 'system',
      createdAt: new Date('2024-01-01'),
    },
  },
  {
    id: 'html-q4',
    testId: 'html-basics-test',
    type: 'fill_blank',
    difficulty: 'medium',
    points: 12,
    question: 'Complétez le code pour créer un lien vers "https://example.com" avec le texte "Cliquez ici": <______ ______="https://example.com">Cliquez ici</______>',
    blanks: ['a', 'href', 'a'],
    explanation: 'On utilise <a href="url">texte</a> pour créer un lien.',
    hints: ['C\'est une balise d\'ancrage', 'L\'attribut définit la destination'],
    metadata: {
      tags: ['html', 'links', 'attributes'],
      estimatedTime: 60,
      createdBy: 'system',
      createdAt: new Date('2024-01-01'),
    },
  },
  {
    id: 'html-q5',
    testId: 'html-basics-test',
    type: 'multiple_choice',
    difficulty: 'hard',
    points: 20,
    question: 'Quelle est la structure HTML5 sémantique correcte pour une page web?',
    options: [
      '<div><div><div>contenu</div></div></div>',
      '<header><nav></nav></header><main><article>contenu</article></main><footer></footer>',
      '<top><navigation></navigation></top><content>contenu</content><bottom></bottom>',
      '<head><body><content>contenu</content></body></head>'
    ],
    correctAnswer: 1,
    explanation: 'HTML5 introduit des balises sémantiques comme header, nav, main, article, footer pour structurer le contenu.',
    hints: ['HTML5 a introduit de nouvelles balises sémantiques', 'Pensez à la structure logique d\'une page'],
    metadata: {
      tags: ['html5', 'semantic', 'structure', 'layout'],
      estimatedTime: 90,
      createdBy: 'system',
      createdAt: new Date('2024-01-01'),
    },
  },
];

// Utility functions
export const calculateTestScore = (answers: any[], questions: SkillQuestion[]): number => {
  let totalPoints = 0;
  let earnedPoints = 0;

  questions.forEach((question, index) => {
    totalPoints += question.points;
    if (answers[index]?.isCorrect) {
      earnedPoints += question.points;
    }
  });

  return totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
};

export const determineNextLevel = (currentLevelId: string, domainId: string): string | null => {
  // In a real app, this would query the database
  const domain = SKILL_DOMAINS.find(d => d.id === domainId);
  if (!domain) return null;

  // Find current level and return next one
  if (domainId === 'web-fundamentals') {
    const levels = WEB_FUNDAMENTALS_LEVELS;
    const currentIndex = levels.findIndex(l => l.id === currentLevelId);
    return currentIndex >= 0 && currentIndex < levels.length - 1 
      ? levels[currentIndex + 1].id 
      : null;
  }

  return null;
};

export const checkUnlockCriteria = (userProgress: UserProgress, targetId: string, type: 'domain' | 'level'): boolean => {
  if (type === 'domain') {
    const domain = SKILL_DOMAINS.find(d => d.id === targetId);
    if (!domain?.unlockCriteria) return true;

    // Check required domains
    if (domain.unlockCriteria.requiredDomains) {
      const completedDomains = domain.unlockCriteria.requiredDomains.every(
        reqDomain => userProgress.domainProgress[reqDomain]?.isCompleted
      );
      if (!completedDomains) return false;
    }

    // Check points and level
    if (domain.unlockCriteria.requiredPoints && 
        userProgress.overallStats.totalPointsEarned < domain.unlockCriteria.requiredPoints) {
      return false;
    }

    return true;
  }

  return false;
};

export const getVisibleDomains = (userProgress?: UserProgress): SkillDomain[] => {
  if (!userProgress) {
    // Return only initially visible domains
    return SKILL_DOMAINS.filter(domain => domain.isVisible);
  }

  // Return domains that are visible or have been unlocked
  return SKILL_DOMAINS.filter(domain => 
    domain.isVisible || 
    userProgress.domainProgress[domain.id]?.isUnlocked ||
    checkUnlockCriteria(userProgress, domain.id, 'domain')
  );
};

export const getVisibleLevels = (domainId: string, userProgress?: UserProgress): SkillLevel[] => {
  // Récupérer les niveaux selon le domaine
  let levels: SkillLevel[] = [];
  switch (domainId) {
    case 'web-fundamentals':
      levels = WEB_FUNDAMENTALS_LEVELS;
      break;
    case 'programming-logic':
      levels = PROGRAMMING_LOGIC_LEVELS;
      break;
    case 'digital-tools':
      levels = DIGITAL_TOOLS_LEVELS;
      break;
    default:
      return []; // Domaine non implémenté
  }

  if (!userProgress) {
    // Retourner seulement les niveaux initialement visibles
    return levels.filter(level => level.isVisible);
  }

  const visibleLevels: SkillLevel[] = [];
  const domainProgress = userProgress.domainProgress[domainId];

  levels.forEach(level => {
    // Toujours montrer si explicitement visible
    if (level.isVisible) {
      visibleLevels.push(level);
      return;
    }

    // Montrer si aucun prérequis
    if (level.prerequisites.length === 0) {
      visibleLevels.push(level);
      return;
    }

    // Vérifier si tous les prérequis sont complétés avec score suffisant
    const prerequisitesMet = level.prerequisites.every(prereqId => {
      const prereqScore = domainProgress?.bestScores[prereqId] || 0;
      return prereqScore >= (level.unlockCriteria.minScore || SKILL_TEST_CONFIG.progressionRules.minScoreToUnlock);
    });

    if (prerequisitesMet) {
      visibleLevels.push(level);
    }
  });

  return visibleLevels;
};