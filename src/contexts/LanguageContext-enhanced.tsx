/**
 * SkillForge AI - Enhanced Language Context
 * Optimized React context for internationalization with intelligent caching and performance optimizations
 */

"use client";

import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback, 
  useMemo,
  useRef 
} from 'react';
import { useAuth } from './AuthContext';
import { updateUserProfile } from '@/lib/auth';
import { 
  SUPPORTED_LANGUAGES, 
  DEFAULT_LANGUAGE, 
  getBrowserLanguage,
  getTranslations,
  translateText,
  preloadTranslations,
  isLanguageSupported,
  type Language,
  type TranslationData,
  type TranslationKeys,
  type TranslationParams
} from '@/lib/i18n-enhanced';
import { logger } from '@/lib/logger';

interface LanguageContextType {
  // Current state
  readonly currentLanguage: string;
  readonly language: Language;
  readonly supportedLanguages: readonly Language[];
  
  // Loading states
  readonly loadingTranslations: boolean;
  readonly isChangingLanguage: boolean;
  
  // Error states
  readonly error: string | null;
  
  // Actions
  setLanguage: (languageCode: string) => Promise<void>;
  t: (key: TranslationKeys | string, params?: TranslationParams) => string;
  
  // Performance utilities
  preloadLanguage: (languageCode: string) => Promise<void>;
  getCurrentTranslations: () => TranslationData;
  
