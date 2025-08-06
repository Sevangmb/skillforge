const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Configuration pour se connecter à Firestore
const app = initializeApp({
  projectId: 'skillforge-ai-tk7mp'
});

const db = getFirestore(app);

async function initializeDatabase() {
  console.log('🚀 Initialisation de la base de données Firestore...\n');

  try {
    // 1. Créer des compétences de base
    console.log('📚 Création des compétences de base...');
    const skillsData = [
      {
        id: 'javascript_basics',
        name: 'JavaScript Basics',
        description: 'Les fondamentaux du JavaScript',
        category: 'programming',
        level: 1,
        prereqs: [],
        color: '#f7df1e'
      },
      {
        id: 'react_basics', 
        name: 'React Basics',
        description: 'Introduction à React',
        category: 'frontend',
        level: 2,
        prereqs: ['javascript_basics'],
        color: '#61dafb'
      },
      {
        id: 'nodejs_basics',
        name: 'Node.js Basics', 
        description: 'Développement backend avec Node.js',
        category: 'backend',
        level: 2,
        prereqs: ['javascript_basics'],
        color: '#339933'
      }
    ];

    for (const skill of skillsData) {
      await db.collection('skills').doc(skill.id).set(skill);
      console.log(`✅ Compétence créée: ${skill.name}`);
    }

    // 2. Créer des parcours de quiz de test
    console.log('\n🎯 Création des parcours de quiz...');
    const quizPathsData = [
      {
        id: 'path-js-basics-001',
        title: 'Parcours JavaScript Débutant',
        description: 'Maîtrisez les bases du JavaScript',
        category: 'programming',
        difficulty: 'beginner',
        estimatedDuration: 45,
        totalSteps: 5,
        currentStep: 0,
        isCompleted: false,
        unlockDate: new Date(),
        createdByAI: true,
        tags: ['javascript', 'basics', 'programming']
      },
      {
        id: 'path-react-intro-001', 
        title: 'Introduction à React',
        description: 'Découvrez React et ses composants',
        category: 'frontend',
        difficulty: 'intermediate',
        estimatedDuration: 60,
        totalSteps: 8,
        currentStep: 0,
        isCompleted: false,
        unlockDate: new Date(),
        createdByAI: true,
        tags: ['react', 'frontend', 'components']
      }
    ];

    for (const path of quizPathsData) {
      await db.collection('quiz_paths').doc(path.id).set(path);
      console.log(`✅ Parcours créé: ${path.title}`);
    }

    // 3. Créer des étapes de quiz
    console.log('\n📝 Création des étapes de quiz...');
    const quizStepsData = [
      {
        id: 'path-js-basics-001_step_1',
        pathId: 'path-js-basics-001',
        stepNumber: 1,
        type: 'lesson',
        title: 'Leçon 1: Variables en JavaScript',
        content: '# Variables en JavaScript\n\nEn JavaScript, vous pouvez déclarer des variables avec `let`, `const` ou `var`.\n\n## Exemples:\n```javascript\nlet name = "John";\nconst age = 25;\nvar city = "Paris";\n```',
        isCompleted: false,
        attempts: 0,
        maxAttempts: 3,
        pointsReward: 15
      },
      {
        id: 'path-js-basics-001_step_2',
        pathId: 'path-js-basics-001', 
        stepNumber: 2,
        type: 'quiz',
        title: 'Quiz 1: Variables JavaScript',
        questions: [
          {
            question: 'Quelle est la différence entre let et const?',
            options: [
              'Aucune différence',
              'let peut être réassigné, const non',
              'const peut être réassigné, let non', 
              'Les deux sont identiques'
            ],
            correctAnswer: 1,
            explanation: 'let permet de réassigner une valeur, tandis que const crée une constante.'
          },
          {
            question: 'Comment déclarer une constante en JavaScript?',
            options: ['var x = 5', 'let x = 5', 'const x = 5', 'constant x = 5'],
            correctAnswer: 2,
            explanation: 'const est utilisé pour déclarer une constante en JavaScript.'
          }
        ],
        isCompleted: false,
        attempts: 0,
        maxAttempts: 3,
        pointsReward: 25
      }
    ];

    for (const step of quizStepsData) {
      await db.collection('quiz_steps').doc(step.id).set(step);
      console.log(`✅ Étape créée: ${step.title}`);
    }

    // 4. Créer un défi quotidien de test
    console.log('\n🌅 Création d\'un défi quotidien...');
    const today = new Date().toISOString().split('T')[0];
    const dailyChallenge = {
      id: `daily_${today}_test`,
      date: today,
      userId: 'test-user',
      pathId: 'path-js-basics-001',
      stepId: 'path-js-basics-001_step_2',
      isCompleted: false,
      streakCount: 0,
      bonusPointsEarned: 0
    };

    await db.collection('daily_challenges').doc(dailyChallenge.id).set(dailyChallenge);
    console.log(`✅ Défi quotidien créé pour ${today}`);

    console.log('\n🎉 Base de données initialisée avec succès!');
    console.log('\nDonnées créées:');
    console.log('- 3 compétences de base');
    console.log('- 2 parcours de quiz');
    console.log('- 2 étapes de quiz');
    console.log('- 1 défi quotidien');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  }
}

// Exécuter le script
initializeDatabase().then(() => {
  console.log('\n✅ Script terminé');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});