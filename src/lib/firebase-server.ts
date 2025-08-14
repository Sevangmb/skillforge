/**
 * Firebase configuration for server-side operations
 * Compatible with Server Actions and API routes
 * Includes performance optimizations and connection management
 */

import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, initializeFirestore } from 'firebase/firestore';
import { logger } from './logger';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Performance optimization settings
const firestoreSettings = {
  cacheSizeBytes: 100 * 1024 * 1024, // 100MB cache
  experimentalForceLongPolling: false, // Use WebSockets when available
  experimentalAutoDetectLongPolling: true,
  ignoreUndefinedProperties: true, // Ignore undefined values
};

// Validate configuration values
const requiredConfigValues = ['apiKey', 'authDomain', 'projectId'];
const missingConfigValues = requiredConfigValues.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

if (missingConfigValues.length > 0) {
  logger.warn('Missing Firebase configuration values', {
    action: 'firebase_server_config_check',
    missingValues: missingConfigValues
  });
}

// Always initialize Firebase with valid config
const isValidConfig = firebaseConfig.apiKey && 
  firebaseConfig.authDomain && 
  firebaseConfig.projectId;

// Initialize Firebase for server-side operations with performance optimizations
let serverApp;
let db = null;

if (isValidConfig) {
  try {
    // Check if server app already exists
    const existingApp = getApps().find(app => app.name === 'server-app');
    
    if (existingApp) {
      serverApp = existingApp;
      db = getFirestore(serverApp);
    } else {
      serverApp = initializeApp(firebaseConfig, 'server-app');
      
      // Initialize Firestore with performance optimizations
      try {
        db = initializeFirestore(serverApp, firestoreSettings);
        
        logger.info('Firebase server app initialized with performance settings', {
          action: 'firebase_server_init_optimized',
          context: { 
            projectId: firebaseConfig.projectId,
            cacheSize: `${firestoreSettings.cacheSizeBytes / (1024 * 1024)}MB`,
            longPolling: firestoreSettings.experimentalForceLongPolling
          }
        });
      } catch (firestoreError) {
        // Fallback to standard Firestore initialization
        logger.warn('Failed to initialize Firestore with custom settings, using defaults', {
          action: 'firebase_server_fallback',
          error: firestoreError instanceof Error ? firestoreError.message : String(firestoreError)
        });
        db = getFirestore(serverApp);
      }
    }
    
    // Connect to Firestore emulator if in development
    if (process.env.NODE_ENV === 'development' && process.env.FIRESTORE_EMULATOR_HOST) {
      try {
        connectFirestoreEmulator(db, 'localhost', 8080);
        logger.info('Connected to Firestore emulator', {
          action: 'firebase_emulator_connected'
        });
      } catch (emulatorError) {
        // Ignore if already connected
        if (!emulatorError.message?.includes('already connected')) {
          logger.warn('Failed to connect to Firestore emulator', {
            action: 'firebase_emulator_failed',
            error: emulatorError instanceof Error ? emulatorError.message : String(emulatorError)
          });
        }
      }
    }
    
    logger.info('Firebase server app initialized successfully', {
      action: 'firebase_server_init_success',
      context: { projectId: firebaseConfig.projectId }
    });
  } catch (error) {
    logger.error('Firebase server initialization failed', {
      action: 'firebase_server_init_failed',
      error: error instanceof Error ? error.message : String(error)
    });
    serverApp = null;
    db = null;
  }
} else {
  logger.error('Firebase server not initialized - invalid configuration', {
    action: 'firebase_server_config_invalid',
    context: { missingValues: missingConfigValues }
  });
  serverApp = null;
  db = null;
}

// Export optimized Firestore instance
export { db };

export default serverApp;