  // Debug utilities (development only)
  getCacheInfo: () => { size: number; languages: string[] };
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
  fallbackLanguage?: string;
  enablePreloading?: boolean;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ 
  children,
  fallbackLanguage = DEFAULT_LANGUAGE,
  enablePreloading = true
}) => {
  // Auth context
  const { user, firebaseUser } = useAuth();
  
  // State management
  const [currentLanguage, setCurrentLanguage] = useState<string>(fallbackLanguage);
  const [currentTranslations, setCurrentTranslations] = useState<TranslationData>({});
  const [fallbackTranslations, setFallbackTranslations] = useState<TranslationData>({});
  const [loadingTranslations, setLoadingTranslations] = useState(true);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Performance optimizations
  const isInitialized = useRef(false);
  const preloadPromises = useRef(new Map<string, Promise<void>>());
  
  // Memoized language object
  const language = useMemo(() => 
    SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage) || SUPPORTED_LANGUAGES[0],
    [currentLanguage]
  );

  /**
   * Get initial language from user preferences, localStorage, or browser
   */
  const getInitialLanguage = useCallback((): string => {
    if (typeof window === 'undefined') return fallbackLanguage;
    
    // Priority: User preference > localStorage > Browser > Fallback
    if (user?.preferences?.language && isLanguageSupported(user.preferences.language)) {
      return user.preferences.language;
    }
    
    const storedLanguage = localStorage.getItem('skillforge-language');
    if (storedLanguage && isLanguageSupported(storedLanguage)) {
      return storedLanguage;
    }
    
    const browserLanguage = getBrowserLanguage();
    if (isLanguageSupported(browserLanguage)) {
      return browserLanguage;
    }
    
    return fallbackLanguage;
  }, [user?.preferences?.language, fallbackLanguage]);

  /**
   * Load translations with error handling and caching
   */
  const loadTranslations = useCallback(async (
    languageCode: string, 
    setAsActive: boolean = true
  ): Promise<TranslationData> => {
    try {
      const translations = await getTranslations(languageCode);
      
      if (setAsActive) {
        setCurrentTranslations(translations);
        setError(null);
        
        logger.info('Translations loaded successfully', {
          action: 'translations_loaded',
          language: languageCode,
          keys: Object.keys(translations).length
        });
      }
      
      return translations;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown translation error';
      console.error(`Failed to load translations for ${languageCode}:`, err);
      
      if (setAsActive) {
        setError(errorMessage);
        
        logger.error('Translation loading failed', {
          action: 'translations_error',
          language: languageCode,
          error: errorMessage
        });
      }
      
      throw err;
    }
  }, []);

  /**
   * Change language with proper error handling and user persistence
   */
  const setLanguage = useCallback(async (languageCode: string): Promise<void> => {
    if (!isLanguageSupported(languageCode)) {
      const error = `Language ${languageCode} is not supported`;
      console.error(error);
      setError(error);
      return;
    }

    if (currentLanguage === languageCode) {
      return; // No change needed
    }

    setIsChangingLanguage(true);
    setError(null);

    try {
      // Load new translations
      await loadTranslations(languageCode, true);
      
      // Update state
      setCurrentLanguage(languageCode);
      
      // Persist to user profile if authenticated
      if (firebaseUser && user) {
        try {
          await updateUserProfile(firebaseUser.uid, {
            preferences: {
              ...user.preferences,
              language: languageCode
            }
          });
          
          logger.info('User language preference updated', {
            action: 'user_language_updated',
            userId: firebaseUser.uid,
            language: languageCode
          });
        } catch (profileError) {
          console.error('Failed to update user language preference:', profileError);
          // Don't throw - language change was successful locally
        }
      }

      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('skillforge-language', languageCode);
      }

      logger.info('Language changed successfully', {
        action: 'language_changed',
        from: currentLanguage,
        to: languageCode
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change language';
      setError(errorMessage);
      
      logger.error('Language change failed', {
        action: 'language_change_error',
        language: languageCode,
        error: errorMessage
      });
      
      throw err;
    } finally {
      setIsChangingLanguage(false);
    }
  }, [currentLanguage, firebaseUser, user, loadTranslations]);

  /**
   * Preload a language for better performance
   */
  const preloadLanguage = useCallback(async (languageCode: string): Promise<void> => {
    if (!isLanguageSupported(languageCode)) {
      return;
    }

    // Check if already preloading
    const existingPromise = preloadPromises.current.get(languageCode);
    if (existingPromise) {
      return existingPromise;
    }

    // Create preload promise
    const preloadPromise = loadTranslations(languageCode, false)
      .then(() => {
        preloadPromises.current.delete(languageCode);
      })
      .catch((err) => {
        preloadPromises.current.delete(languageCode);
        throw err;
      });

    preloadPromises.current.set(languageCode, preloadPromise);
    return preloadPromise;
  }, [loadTranslations]);

  /**
   * Enhanced translation function with fallback support
   */
  const t = useCallback((
    key: TranslationKeys | string, 
    params?: TranslationParams
  ): string => {
    if (loadingTranslations && !isInitialized.current) {
      // Return key's last part as placeholder while loading initially
      return key.split('.').pop() || key;
    }

    return translateText(currentTranslations, key, params, fallbackTranslations);
  }, [currentTranslations, fallbackTranslations, loadingTranslations]);

  /**
   * Get current translations (for debugging or advanced usage)
   */
  const getCurrentTranslations = useCallback((): TranslationData => {
    return { ...currentTranslations };
  }, [currentTranslations]);

  /**
   * Get cache information (development only)
   */
  const getCacheInfo = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      return {
        size: Object.keys(currentTranslations).length,
        languages: SUPPORTED_LANGUAGES
          .map(lang => lang.code)
          .filter(code => code === currentLanguage)
      };
    }
    return { size: 0, languages: [] };
  }, [currentTranslations, currentLanguage]);

  /**
   * Initialize translations on mount and user change
   */
  useEffect(() => {
    let isMounted = true;
    
    const initializeTranslations = async () => {
      if (isInitialized.current) return;
      
      setLoadingTranslations(true);
      
      try {
        const initialLanguage = getInitialLanguage();
        
        // Load fallback translations first
        if (initialLanguage !== fallbackLanguage) {
          const fallback = await loadTranslations(fallbackLanguage, false);
          if (isMounted) {
            setFallbackTranslations(fallback);
          }
        }
        
        // Load primary translations
        await loadTranslations(initialLanguage, true);
        
        if (isMounted) {
          setCurrentLanguage(initialLanguage);
          isInitialized.current = true;
          
          // Preload other languages if enabled
          if (enablePreloading) {
            const languagesToPreload = SUPPORTED_LANGUAGES
              .map(lang => lang.code)
              .filter(code => code !== initialLanguage && code !== fallbackLanguage)
              .slice(0, 2); // Limit initial preloading
            
            preloadTranslations(languagesToPreload).catch(err => {
              console.warn('Preloading failed:', err);
            });
          }
        }
        
      } catch (err) {
        console.error('Failed to initialize translations:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Translation initialization failed');
        }
      } finally {
        if (isMounted) {
          setLoadingTranslations(false);
        }
      }
    };

    initializeTranslations();
    
    return () => {
      isMounted = false;
    };
  }, [getInitialLanguage, fallbackLanguage, enablePreloading, loadTranslations]);

  // Create context value with memoization
  const contextValue = useMemo((): LanguageContextType => ({
    currentLanguage,
    language,
    supportedLanguages: SUPPORTED_LANGUAGES,
    loadingTranslations,
    isChangingLanguage,
    error,
    setLanguage,
    t,
    preloadLanguage,
    getCurrentTranslations,
    getCacheInfo
  }), [
    currentLanguage,
    language,
    loadingTranslations,
    isChangingLanguage,
    error,
    setLanguage,
    t,
    preloadLanguage,
    getCurrentTranslations,
    getCacheInfo
  ]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};