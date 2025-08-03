import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Fallback configuration for development - these will be replaced by actual env vars in production
const DEFAULT_CONFIG = {
  apiKey: "AIzaSyDmRORJqVcDW6OWFP7Oiw1npDyGXj1y860",
  authDomain: "skillforge-ai-tk7mp.firebaseapp.com",
  projectId: "skillforge-ai-tk7mp",
  storageBucket: "skillforge-ai-tk7mp.firebasestorage.app",
  messagingSenderId: "430093616142",
  appId: "1:430093616142:web:95e69e98d0cb9112a6285f"
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || DEFAULT_CONFIG.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || DEFAULT_CONFIG.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || DEFAULT_CONFIG.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || DEFAULT_CONFIG.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_CONFIG.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || DEFAULT_CONFIG.appId,
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
    
    // Log successful initialization in development
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('🔥 Firebase initialized successfully', {
        projectId: firebaseConfig.projectId,
        usingDefaults: !process.env.NEXT_PUBLIC_FIREBASE_API_KEY
      });
    }
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    app = null;
  }
} else {
  console.error('🔥 Firebase not initialized - invalid configuration');
  app = null;
}

// Initialize Firebase services with null checks
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

export default app;
