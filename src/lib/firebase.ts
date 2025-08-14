import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { logger, withRetry, CircuitBreaker } from './logger';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Validate configuration and initialize Firebase
let app;
let auth;
let db;

if (isBrowser && firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);

    logger.info('Firebase initialized successfully in browser', {
      action: 'firebase_client_init_success',
      context: { projectId: firebaseConfig.projectId }
    });
  } catch (error) {
    logger.error('Firebase initialization failed in browser', {
      action: 'firebase_client_init_failed',
      error: error instanceof Error ? error.message : String(error)
    });
    app = null;
    auth = null;
    db = null;
  }
} else if (!isBrowser) {
  // Handle SSR: app, auth, and db will be undefined
  logger.debug('Firebase deferred on server-side', {
    action: 'firebase_ssr_deferred'
  });
} else {
  // Handle missing required environment variables in the browser
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  ];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  if (missingEnvVars.length > 0) {
    logger.error('Missing required Firebase environment variables', {
      action: 'firebase_config_missing_vars',
      missingVariables: missingEnvVars
    });
  }
}

// Circuit breaker for Firebase operations
export const firebaseCircuitBreaker = new CircuitBreaker(3, 30000, 'firebase');

// Enhanced Firebase operations with retry and circuit breaker
export const withFirebaseResilience = async <T>(
  operation: () => Promise<T>,
  operationName: string = 'firebase-operation'
): Promise<T> => {
  return firebaseCircuitBreaker.execute(() =>
    withRetry(operation, {
      maxAttempts: 3,
      baseDelay: 1000,
      operationName,
      shouldRetry: (error) => {
        // Only retry on network errors, not on authentication or permission errors
        const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
        return errorMessage.includes('network') || 
               errorMessage.includes('timeout') ||
               errorMessage.includes('unavailable');
      }
    })
  );
};

// Connection state management
export const getFirebaseConnection = () => {
  const isConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);
  const isInitialized = !!(app && auth && db);
  
  return {
    isConfigured,
    isInitialized,
    isBrowser,
    hasValidConnection: isConfigured && isInitialized && isBrowser,
    projectId: firebaseConfig.projectId,
  };
};

// Health check function
export const checkFirebaseHealth = async (): Promise<boolean> => {
  if (!db) {
    logger.warn('Firebase health check failed: No database connection');
    return false;
  }

  try {
    // Try to perform a simple read operation to test connection
    const { getDocs, collection, limit, query } = await import('firebase/firestore');
    const testQuery = query(collection(db, 'health-check'), limit(1));
    await getDocs(testQuery);
    logger.debug('Firebase health check passed');
    return true;
  } catch (error) {
    logger.errorWithStack(error, 'Firebase health check failed', {
      operation: 'firebase_health_check',
      component: 'firebase'
    });
    return false;
  }
};

export { app, auth, db };
