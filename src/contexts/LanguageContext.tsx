"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  loadingTranslations: boolean;
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
  const [loadingTranslations, setLoadingTranslations] = useState(true);

  const setLanguage = useCallback(async (languageCode: string) => {
    const isSupported = SUPPORTED_LANGUAGES.some(lang => lang.code === languageCode);
    if (!isSupported) {
      console.error(`Language ${languageCode} is not supported`);
      return;
    }

    setLoadingTranslations(true);
    setCurrentLanguage(languageCode);
    
    const newTranslations = await loadTranslations(languageCode);
    setCurrentTranslations(newTranslations);
    setLoadingTranslations(false);

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

    if (typeof window !== 'undefined') {
      localStorage.setItem('skillforge-language', languageCode);
    }
  }, [user, firebaseUser]);


  // Initialize language
  useEffect(() => {
    if (typeof window === 'undefined') {
        setLoadingTranslations(false);
        return;
    }
    
    let initialLanguage = DEFAULT_LANGUAGE;
    if (user?.preferences?.language) {
      initialLanguage = user.preferences.language;
    } else {
      initialLanguage = getBrowserLanguage();
    }
    setLanguage(initialLanguage);

  }, [user, setLanguage]);

  // Translation function
  const t = (key: string, params?: Record<string, string>): string => {
    if (loadingTranslations) {
        // Return a placeholder or empty string while loading
        return key.split('.').pop() || '';
    }

    let translation = currentTranslations[key] || key;
    
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(new RegExp(`{{${param}}}`, 'g'), value);
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
    loadingTranslations,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
