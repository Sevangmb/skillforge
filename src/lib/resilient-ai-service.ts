/**
 * Resilient AI Service with Circuit Breaker and Fallback Strategies
 */

import { CircuitBreaker, circuitBreakerRegistry, RetryStrategy } from './circuit-breaker';
import { getRandomFallbackQuestion } from '@/data/fallback-questions';
import type { QuizQuestion } from './types';
import type { GenerateQuizQuestionInput, GenerateExplanationInput, ExpandSkillTreeInput, ExpandSkillTreeOutput } from '@/app/actions';

// Cache interface for AI responses
interface AICache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlMs?: number): Promise<void>;
  invalidate(pattern: string): Promise<void>;
}

// Enhanced in-memory cache with smart TTL
class SmartMemoryCache implements AICache {
  private cache = new Map<string, { data: any; expires: number; hitCount: number; lastAccess: number }>();
  private hitCounts = new Map<string, number>();

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      this.hitCounts.delete(key);
      return null;
    }

    // Update access tracking
    item.hitCount++;
    item.lastAccess = Date.now();
    this.hitCounts.set(key, item.hitCount);

    return item.data as T;
  }

  async set<T>(key: string, data: T, ttlMs?: number): Promise<void> {
    const smartTTL = ttlMs || this.getSmartTTL(key);
    this.cache.set(key, {
      data,
      expires: Date.now() + smartTTL,
      hitCount: 0,
      lastAccess: Date.now()
    });
    this.hitCounts.set(key, 0);
  }

  private getSmartTTL(key: string): number {
    const hitCount = this.hitCounts.get(key) || 0;
    
    // Different TTL strategies based on content type and usage
    if (key.includes('quiz-question')) {
      return hitCount > 5 ? 1800000 : 600000; // 30min vs 10min for popular questions
    }
    
    if (key.includes('explanation')) {
      return hitCount > 3 ? 3600000 : 1800000; // 1hr vs 30min for explanations
    }
    
    if (key.includes('skill-tree')) {
      return 7200000; // 2 hours for skill tree expansions (more expensive to generate)
    }
    
    return 600000; // Default 10 minutes
  }

  async invalidate(pattern: string): Promise<void> {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        this.hitCounts.delete(key);
      }
    }
  }

  // Enhanced cleanup with LRU eviction for memory management
  cleanup(): void {
    const now = Date.now();
    const maxCacheSize = 1000; // Limit cache size
    
    // Remove expired entries
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
        this.hitCounts.delete(key);
      }
    }
    
    // LRU eviction if cache is too large
    if (this.cache.size > maxCacheSize) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].lastAccess - b[1].lastAccess);
      
      const entriesToRemove = sortedEntries.slice(0, this.cache.size - maxCacheSize);
      for (const [key] of entriesToRemove) {
        this.cache.delete(key);
        this.hitCounts.delete(key);
      }
    }
  }
  
  // Get cache statistics for monitoring
  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    return {
      size: this.cache.size,
      totalHits: Array.from(this.hitCounts.values()).reduce((sum, hits) => sum + hits, 0),
      avgHitsPerEntry: entries.length > 0 ? 
        Array.from(this.hitCounts.values()).reduce((sum, hits) => sum + hits, 0) / entries.length : 0,
      expiredEntries: entries.filter(([, item]) => now > item.expires).length
    };
  }
}

// AI Service Interface
interface AIService {
  generateQuestion(params: GenerateQuizQuestionInput): Promise<QuizQuestion>;
  generateExplanation(params: GenerateExplanationInput): Promise<string>;
  expandSkillTree(params: ExpandSkillTreeInput): Promise<ExpandSkillTreeOutput>;
}

// Fallback AI Service using static content
class FallbackAIService implements AIService {
  async generateQuestion(params: GenerateQuizQuestionInput): Promise<QuizQuestion> {
    // Using fallback question for skill - logged via performance monitoring
    return getRandomFallbackQuestion(params.competenceId);
  }

  async generateExplanation(params: GenerateExplanationInput): Promise<string> {
    return `The correct answer is "${params.correctAnswer}". This is a fundamental concept in ${params.topic}. Understanding this concept is important for building a strong foundation in this subject area.`;
  }

  async expandSkillTree(params: ExpandSkillTreeInput): Promise<ExpandSkillTreeOutput> {
    // Fallback skill expansion - generate basic follow-up skills
    const baseSkills = [
      {
        name: `Advanced ${params.completedCompetence}`,
        description: `Advanced concepts building on ${params.completedCompetence}`,
        icon: "🎯",
        cost: 50,
        category: "Advanced",
        prerequisites: [params.completedCompetence]
      },
      {
        name: `${params.completedCompetence} Applications`,
        description: `Practical applications of ${params.completedCompetence}`,
        icon: "🔧",
        cost: 30,
        category: "Practical",
        prerequisites: [params.completedCompetence]
      }
    ];

    return { newSkills: baseSkills };
  }
}

