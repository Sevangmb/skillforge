/**
 * Server-side authentication and user management utilities
 * For use in Server Actions and API routes
 * Includes caching, performance optimizations, and resilience patterns
 */

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase-server';
import type { User, CompetenceStatus } from './types';
import { logger } from './logger';

// Simple in-memory cache for user profiles (5 minute TTL)
const userCache = new Map<string, { user: User; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Circuit breaker pattern for Firestore operations
interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
}

const circuitBreaker: CircuitBreakerState = {
  failures: 0,
  lastFailureTime: 0,
  state: 'closed'
};

const CIRCUIT_BREAKER_THRESHOLD = 5; // Number of failures to open circuit
const CIRCUIT_BREAKER_TIMEOUT = 30 * 1000; // 30 seconds timeout
const CIRCUIT_BREAKER_RECOVERY_TIMEOUT = 60 * 1000; // 60 seconds to reset failure count

/**
 * Check circuit breaker state and update if necessary
 */
function checkCircuitBreaker(): boolean {
  const now = Date.now();
  
  switch (circuitBreaker.state) {
    case 'closed':
      return true;
      
    case 'open':
      if (now - circuitBreaker.lastFailureTime > CIRCUIT_BREAKER_TIMEOUT) {
        circuitBreaker.state = 'half-open';
        logger.info('Circuit breaker entering half-open state', {
          action: 'circuit_breaker_half_open'
        });
        return true;
      }
      return false;
      
    case 'half-open':
      return true;
      
    default:
      return true;
  }
}

/**
 * Record successful operation in circuit breaker
 */
function recordSuccess(): void {
  if (circuitBreaker.state === 'half-open') {
    circuitBreaker.state = 'closed';
    circuitBreaker.failures = 0;
    logger.info('Circuit breaker closed after successful operation', {
      action: 'circuit_breaker_closed'
    });
  }
  
  // Reset failure count after recovery period
  const now = Date.now();
  if (now - circuitBreaker.lastFailureTime > CIRCUIT_BREAKER_RECOVERY_TIMEOUT) {
    circuitBreaker.failures = 0;
  }
}

/**
 * Record failed operation in circuit breaker
 */
function recordFailure(): void {
  circuitBreaker.failures++;
  circuitBreaker.lastFailureTime = Date.now();
  
  if (circuitBreaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreaker.state = 'open';
    logger.warn('Circuit breaker opened due to repeated failures', {
      action: 'circuit_breaker_opened',
      failures: circuitBreaker.failures
    });
  }
}

/**
 * Retry operation with exponential backoff
 */
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      if (attempt > 0) {
        logger.info('Operation succeeded after retry', {
          action: 'retry_success',
          attempt
        });
      }
      return result;
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        logger.error('All retry attempts failed', {
          action: 'retry_exhausted',
          attempts: attempt + 1,
          error: lastError.message
        });
        break;
      }
      
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      logger.warn('Operation failed, retrying', {
        action: 'retry_attempt',
        attempt: attempt + 1,
        delay,
        error: lastError.message
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Clear expired entries from user cache
 */
function clearExpiredCache(): void {
  const now = Date.now();
  for (const [key, value] of userCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      userCache.delete(key);
    }
  }
}

/**
 * Get user profile from Firestore (server-side) with caching and resilience
 */
export async function getUserProfileServer(uid: string): Promise<User | null> {
  const startTime = Date.now();
  
  try {
    if (!uid) {
      throw new Error('User ID is required');
    }

    // Check cache first
    clearExpiredCache();
    const cached = userCache.get(uid);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      logger.debug('User profile retrieved from cache', {
        action: 'get_user_profile_server',
        userId: uid,
        cacheHit: true,
        responseTime: Date.now() - startTime
      });
      recordSuccess(); // Cache hit is successful
      return cached.user;
    }

    if (!db) {
      logger.error('Firestore not initialized for server user profile fetch', {
        action: 'get_user_profile_server',
        userId: uid
      });
      throw new Error('Firestore is not initialized');
    }

    // Check circuit breaker before making Firestore call
    if (!checkCircuitBreaker()) {
      logger.warn('Circuit breaker open, using cached data if available', {
        action: 'get_user_profile_server',
        userId: uid,
        circuitBreakerState: circuitBreaker.state
      });
      
      // Try to return stale cache data if available
      const staleData = userCache.get(uid);
      if (staleData) {
        logger.info('Returning stale cache data due to circuit breaker', {
          action: 'get_user_profile_server_stale',
          userId: uid,
          dataAge: Date.now() - staleData.timestamp
        });
        return staleData.user;
      }
      
      throw new Error('Service temporarily unavailable');
    }
    
    // Use retry with exponential backoff for Firestore operations
    const result = await retryWithBackoff(async () => {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data() as User;
        
        // Cache the result
        userCache.set(uid, {
          user: userData,
          timestamp: Date.now()
        });
        
        return userData;
      } else {
        return null;
      }
    });

    recordSuccess();
    
    logger.debug('User profile retrieved from Firestore', {
      action: 'get_user_profile_server',
      userId: uid,
      cacheHit: false,
      responseTime: Date.now() - startTime,
      circuitBreakerState: circuitBreaker.state
    });
    
    return result;
  } catch (error) {
    recordFailure();
    
    logger.error('Failed to get user profile', {
      action: 'get_user_profile_server',
      userId: uid,
      error: error instanceof Error ? error.message : String(error),
      responseTime: Date.now() - startTime,
      circuitBreakerState: circuitBreaker.state
    });
    
    // Try to return stale cache data as last resort
    const staleData = userCache.get(uid);
    if (staleData) {
      logger.warn('Returning stale cache data due to error', {
        action: 'get_user_profile_server_fallback',
        userId: uid,
        dataAge: Date.now() - staleData.timestamp
      });
      return staleData.user;
    }
    
    throw error;
  }
}

