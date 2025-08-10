/**
 * Données de production pour SkillForge AI
 * Structure complète des compétences et utilisateurs réels
 */

import type { Skill, User } from './types';

/**
 * Arbre de compétences complet pour la production
 * Organisé par domaines d'apprentissage progressifs
 */
// Données brutes avant conversion de type
const rawSkills = [
  // === NIVEAU FONDAMENTAL (Niveau 1) ===
  {
    id: 'assessment-general',
    name: 'Évaluation des connaissances générales',
    description: 'Testez vos connaissances de base dans différents domaines pour établir votre profil d\'apprentissage.',
    icon: 'BrainCircuit',
    cost: 0,
    category: 'Évaluation',
    position: { x: 400, y: 100 },
    prereqs: [],
    level: 1,
    isSecret: false
  },
  
  // === MATHÉMATIQUES (Niveaux 2-5) ===
  {
    id: 'math-arithmetic',
    name: 'Arithmétique de base',
    description: 'Maîtrisez les opérations fondamentales : addition, soustraction, multiplication, division.',
    icon: 'Calculator',
    cost: 50,
    category: 'Mathématiques',
    position: { x: 200, y: 200 },
    prereqs: ['assessment-general'],
    level: 2,
    isSecret: false
  },
  {
    id: 'math-algebra',
    name: 'Algèbre élémentaire',
    description: 'Équations, inéquations et systèmes linéaires.',
    icon: 'Variable',
    cost: 100,
    category: 'Mathématiques',
    position: { x: 200, y: 300 },
    prereqs: ['math-arithmetic'],
    level: 3,
    isSecret: false
  },
  {
    id: 'math-geometry',
    name: 'Géométrie',
    description: 'Formes, aires, volumes et théorèmes géométriques.',
    icon: 'Shapes',
    cost: 120,
    category: 'Mathématiques',
    position: { x: 100, y: 400 },
    prereqs: ['math-algebra'],
    level: 4,
    isSecret: false
  },
  {
    id: 'math-statistics',
    name: 'Statistiques et probabilités',
    description: 'Analyse de données, moyennes, médiane, probabilités.',
    icon: 'BarChart',
    cost: 150,
    category: 'Mathématiques',
    position: { x: 300, y: 400 },
    prereqs: ['math-algebra'],
    level: 4,
    isSecret: false
  },
  {
    id: 'math-advanced',
    name: 'Mathématiques avancées',
    description: 'Calcul différentiel, intégral et mathématiques appliquées.',
    icon: 'Function',
    cost: 200,
    category: 'Mathématiques',
    position: { x: 200, y: 500 },
    prereqs: ['math-geometry', 'math-statistics'],
    level: 5,
    isSecret: false
  },

  // === SCIENCES (Niveaux 2-4) ===
  {
    id: 'science-physics',
    name: 'Physique fondamentale',
    description: 'Mécanique, thermodynamique et électricité.',
    icon: 'Atom',
    cost: 80,
    category: 'Sciences',
    position: { x: 600, y: 200 },
    prereqs: ['assessment-general'],
    level: 2,
    isSecret: false
  },
  {
    id: 'science-chemistry',
    name: 'Chimie',
    description: 'Atomes, molécules, réactions chimiques.',
    icon: 'Flask',
    cost: 100,
    category: 'Sciences',
    position: { x: 700, y: 300 },
    prereqs: ['science-physics'],
    level: 3,
    isSecret: false
  },
  {
    id: 'science-biology',
    name: 'Biologie',
    description: 'Cellules, génétique et écosystèmes.',
    icon: 'Microscope',
    cost: 100,
    category: 'Sciences',
    position: { x: 500, y: 300 },
    prereqs: ['science-physics'],
    level: 3,
    isSecret: false
  },
  {
    id: 'science-advanced',
    name: 'Sciences appliquées',
    description: 'Biotechnologies, physique quantique et sciences de l\'environnement.',
    icon: 'Dna',
    cost: 180,
    category: 'Sciences',
    position: { x: 600, y: 400 },
    prereqs: ['science-chemistry', 'science-biology'],
    level: 4,
    isSecret: false
  },

  // === INFORMATIQUE (Niveaux 2-6) ===
  {
    id: 'cs-basics',
    name: 'Introduction à l\'informatique',
    description: 'Concepts fondamentaux : algorithmes, données, systèmes.',
    icon: 'Monitor',
    cost: 60,
    category: 'Informatique',
    position: { x: 400, y: 200 },
    prereqs: ['assessment-general'],
    level: 2,
    isSecret: false
  },
  {
    id: 'cs-programming',
    name: 'Programmation',
    description: 'Langages de programmation, structures de données.',
    icon: 'Code',
    cost: 120,
    category: 'Informatique',
    position: { x: 400, y: 300 },
    prereqs: ['cs-basics'],
    level: 3,
    isSecret: false
  },
  {
    id: 'cs-web-development',
    name: 'Développement Web',
    description: 'HTML, CSS, JavaScript et frameworks modernes.',
    icon: 'Globe',
    cost: 140,
    category: 'Informatique',
    position: { x: 300, y: 400 },
    prereqs: ['cs-programming'],
    level: 4,
    isSecret: false
  },
  {
    id: 'cs-databases',
    name: 'Bases de données',
    description: 'SQL, NoSQL et conception de bases de données.',
    icon: 'Database',
    cost: 160,
    category: 'Informatique',
    position: { x: 500, y: 400 },
    prereqs: ['cs-programming'],
    level: 4,
    isSecret: false
  },
  {
    id: 'cs-ai-ml',
    name: 'Intelligence Artificielle',
    description: 'Machine Learning, réseaux de neurones, IA générative.',
    icon: 'Brain',
    cost: 250,
    category: 'Informatique',
    position: { x: 400, y: 500 },
    prereqs: ['cs-web-development', 'cs-databases', 'math-statistics'],
    level: 5,
    isSecret: false
  },
  {
    id: 'cs-advanced-systems',
    name: 'Systèmes avancés',
    description: 'Architecture distribuée, cloud computing, DevOps.',
    icon: 'Server',
    cost: 300,
    category: 'Informatique',
    position: { x: 400, y: 600 },
    prereqs: ['cs-ai-ml'],
    level: 6,
    isSecret: false
  },

  // === LANGUES (Niveaux 2-4) ===
  {
    id: 'lang-english',
    name: 'Anglais professionnel',
    description: 'Communication écrite et orale en contexte professionnel.',
    icon: 'Languages',
    cost: 80,
    category: 'Langues',
    position: { x: 800, y: 200 },
    prereqs: ['assessment-general'],
    level: 2,
    isSecret: false
  },
  {
    id: 'lang-technical-writing',
    name: 'Rédaction technique',
    description: 'Documentation, rapports, communication scientifique.',
    icon: 'FileText',
    cost: 100,
    category: 'Langues',
    position: { x: 800, y: 300 },
    prereqs: ['lang-english'],
    level: 3,
    isSecret: false
  },
  {
    id: 'lang-presentation',
    name: 'Présentation et oralité',
    description: 'Techniques de présentation, prise de parole en public.',
    icon: 'Presentation',
    cost: 120,
    category: 'Langues',
    position: { x: 800, y: 400 },
    prereqs: ['lang-technical-writing'],
    level: 4,
    isSecret: false
  },

  // === COMPÉTENCES TRANSVERSALES (Niveaux 3-5) ===
  {
    id: 'soft-critical-thinking',
    name: 'Pensée critique',
    description: 'Analyse, évaluation et raisonnement logique.',
    icon: 'Target',
    cost: 140,
    category: 'Compétences transversales',
    position: { x: 600, y: 500 },
    prereqs: ['math-algebra', 'science-physics', 'cs-programming'],
    level: 4,
    isSecret: false
  },
  {
    id: 'soft-project-management',
    name: 'Gestion de projet',
    description: 'Planification, coordination et livraison de projets.',
    icon: 'Kanban',
    cost: 160,
    category: 'Compétences transversales',
    position: { x: 700, y: 500 },
    prereqs: ['soft-critical-thinking', 'lang-presentation'],
    level: 5,
    isSecret: false
  },
  {
    id: 'soft-leadership',
    name: 'Leadership et management',
    description: 'Direction d\'équipe, motivation, prise de décision.',
    icon: 'Users',
    cost: 200,
    category: 'Compétences transversales',
    position: { x: 650, y: 600 },
    prereqs: ['soft-project-management'],
    level: 6,
    isSecret: true // Compétence secrète débloquée par excellence
  }
];