// Primary AI Service (Genkit implementation)
class GenkitAIService implements AIService {
  async generateQuestion(params: GenerateQuizQuestionInput): Promise<QuizQuestion> {
    // Import Genkit functions dynamically to avoid build issues
    const { generateQuizQuestion } = await import('@/ai/flows/generate-quiz-question');
    const result = await generateQuizQuestion(params);
    if (!result || !result.question || !result.options || typeof result.correctAnswer !== 'number' || !result.explanation) {
      throw new Error('Invalid question format from AI service');
    }
    return result as QuizQuestion;
  }

  async generateExplanation(params: GenerateExplanationInput): Promise<string> {
    const { generateExplanation } = await import('@/ai/flows/generate-explanation');
    const result = await generateExplanation(params);
    return result.explanation;
  }

  async expandSkillTree(params: ExpandSkillTreeInput): Promise<ExpandSkillTreeOutput> {
    const { expandSkillTree } = await import('@/ai/flows/expand-skill-tree');
    return await expandSkillTree(params);
  }
}

// Resilient AI Service with Circuit Breaker
export class ResilientAIService implements AIService {
  private primaryService: AIService;
  private fallbackService: AIService;
  private cache: AICache;
  private questionCircuitBreaker: CircuitBreaker;
  private explanationCircuitBreaker: CircuitBreaker;
  private skillTreeCircuitBreaker: CircuitBreaker;

  constructor() {
    this.primaryService = new GenkitAIService();
    this.fallbackService = new FallbackAIService();
    this.cache = new SmartMemoryCache();

    // Configure circuit breakers
    this.questionCircuitBreaker = circuitBreakerRegistry.getOrCreate('ai-questions', {
      failureThreshold: 3,
      resetTimeout: 30000, // 30 seconds
      monitoringWindow: 120000, // 2 minutes
      expectedErrors: ['timeout', 'rate_limit'] // These shouldn't open the circuit immediately
    });

    this.explanationCircuitBreaker = circuitBreakerRegistry.getOrCreate('ai-explanations', {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringWindow: 300000, // 5 minutes
      expectedErrors: ['timeout', 'rate_limit']
    });

    this.skillTreeCircuitBreaker = circuitBreakerRegistry.getOrCreate('ai-skill-tree', {
      failureThreshold: 2,
      resetTimeout: 120000, // 2 minutes
      monitoringWindow: 600000, // 10 minutes
      expectedErrors: ['timeout', 'rate_limit']
    });

      // Cleanup cache periodically with error handling
    const cleanupInterval = setInterval(() => {
      try {
        if ('cleanup' in this.cache && typeof this.cache.cleanup === 'function') {
          this.cache.cleanup();
        }
      } catch (error) {
        console.warn('Cache cleanup failed:', error);
      }
    }, 300000); // 5 minutes
    
    // Cleanup interval on process exit
    if (typeof process !== 'undefined') {
      process.on('exit', () => clearInterval(cleanupInterval));
    }
  }

  async generateQuestion(params: GenerateQuizQuestionInput): Promise<QuizQuestion> {
    const cacheKey = this.getQuestionCacheKey(params);
    
    // Try cache first with error handling
    try {
      const cached = await this.cache.get<QuizQuestion>(cacheKey);
      if (cached) {
        console.log('Using cached question for:', params.competenceId);
        return cached;
      }
    } catch (cacheError) {
      console.warn('Cache retrieval failed, proceeding without cache:', cacheError);
    }

    // Execute with circuit breaker and fallback
    const question = await this.questionCircuitBreaker.execute(
      async () => {
        return await RetryStrategy.withExponentialBackoff(
          () => this.primaryService.generateQuestion(params),
          2, // max retries
          1000 // base delay
        );
      },
      () => this.fallbackService.generateQuestion(params)
    );

    // Cache successful result with error handling
    if (question) {
      try {
        await this.cache.set(cacheKey, question, 300000); // 5 minutes
      } catch (cacheError) {
        console.warn('Cache storage failed:', cacheError);
      }
    }

    return question;
  }