/**
 * Update user profile in Firestore (server-side) with cache invalidation and resilience
 */
export async function updateUserProfileServer(uid: string, updates: Partial<User>): Promise<void> {
  const startTime = Date.now();
  
  try {
    if (!uid || !updates || Object.keys(updates).length === 0) {
      throw new Error('User ID and updates are required');
    }

    if (!db) {
      throw new Error('Firestore is not initialized');
    }

    // Check circuit breaker before making Firestore call
    if (!checkCircuitBreaker()) {
      logger.warn('Circuit breaker open, update operation rejected', {
        action: 'update_user_profile_server',
        userId: uid,
        circuitBreakerState: circuitBreaker.state
      });
      throw new Error('Service temporarily unavailable for updates');
    }
    
    // Use retry with exponential backoff for update operations
    await retryWithBackoff(async () => {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, updates);
    });

    recordSuccess();
    
    // Invalidate cache for updated user to ensure consistency
    userCache.delete(uid);
    
    logger.info('User profile updated successfully', {
      action: 'update_user_profile_server',
      userId: uid,
      updatedFields: Object.keys(updates),
      cacheInvalidated: true,
      responseTime: Date.now() - startTime,
      circuitBreakerState: circuitBreaker.state
    });
  } catch (error) {
    recordFailure();
    
    logger.error('Failed to update user profile', {
      action: 'update_user_profile_server',
      userId: uid,
      error: error instanceof Error ? error.message : String(error),
      responseTime: Date.now() - startTime,
      circuitBreakerState: circuitBreaker.state
    });
    throw error;
  }
}

/**
 * Batch get multiple user profiles (optimized for multiple users)
 */
export async function batchGetUserProfilesServer(uids: string[]): Promise<Map<string, User | null>> {
  const startTime = Date.now();
  const results = new Map<string, User | null>();
  
  try {
    if (!uids || uids.length === 0) {
      return results;
    }

    if (!db) {
      throw new Error('Firestore is not initialized');
    }

    // Check circuit breaker
    if (!checkCircuitBreaker()) {
      logger.warn('Circuit breaker open, batch get operation rejected', {
        action: 'batch_get_user_profiles_server',
        count: uids.length,
        circuitBreakerState: circuitBreaker.state
      });
      throw new Error('Service temporarily unavailable');
    }

    // Check cache first for all users
    const uncachedUids: string[] = [];
    clearExpiredCache();
    
    for (const uid of uids) {
      const cached = userCache.get(uid);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        results.set(uid, cached.user);
      } else {
        uncachedUids.push(uid);
      }
    }

    // Fetch uncached users in batches (Firestore limit is 10 per batch)
    const BATCH_SIZE = 10;
    for (let i = 0; i < uncachedUids.length; i += BATCH_SIZE) {
      const batch = uncachedUids.slice(i, i + BATCH_SIZE);
      
      await retryWithBackoff(async () => {
        const { getDocs, collection, query, where } = await import('firebase/firestore');
        const usersQuery = query(collection(db, 'users'), where('__name__', 'in', batch));
        const snapshot = await getDocs(usersQuery);
        
        // Process results
        const fetchedIds = new Set<string>();
        snapshot.forEach(docSnap => {
          const userData = docSnap.data() as User;
          results.set(docSnap.id, userData);
          fetchedIds.add(docSnap.id);
          
          // Cache the result
          userCache.set(docSnap.id, {
            user: userData,
            timestamp: Date.now()
          });
        });
        
        // Mark non-existent users as null
        batch.forEach(uid => {
          if (!fetchedIds.has(uid)) {
            results.set(uid, null);
          }
        });
      });
    }

    recordSuccess();
    
    logger.debug('Batch user profiles retrieved', {
      action: 'batch_get_user_profiles_server',
      totalUsers: uids.length,
      cacheHits: uids.length - uncachedUids.length,
      firestoreQueries: Math.ceil(uncachedUids.length / BATCH_SIZE),
      responseTime: Date.now() - startTime
    });
    
    return results;
  } catch (error) {
    recordFailure();
    
    logger.error('Failed to batch get user profiles', {
      action: 'batch_get_user_profiles_server',
      count: uids.length,
      error: error instanceof Error ? error.message : String(error),
      responseTime: Date.now() - startTime,
      circuitBreakerState: circuitBreaker.state
    });
    throw error;
  }
}

/**
 * Get performance metrics for monitoring
 */
export function getPerformanceMetrics() {
  return {
    cacheSize: userCache.size,
    circuitBreakerState: circuitBreaker.state,
    circuitBreakerFailures: circuitBreaker.failures,
    lastFailureTime: circuitBreaker.lastFailureTime,
    cacheHitRatio: getUserCacheStats()
  };
}

/**
 * Get cache statistics for monitoring
 */
function getUserCacheStats() {
  // This would be implemented with more sophisticated tracking in production
  return {
    totalRequests: 0, // Would need to track this
    cacheHits: 0,     // Would need to track this
    hitRatio: 0       // Would be calculated from above
  };
}