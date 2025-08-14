/**
 * SkillForge AI - Internationalization Configuration
 * Enhanced i18n system with better performance and type safety
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