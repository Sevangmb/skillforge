"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { updateUserProfile } from '@/lib/auth';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, getBrowserLanguage } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';
// Import translations statically for immediate availability
import enTranslations from '@/locales/en.json';
import frTranslations from '@/locales/fr.json';

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

// Translations storage with preloaded data
const translations: Record<string, any> = {
  en: enTranslations,
  fr: frTranslations,
};

// Get translations synchronously
const getTranslations = (languageCode: string): any => {
  return translations[languageCode] || translations[DEFAULT_LANGUAGE] || {};
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { user, firebaseUser } = useAuth();
  
  // Initialize with proper language and translations immediately
  const getInitialLanguage = (): string => {
    if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
    
    if (user?.preferences?.language) {
      return user.preferences.language;
    }
    
    const storedLanguage = localStorage.getItem('skillforge-language');
    if (storedLanguage && SUPPORTED_LANGUAGES.find(lang => lang.code === storedLanguage)) {
      return storedLanguage;
    }
    
    return getBrowserLanguage();
  };

  const [currentLanguage, setCurrentLanguage] = useState<string>(getInitialLanguage);
  const [currentTranslations, setCurrentTranslations] = useState<any>(
    () => getTranslations(getInitialLanguage())
  );

  // Update language when user changes
  useEffect(() => {
    if (user?.preferences?.language && user.preferences.language !== currentLanguage) {
      const newLanguage = user.preferences.language;
      setCurrentLanguage(newLanguage);
      setCurrentTranslations(getTranslations(newLanguage));
    }
  }, [user?.preferences?.language, currentLanguage]);

  const setLanguage = async (languageCode: string) => {
    // Validate language code
    const isSupported = SUPPORTED_LANGUAGES.some(lang => lang.code === languageCode);
    if (!isSupported) {
      console.error(`Language ${languageCode} is not supported`);
      return;
    }

    setCurrentLanguage(languageCode);
    
    // Get new translations synchronously
    const newTranslations = getTranslations(languageCode);
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

  // Translation function with nested object support
  const t = (key: string, params?: Record<string, string>): string => {
    // Fallback to default language if current translations are empty
    const activeTranslations = currentTranslations && typeof currentTranslations === 'object' 
      ? currentTranslations 
      : getTranslations(DEFAULT_LANGUAGE);
    
    // Handle nested keys like 'common.loading'
    let translation: any = activeTranslations;
    const keys = key.split('.');
    
    for (const k of keys) {
      if (translation && typeof translation === 'object') {
        translation = translation[k];
      } else {
        translation = undefined;
        break;
      }
    }
    
    // Final fallback to key itself if translation not found
    if (translation === undefined || translation === null) {
      translation = key;
    }
    
    // Ensure we have a string
    if (typeof translation !== 'string') {
      translation = key;
    }
    
    // Replace parameters in translation
    if (params && typeof translation === 'string') {
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