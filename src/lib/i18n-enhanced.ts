/**
 * SkillForge AI - Enhanced Internationalization System
 * Performance-optimized translation system with type safety and intelligent caching
 */

export type Language = {
  readonly code: string;
  readonly name: string;
  readonly nativeName: string;
  readonly flag: string;
  readonly rtl?: boolean;
  readonly region?: string;
};

export const SUPPORTED_LANGUAGES: readonly Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    region: 'US'
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    region: 'FR'
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    region: 'ES'
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    region: 'DE'
  },
  {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    region: 'IT'
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇵🇹',
    region: 'PT'
  }
] as const;

export const DEFAULT_LANGUAGE = 'en' as const;

// Type-safe translation keys based on the English translation structure
export type TranslationKeys = 
  | 'common.welcome'
  | 'common.signin'
  | 'common.signup'
  | 'common.signout'
  | 'common.email'
  | 'common.password'
  | 'common.loading'
  | 'common.error'
  | 'common.success'
  | 'common.cancel'
  | 'common.save'
  | 'common.delete'
  | 'common.edit'
  | 'common.close'
  | 'common.back'
  | 'common.next'
  | 'common.previous'
  | 'common.search'
  | 'common.settings'
  | 'common.profile'
  | 'common.language'
  | 'common.theme'
  | 'auth.welcomeTitle'
  | 'auth.welcomeDescription'
  | 'auth.getStarted'
  | 'auth.createAccount'
  | 'auth.alreadyHaveAccount'
  | 'auth.dontHaveAccount'
  | 'auth.displayName'
  | 'auth.enterName'
  | 'auth.enterEmail'
  | 'auth.enterPassword'
  | 'auth.emailAlreadyInUse'
  | 'auth.weakPassword'
  | 'auth.invalidEmail'
  | 'auth.invalidCredentials'
  | 'auth.tooManyRequests'
  | 'auth.unexpectedError'
  | 'navigation.dashboard'
  | 'navigation.skillTree'
  | 'navigation.leaderboard'
  | 'navigation.profile'
  | 'navigation.settings'
  | 'navigation.daily'
  | 'navigation.skills'
  | 'skillTree.title'
  | 'skillTree.clickToStart'
  | 'skillTree.completed'
  | 'skillTree.available'
  | 'skillTree.locked'
  | 'skillTree.secret'
  | 'skillTree.prerequisites'
  | 'skillTree.cost'
  | 'skillTree.points'
  | 'skillTree.level'
  | 'quiz.title'
  | 'quiz.question'
  | 'quiz.submit'
  | 'quiz.correct'
  | 'quiz.incorrect'
  | 'quiz.explanation'
  | 'quiz.tryAgain'
  | 'quiz.continue'
  | 'quiz.complete'
  | 'quiz.score'
  | 'quiz.pointsEarned'
  | 'profile.displayName'
  | 'profile.email'
  | 'profile.totalPoints'
  | 'profile.level'
  | 'profile.completedSkills'
  | 'profile.learningStyle'
  | 'profile.favoriteTopics'
  | 'profile.adaptiveMode'
  | 'leaderboard.title'
  | 'leaderboard.rank'
  | 'leaderboard.player'
  | 'leaderboard.points'
  | 'leaderboard.level'
  | 'settings.title'
  | 'settings.language'
  | 'settings.selectLanguage'
  | 'settings.learningPreferences'
  | 'settings.learningStyle'
  | 'settings.favoriteTopics'
  | 'settings.adaptiveMode'
  | 'settings.notifications'
  | 'settings.privacy'
  | 'settings.account'
  | 'errors.loadingFailed'
  | 'errors.networkError'
  | 'errors.unauthorized'
  | 'errors.forbidden'
  | 'errors.notFound'
  | 'errors.serverError';

export type TranslationData = Record<string, any>;
export type TranslationParams = Record<string, string | number>;

// Translation cache with intelligent memory management
class TranslationCache {
  private cache = new Map<string, TranslationData>();
  private readonly maxSize = 6; // Max supported languages
  private accessTimes = new Map<string, number>();

  set(key: string, value: TranslationData): void {
    // LRU eviction if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const oldestKey = Array.from(this.accessTimes.entries())
        .sort(([, a], [, b]) => a - b)[0][0];
      
      this.cache.delete(oldestKey);
      this.accessTimes.delete(oldestKey);
    }

    this.cache.set(key, value);
    this.accessTimes.set(key, Date.now());
  }

  get(key: string): TranslationData | null {
    const value = this.cache.get(key);
    if (value) {
      this.accessTimes.set(key, Date.now()); // Update access time
      return value;
    }
    return null;
  }

  clear(): void {
    this.cache.clear();
    this.accessTimes.clear();
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  size(): number {
    return this.cache.size;
  }
}

// Global translation cache instance
const translationCache = new TranslationCache();

/**
 * Get language configuration by code
 */
export function getLanguage(code: string): Language | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

/**
 * Detect browser language with improved fallback logic
 */
