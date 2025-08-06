/**
 * Utilitaire pour tester la configuration Firebase
 */

import { auth, db } from './firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { logger } from './logger';

export async function testFirebaseConfiguration(): Promise<boolean> {
  if (!auth || !db) {
    console.error('❌ Firebase not initialized');
    return false;
  }

  try {
    // Test 1: Authentification anonyme (avec gestion d'erreur)
    console.log('🔍 Testing Firebase authentication...');
    let userId = 'test-user-id';
    
    try {
      const userCredential = await signInAnonymously(auth);
      console.log('✅ Authentication successful:', userCredential.user.uid);
      userId = userCredential.user.uid;
    } catch (authError: any) {
      if (authError.code === 'auth/admin-restricted-operation') {
        console.log('⚠️ Anonymous auth disabled - using test mode');
        console.log('📋 SOLUTION: Check INSTRUCTIONS_FIREBASE.md for detailed setup guide');
        console.log('🔧 Quick fix: Firebase Console → Authentication → Sign-in Method → Enable Anonymous');
        // Continuer avec un ID de test
      } else {
        throw authError;
      }
    }

    // Test 2: Test d'écriture Firestore
    console.log('🔍 Testing Firestore write permissions...');
    const testDoc = doc(db, 'test', 'connection-test');
    await setDoc(testDoc, {
      timestamp: new Date(),
      message: 'Firebase connection test',
      userId: userId
    });
    console.log('✅ Firestore write successful');

    // Test 3: Test de lecture Firestore
    console.log('🔍 Testing Firestore read permissions...');
    const docSnap = await getDoc(testDoc);
    if (docSnap.exists()) {
      console.log('✅ Firestore read successful:', docSnap.data());
    } else {
      console.log('⚠️ Document not found, but read permission works');
    }

    // Test 4: Test des collections utilisées par l'app
    console.log('🔍 Testing quiz system collections...');
    const testQuizPath = collection(db, 'quiz_paths');
    await addDoc(testQuizPath, {
      title: 'Test Quiz Path',
      createdAt: new Date(),
      userId: userId,
      isTest: true
    });
    console.log('✅ Quiz collections accessible');

    console.log('🎉 All Firebase tests passed!');
    return true;

  } catch (error) {
    console.error('❌ Firebase test failed:', error);
    
    if (error.code === 'permission-denied') {
      console.log(`
🔧 SOLUTION: Firestore Security Rules Issue
   
1. Allez sur https://console.firebase.google.com
2. Sélectionnez votre projet: skillforge-ai-tk7mp  
3. Allez dans "Firestore Database" > "Règles"
4. Remplacez les règles par celles du fichier firestore.rules
5. Publiez les règles

Ou utilisez ces règles temporaires pour le développement:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
      `);
    }
    
    return false;
  }
}

// Fonction pour initialiser les données de test
export async function initializeTestData() {
  if (!auth || !db) return;

  try {
    let userId = 'test-user-init';
    const user = auth.currentUser;
    
    if (!user) {
      try {
        const userCredential = await signInAnonymously(auth);
        userId = userCredential.user.uid;
      } catch (authError: any) {
        if (authError.code === 'auth/admin-restricted-operation') {
          console.log('⚠️ Anonymous auth disabled - using test user ID');
          console.log('📋 See INSTRUCTIONS_FIREBASE.md for setup guide');
        } else {
          throw authError;
        }
      }
    } else {
      userId = user.uid;
    }

    // Créer des données de test pour les quiz
    const testQuizPath = {
      id: 'test-path-001',
      title: 'Parcours Test JavaScript',
      description: 'Un parcours de test pour JavaScript',
      category: 'programming',
      difficulty: 'beginner' as const,
      estimatedDuration: 30,
      totalSteps: 3,
      currentStep: 0,
      isCompleted: false,
      unlockDate: new Date(),
      createdByAI: true,
      tags: ['javascript', 'test']
    };

    await setDoc(doc(db, 'quiz_paths', 'test-path-001'), testQuizPath);
    
    logger.info('Test data initialized', {
      action: 'initialize_test_data',
      context: { pathId: 'test-path-001' }
    });

    console.log('✅ Test data initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize test data:', error);
  }
}