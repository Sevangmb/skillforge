// Environment variable validator for client-side
export function validateFirebaseEnv() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
  ] as const;

  const envStatus = requiredEnvVars.map(envVar => ({
    name: envVar,
    value: process.env[envVar],
    exists: !!process.env[envVar]
  }));

  const missing = envStatus.filter(env => !env.exists);
  
  return {
    isValid: missing.length === 0,
    missing: missing.map(env => env.name),
    status: envStatus,
    summary: {
      total: requiredEnvVars.length,
      loaded: envStatus.filter(env => env.exists).length,
      missing: missing.length
    }
  };
}

// Debug function for development
export function debugEnvironment() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const validation = validateFirebaseEnv();
    
    console.group('🔍 Environment Variables Debug');
    console.log('Validation Result:', validation.isValid ? '✅ VALID' : '❌ INVALID');
    console.log('Summary:', validation.summary);
    
    if (validation.missing.length > 0) {
      console.warn('Missing variables:', validation.missing);
    }
    
    console.table(validation.status);
    console.groupEnd();
    
    return validation;
  }
  
  return null;
}