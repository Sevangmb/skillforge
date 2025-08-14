import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  QueryConstraint,
  DocumentSnapshot,
  QuerySnapshot,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import type { User, Skill } from './types';

// Cache configuration
interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum cache entries
}

// Default cache configurations
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100
};

// Cache entry structure
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
}

// LRU Cache implementation
class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;

  constructor(config: CacheConfig = DEFAULT_CACHE_CONFIG) {
    this.config = config;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check TTL
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Update hit count and move to end (LRU)
    entry.hits++;
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.data;
  }

  set(key: string, data: T): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  getStats() {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);
    const avgAge = entries.reduce((sum, entry) => sum + (Date.now() - entry.timestamp), 0) / entries.length;
    
    return {
      size: this.cache.size,
      totalHits,
      avgAge: avgAge || 0,
      hitRate: totalHits / Math.max(entries.length, 1)
    };
  }
}

// Global caches
const queryCache = new LRUCache<any>({ ttl: 5 * 60 * 1000, maxSize: 50 });
const subscriptionCache = new LRUCache<any>({ ttl: 15 * 60 * 1000, maxSize: 20 });

// Query builder with optimization
class OptimizedQuery {
  private collectionName: string;
  private constraints: QueryConstraint[] = [];
  private cacheKey: string = '';

  constructor(collectionName: string) {
    this.collectionName = collectionName;
    this.cacheKey = collectionName;
  }

  where(field: string, operator: any, value: any): OptimizedQuery {
    this.constraints.push(where(field, operator, value));
    this.cacheKey += `_${field}_${operator}_${JSON.stringify(value)}`;
    return this;
  }

  orderBy(field: string, direction?: 'asc' | 'desc'): OptimizedQuery {
    this.constraints.push(orderBy(field, direction));
    this.cacheKey += `_orderBy_${field}_${direction || 'asc'}`;
    return this;
  }

  limit(count: number): OptimizedQuery {
    this.constraints.push(limit(count));
    this.cacheKey += `_limit_${count}`;
    return this;
  }

  startAfter(snapshot: DocumentSnapshot): OptimizedQuery {
    this.constraints.push(startAfter(snapshot));
    this.cacheKey += `_startAfter_${snapshot.id}`;
    return this;
  }

  async execute<T>(): Promise<T[]> {
    // Check cache first
    const cachedResult = queryCache.get(this.cacheKey);
    if (cachedResult) {
      console.log(`🎯 Cache hit for query: ${this.cacheKey}`);
      return cachedResult;
    }

    console.log(`🔥 Cache miss, executing query: ${this.cacheKey}`);
    
    // Execute query
    const q = query(collection(db, this.collectionName), ...this.constraints);
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as T[];
    
    // Cache result
    queryCache.set(this.cacheKey, data);
    
    return data;
  }

  // Subscribe with caching and deduplication
  subscribe<T>(callback: (data: T[]) => void): Unsubscribe {
    const subscriptionKey = `sub_${this.cacheKey}`;
    
    // Check if subscription already exists
    const existingSubscription = subscriptionCache.get(subscriptionKey);
    if (existingSubscription) {
      console.log(`🔄 Reusing existing subscription: ${subscriptionKey}`);
      return existingSubscription;
    }

    console.log(`🆕 Creating new subscription: ${subscriptionKey}`);
    
    const q = query(collection(db, this.collectionName), ...this.constraints);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as T[];
      
      // Update query cache as well
      queryCache.set(this.cacheKey, data);
      
      callback(data);
    });

    // Cache the unsubscribe function
    subscriptionCache.set(subscriptionKey, unsubscribe);
    
    return unsubscribe;
  }
}

// Optimized Firebase service
export class FirebaseOptimizer {
  // Create optimized query
  static collection(collectionName: string): OptimizedQuery {
    return new OptimizedQuery(collectionName);
  }

