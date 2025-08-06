import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { logger } from './logger';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate configuration values (not environment variables)
const requiredConfigValues = ['apiKey', 'authDomain', 'projectId'];
const missingConfigValues = requiredConfigValues.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

if (missingConfigValues.length > 0) {
  console.error('Missing required Firebase configuration values:', missingConfigValues);
}

// Always initialize Firebase with valid config
const isValidConfig = firebaseConfig.apiKey && 
  firebaseConfig.authDomain && 
  firebaseConfig.projectId;

// Initialize Firebase
let app;
if (isValidConfig) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    // Log successful initialization
    logger.info('Firebase initialized successfully', {
      action: 'firebase_init_success',
      context: { projectId: firebaseConfig.projectId }
    });
  } catch (error) {
    logger.error('Firebase initialization failed', {
      action: 'firebase_init_failed',
      error: error instanceof Error ? error.message : String(error)
    });
    app = null;
  }
} else {
  logger.error('Firebase not initialized - invalid configuration', {
    action: 'firebase_config_invalid',
    context: { missingValues: missingConfigValues }
  });
  app = null;
}

// Initialize Firebase services with null checks
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

export default app;
