"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { updateUserProfile } from '@/lib/auth';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, getBrowserLanguage } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';

interface LanguageContextType {
  currentLanguage: string;
  language: Language;
  supportedLanguages: Language[];
  setLanguage: (languageCode: string) => Promise<void>;
  t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

// Translations storage
let translations: Record<string, Record<string, string>> = {};

// Load translations dynamically
const loadTranslations = async (languageCode: string) => {
  if (translations[languageCode]) {
    return translations[languageCode];
  }

  try {
    const module = await import(`@/locales/${languageCode}.json`);
    translations[languageCode] = module.default;
    return translations[languageCode];
  } catch (error) {
    console.warn(`Failed to load translations for ${languageCode}, falling back to English`);
    if (languageCode !== DEFAULT_LANGUAGE) {
      return loadTranslations(DEFAULT_LANGUAGE);
    }
    return {};
  }
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { user, firebaseUser } = useAuth();
  const [currentLanguage, setCurrentLanguage] = useState<string>(DEFAULT_LANGUAGE);
  const [currentTranslations, setCurrentTranslations] = useState<Record<string, string>>({});

  // Initialize language from user preferences or browser
  useEffect(() => {
    // Skip initialization during SSR
    if (typeof window === 'undefined') {
      return;
    }

    const initializeLanguage = async () => {
      let initialLanguage = DEFAULT_LANGUAGE;
      
      if (user?.preferences?.language) {
        initialLanguage = user.preferences.language;
      } else {
        initialLanguage = getBrowserLanguage();
      }

      setCurrentLanguage(initialLanguage);
      const translations = await loadTranslations(initialLanguage);
      setCurrentTranslations(translations);
    };

    initializeLanguage();
  }, [user]);

  const setLanguage = async (languageCode: string) => {
    // Validate language code
    const isSupported = SUPPORTED_LANGUAGES.some(lang => lang.code === languageCode);
    if (!isSupported) {
      console.error(`Language ${languageCode} is not supported`);
      return;
    }

    setCurrentLanguage(languageCode);
    
    // Load new translations
    const newTranslations = await loadTranslations(languageCode);
    setCurrentTranslations(newTranslations);

    // Update user preferences if authenticated
    if (firebaseUser && user) {
      try {
        await updateUserProfile(firebaseUser.uid, {
          preferences: {
            ...user.preferences,
            language: languageCode
          }
        });
      } catch (error) {
        console.error('Failed to update user language preference:', error);
      }
    }

    // Store in localStorage for non-authenticated users
    if (typeof window !== 'undefined') {
      localStorage.setItem('skillforge-language', languageCode);
    }
  };

  // Translation function
  const t = (key: string, params?: Record<string, string>): string => {
    let translation = currentTranslations[key] || key;
    
    // Replace parameters in translation
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{{${param}}}`, value);
      });
    }
    
    return translation;
  };

  const language = SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  const value: LanguageContextType = {
    currentLanguage,
    language,
    supportedLanguages: SUPPORTED_LANGUAGES,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};