  async generateExplanation(params: GenerateExplanationInput): Promise<string> {
    const cacheKey = this.getExplanationCacheKey(params);
    
    // Try cache first
    const cached = await this.cache.get<string>(cacheKey);
    if (cached) {
      console.log('Using cached explanation for:', params.topic);
      return cached;
    }

    // Execute with circuit breaker and fallback
    const explanation = await this.explanationCircuitBreaker.execute(
      async () => {
        return await RetryStrategy.withExponentialBackoff(
          () => this.primaryService.generateExplanation(params),
          2, // max retries
          1000 // base delay
        );
      },
      () => this.fallbackService.generateExplanation(params)
    );

    // Cache successful result
    if (explanation) {
      await this.cache.set(cacheKey, explanation, 600000); // 10 minutes
    }

    return explanation;
  }

  async expandSkillTree(params: ExpandSkillTreeInput): Promise<ExpandSkillTreeOutput> {
    const cacheKey = this.getSkillTreeCacheKey(params);
    
    // Try cache first
    const cached = await this.cache.get<ExpandSkillTreeOutput>(cacheKey);
    if (cached) {
      console.log('Using cached skill tree expansion for:', params.completedCompetence);
      return cached;
    }

    // Execute with circuit breaker and fallback
    const result = await this.skillTreeCircuitBreaker.execute(
      async () => {
        return await RetryStrategy.withExponentialBackoff(
          () => this.primaryService.expandSkillTree(params),
          1, // max retries (lower for skill tree)
          2000 // base delay
        );
      },
      () => this.fallbackService.expandSkillTree(params)
    );

    // Cache successful result
    if (result) {
      await this.cache.set(cacheKey, result, 1800000); // 30 minutes
    }

    return result;
  }

  // Health check methods
  async healthCheck(): Promise<{
    primary: boolean;
    fallback: boolean;
    circuitBreakers: Record<string, any>;
  }> {
    const results = {
      primary: false,
      fallback: true, // Fallback is always available
      circuitBreakers: {
        questions: this.questionCircuitBreaker.getStats(),
        explanations: this.explanationCircuitBreaker.getStats(),
        skillTree: this.skillTreeCircuitBreaker.getStats()
      }
    };

    try {
      // Test primary service with a simple request
      await this.primaryService.generateQuestion({
        competenceId: 'health-check',
        userId: 'health-check',
        userLevel: 1,
        learningStyle: 'Visual',
        language: 'en'
      });
      results.primary = true;
    } catch (error) {
      console.warn('Primary AI service health check failed:', error);
    }

    return results;
  }

  // Cache management
  async clearCache(pattern?: string): Promise<void> {
    if (pattern) {
      await this.cache.invalidate(pattern);
    } else {
      await this.cache.invalidate('.*'); // Clear all
    }
  }

  // Circuit breaker management
  resetCircuitBreakers(): void {
    this.questionCircuitBreaker.forceClose();
    this.explanationCircuitBreaker.forceClose();
    this.skillTreeCircuitBreaker.forceClose();
  }

  getCircuitBreakerStats() {
    return {
      questions: this.questionCircuitBreaker.getStats(),
      explanations: this.explanationCircuitBreaker.getStats(),
      skillTree: this.skillTreeCircuitBreaker.getStats()
    };
  }

  // Private helper methods
  private getQuestionCacheKey(params: GenerateQuizQuestionInput): string {
    return `question:${params.competenceId}:${params.userLevel}:${params.learningStyle}:${params.language}`;
  }

  private getExplanationCacheKey(params: GenerateExplanationInput): string {
    // Create a hash of the question and answers for caching
    const content = `${params.topic}:${params.question}:${params.answer}:${params.correctAnswer}`;
    const hash = this.simpleHash(content);
    return `explanation:${hash}`;
  }

  private getSkillTreeCacheKey(params: ExpandSkillTreeInput): string {
    const content = `${params.completedCompetence}:${params.userId}:${params.userRequest || 'none'}`;
    const hash = this.simpleHash(content);
    return `skilltree:${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString();
  }
}

// Global instance
export const resilientAIService = new ResilientAIService();

// Performance monitoring wrapper
export class PerformanceMonitor {
  static measureAIOperation(operationName: string) {
    const start = performance.now();
    
    return {
      end: (success: boolean = true) => {
        const duration = performance.now() - start;
        
        // Log performance metrics
        console.log(`AI Operation [${operationName}]: ${duration.toFixed(2)}ms`, {
          success,
          timestamp: new Date().toISOString()
        });

        // Send to analytics if available
        if (typeof window !== 'undefined' && 'sendBeacon' in navigator) {
          navigator.sendBeacon('/api/metrics', JSON.stringify({
            type: 'ai_operation',
            name: operationName,
            duration,
            success,
            timestamp: Date.now()
          }));
        }
      }
    };
  }
}