/**
 * Utilisateurs de base pour la production
 * Profils administrateur et utilisateurs types
 */
export const productionUsers: User[] = [
  {
    id: 'admin-sevan' as any,
    profile: {
      displayName: 'Administrateur SkillForge',
      email: 'admin@skillforge.ai',
      totalPoints: 10000,
      level: 50,
      isAdmin: true
    },
    competences: {
      'assessment-general': { level: 100, completed: true },
      'math-arithmetic': { level: 100, completed: true },
      'math-algebra': { level: 100, completed: true },
      'cs-basics': { level: 100, completed: true },
      'cs-programming': { level: 100, completed: true },
      'cs-web-development': { level: 100, completed: true },
      'cs-ai-ml': { level: 85, completed: true }
    } as any,
    preferences: {
      learningStyle: 'Visual',
      favoriteTopics: ['IA', 'Développement Web', 'Mathématiques'] as any,
      adaptiveMode: 'Focus',
      language: 'fr'
    }
  }
];

/**
 * Configuration de la structure des catégories
 */
export const skillCategories = {
  'Évaluation': { color: '#8B5CF6', icon: 'BrainCircuit' },
  'Mathématiques': { color: '#3B82F6', icon: 'Calculator' },
  'Sciences': { color: '#10B981', icon: 'Atom' },
  'Informatique': { color: '#F59E0B', icon: 'Code' },
  'Langues': { color: '#EF4444', icon: 'Languages' },
  'Compétences transversales': { color: '#6366F1', icon: 'Target' }
};