export function getBrowserLanguage(): string {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  
  const navigatorLang = navigator.language || (navigator as any).browserLanguage;
  
  // Try exact match first
  const exactMatch = SUPPORTED_LANGUAGES.find(lang => lang.code === navigatorLang);
  if (exactMatch) return exactMatch.code;
  
  // Try language code without region (e.g., 'en-US' -> 'en')
  const langCode = navigatorLang.split('-')[0].toLowerCase();
  const langMatch = SUPPORTED_LANGUAGES.find(lang => lang.code === langCode);
  if (langMatch) return langMatch.code;
  
  // Try navigator.languages array
  if (navigator.languages) {
    for (const lang of navigator.languages) {
      const code = lang.split('-')[0].toLowerCase();
      const match = SUPPORTED_LANGUAGES.find(l => l.code === code);
      if (match) return match.code;
    }
  }
  
  return DEFAULT_LANGUAGE;
}

/**
 * Validate if a language is supported
 */
export function isLanguageSupported(code: string): boolean {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
}

/**
 * Get cached translations or fetch if not available
 */
export async function getTranslations(languageCode: string): Promise<TranslationData> {
  // Validate language code
  if (!isLanguageSupported(languageCode)) {
    console.warn(`Language ${languageCode} not supported, falling back to ${DEFAULT_LANGUAGE}`);
    languageCode = DEFAULT_LANGUAGE;
  }

  // Check cache first
  const cached = translationCache.get(languageCode);
  if (cached) {
    return cached;
  }

  try {
    // Dynamic import with intelligent fallback
    let translations: TranslationData;
    
    switch (languageCode) {
      case 'en':
        translations = (await import('@/locales/en.json')).default;
        break;
      case 'fr':
        translations = (await import('@/locales/fr.json')).default;
        break;
      case 'es':
        // Fallback to default if translation not available
        console.warn('Spanish translations not yet available, using English');
        translations = (await import('@/locales/en.json')).default;
        break;
      case 'de':
        console.warn('German translations not yet available, using English');
        translations = (await import('@/locales/en.json')).default;
        break;
      case 'it':
        console.warn('Italian translations not yet available, using English');
        translations = (await import('@/locales/en.json')).default;
        break;
      case 'pt':
        console.warn('Portuguese translations not yet available, using English');
        translations = (await import('@/locales/en.json')).default;
        break;
      default:
        translations = (await import('@/locales/en.json')).default;
    }

    translationCache.set(languageCode, translations);
    return translations;
    
  } catch (error) {
    console.error(`Failed to load translations for ${languageCode}:`, error);
    
    // Ultimate fallback to default language
    if (languageCode !== DEFAULT_LANGUAGE) {
      return getTranslations(DEFAULT_LANGUAGE);
    }
    
    // If even default language fails, return empty object
    return {};
  }
}

/**
 * Enhanced translation function with type safety and parameter interpolation
 */
export function translateText(
  translations: TranslationData,
  key: TranslationKeys | string,
  params?: TranslationParams,
  fallbackLang?: TranslationData
): string {
  // Handle nested keys like 'common.loading'
  let translation: any = translations;
  const keys = key.split('.');
  
  for (const k of keys) {
    if (translation && typeof translation === 'object') {
      translation = translation[k];
    } else {
      translation = undefined;
      break;
    }
  }
  
  // Fallback to fallback language if available
  if (translation === undefined && fallbackLang) {
    let fallbackTranslation: any = fallbackLang;
    for (const k of keys) {
      if (fallbackTranslation && typeof fallbackTranslation === 'object') {
        fallbackTranslation = fallbackTranslation[k];
      } else {
        fallbackTranslation = undefined;
        break;
      }
    }
    translation = fallbackTranslation;
  }
  
  // Final fallback to key itself
  if (translation === undefined || translation === null) {
    translation = key.split('.').pop() || key;
  }
  
  // Ensure we have a string
  if (typeof translation !== 'string') {
    translation = String(translation);
  }
  
  // Replace parameters using improved regex with better performance
  if (params && typeof translation === 'string') {
    for (const [param, value] of Object.entries(params)) {
      translation = translation.replace(
        new RegExp(`{{${param}}}`, 'g'), 
        String(value)
      );
    }
  }
  
  return translation;
}

/**
 * Preload translations for better performance
 */
export async function preloadTranslations(languageCodes: string[]): Promise<void> {
  const promises = languageCodes
    .filter(isLanguageSupported)
    .map(code => getTranslations(code));
    
  try {
    await Promise.all(promises);
  } catch (error) {
    console.error('Failed to preload some translations:', error);
  }
}

/**
 * Clear translation cache (useful for testing or memory management)
 */
export function clearTranslationCache(): void {
  translationCache.clear();
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStatistics(): { size: number; languages: string[] } {
  return {
    size: translationCache.size(),
    languages: Array.from(SUPPORTED_LANGUAGES)
      .map(lang => lang.code)
      .filter(code => translationCache.has(code))
  };
}