import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDmRORJqVcDW6OWFP7Oiw1npDyGXj1y860",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "skillforge-ai-tk7mp.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "skillforge-ai-tk7mp",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "skillforge-ai-tk7mp.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "430093616142",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:430093616142:web:95e69e98d0cb9112a6285f",
};

// Check if we're in a browser environment and have valid config
const isValidConfig = typeof window !== 'undefined' && 
  firebaseConfig.apiKey && 
  firebaseConfig.authDomain && 
  firebaseConfig.projectId;

// Initialize Firebase only if we have valid config and are in browser
let app;
if (isValidConfig) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} else {
  // Create a mock app for SSR/build time
  app = null;
}

// Initialize Firebase services with null checks
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

export default app;