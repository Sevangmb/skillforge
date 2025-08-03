require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check for missing configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('🔴 Missing Firebase configuration. Please check your .env.local file.');
    process.exit(1);
}


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// The initial skill to seed the database
const initialSkill = {
  id: 'general-knowledge',
  name: 'Test de connaissances générales',
  description: 'Évaluez vos connaissances de base pour débloquer vos premières compétences.',
  icon: 'BrainCircuit',
  cost: 0,
  category: 'Évaluation Initiale',
  position: { x: 450, y: 250 },
  prereqs: [],
  level: 1,
  isSecret: false,
};

async function seedDatabase() {
  try {
    console.log('🔥 Seeding database with initial skill...');
    const skillRef = doc(db, 'skills', initialSkill.id);
    await setDoc(skillRef, initialSkill);
    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('🔴 Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