/**
 * Méthodes utilitaires pour les données de production
 */
export class ProductionDataManager {
  /**
   * Valide la cohérence de l'arbre des compétences
   */
  static validateSkillTree(skills = rawSkills as Skill[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const skillIds = new Set(skills.map(s => s.id));

    for (const skill of skills) {
      // Vérifier que tous les prérequis existent
      for (const prereq of skill.prereqs) {
        if (!skillIds.has(prereq)) {
          errors.push(`Skill ${skill.id}: prerequisite ${prereq} not found`);
        }
      }

      // Vérifier les niveaux cohérents
      const prereqLevels = skill.prereqs
        .map(id => skills.find(s => s.id === id)?.level || 0);
      
      if (prereqLevels.length > 0 && Math.max(...prereqLevels) >= skill.level) {
        errors.push(`Skill ${skill.id}: level should be higher than prerequisites`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Obtient les statistiques de l'arbre des compétences
   */
  static getSkillTreeStats(skills = rawSkills as Skill[]) {
    const categoryStats: Record<string, number> = {};
    const levelStats: Record<number, number> = {};

    for (const skill of skills) {
      categoryStats[skill.category] = (categoryStats[skill.category] || 0) + 1;
      levelStats[skill.level] = (levelStats[skill.level] || 0) + 1;
    }

    return {
      totalSkills: skills.length,
      categories: Object.keys(skillCategories).length,
      categoryDistribution: categoryStats,
      levelDistribution: levelStats,
      maxLevel: Math.max(...skills.map(s => s.level)),
      secretSkills: skills.filter(s => s.isSecret).length
    };
  }

  /**
   * Obtient les compétences par niveau
   */
  static getSkillsByLevel(level: number, skills = rawSkills as Skill[]): Skill[] {
    return skills.filter(skill => skill.level === level);
  }

  /**
   * Obtient les compétences par catégorie
   */
  static getSkillsByCategory(category: string, skills = rawSkills as Skill[]): Skill[] {
    return skills.filter(skill => skill.category === category);
  }
}

// Export des compétences avec conversion de type appropriée
export const productionSkills: Skill[] = rawSkills as Skill[];