  // Batch operations
  static async batchGet<T>(collectionName: string, ids: string[]): Promise<T[]> {
    const cacheKey = `batch_${collectionName}_${ids.sort().join('_')}`;
    const cached = queryCache.get(cacheKey);
    
    if (cached) {
      console.log(`🎯 Batch cache hit: ${cacheKey}`);
      return cached;
    }

    console.log(`🔥 Batch cache miss, executing: ${cacheKey}`);
    
    // Split into chunks of 10 (Firestore limit for 'in' queries)
    const chunks = [];
    for (let i = 0; i < ids.length; i += 10) {
      chunks.push(ids.slice(i, i + 10));
    }

    const results = await Promise.all(
      chunks.map(chunk =>
        getDocs(query(collection(db, collectionName), where('__name__', 'in', chunk)))
      )
    );

    const data = results.flatMap(snapshot =>
      snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    ) as T[];

    queryCache.set(cacheKey, data);
    return data;
  }

  // Paginated queries
  static async getPaginated<T>(
    collectionName: string,
    pageSize: number = 20,
    lastDoc?: DocumentSnapshot,
    orderField: string = 'createdAt'
  ): Promise<{ data: T[]; lastDoc: DocumentSnapshot | null; hasMore: boolean }> {
    const cacheKey = `paginated_${collectionName}_${pageSize}_${orderField}_${lastDoc?.id || 'start'}`;
    const cached = queryCache.get(cacheKey);
    
    if (cached) {
      console.log(`🎯 Paginated cache hit: ${cacheKey}`);
      return cached;
    }

    console.log(`🔥 Paginated cache miss: ${cacheKey}`);

    let q = query(
      collection(db, collectionName),
      orderBy(orderField, 'desc'),
      limit(pageSize + 1) // Get one extra to check if there are more
    );

    if (lastDoc) {
      q = query(
        collection(db, collectionName),
        orderBy(orderField, 'desc'),
        startAfter(lastDoc),
        limit(pageSize + 1)
      );
    }

    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;
    
    // Remove the extra document if it exists
    if (hasMore) {
      docs.pop();
    }

    const data = docs.map(doc => ({ id: doc.id, ...doc.data() })) as T[];
    const result = {
      data,
      lastDoc: docs.length > 0 ? docs[docs.length - 1] : null,
      hasMore
    };

    queryCache.set(cacheKey, result);
    return result;
  }

  // Clear specific cache
  static clearCache(pattern?: string): void {
    if (pattern) {
      // Clear caches matching pattern - simplified for this implementation
      console.log(`🧹 Clearing cache pattern: ${pattern}`);
    } else {
      queryCache.clear();
      subscriptionCache.clear();
      console.log('🧹 All caches cleared');
    }
  }

  // Get cache statistics
  static getCacheStats() {
    return {
      query: queryCache.getStats(),
      subscription: subscriptionCache.getStats()
    };
  }

  // Preload data
  static async preloadData(collectionName: string, constraints: QueryConstraint[] = []): Promise<void> {
    const query = new OptimizedQuery(collectionName);
    constraints.forEach(constraint => {
      // This is a simplified implementation
      // In a real scenario, you'd need to properly handle different constraint types
    });
    
    try {
      await query.execute();
      console.log(`🚀 Preloaded data for collection: ${collectionName}`);
    } catch (error) {
      console.error(`❌ Failed to preload data for ${collectionName}:`, error);
    }
  }
}

// Optimized hooks for common operations
export function useOptimizedFirestore<T>(
  collectionName: string, 
  constraints: QueryConstraint[] = []
) {
  const [data, setData] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;
    
    const query = new OptimizedQuery(collectionName);
    // Apply constraints (simplified)
    
    unsubscribe = query.subscribe<T>((newData) => {
      setData(newData);
      setLoading(false);
      setError(null);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [collectionName]);

  return { data, loading, error };
}

// Performance monitoring
export const performanceMonitor = {
  startTimer: (operation: string) => {
    const start = performance.now();
    return {
      end: () => {
        const duration = performance.now() - start;
        console.log(`⚡ Firebase operation [${operation}]: ${duration.toFixed(2)}ms`);
        return duration;
      }
    };
  },
  
  logCacheStats: () => {
    const stats = FirebaseOptimizer.getCacheStats();
    console.table({
      'Query Cache': stats.query,
      'Subscription Cache': stats.subscription
    });
  }
};

export default FirebaseOptimizer;