"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Globe } from 'lucide-react';
import { useState } from 'react';

export default function LanguageSelector() {
  const { 
    currentLanguage, 
    language, 
    supportedLanguages, 
    setLanguage, 
    t, 
    loadingTranslations,
    isChangingLanguage,
    error,
    preloadLanguage 
  } = useLanguage();
  const [preloadedLanguages, setPreloadedLanguages] = useState<Set<string>>(new Set());

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await setLanguage(languageCode);
    } catch (err) {
      console.error('Failed to change language:', err);
    }
  };

  const handlePreloadLanguage = async (languageCode: string) => {
    if (preloadedLanguages.has(languageCode)) return;
    
    try {
      await preloadLanguage(languageCode);
      setPreloadedLanguages(prev => new Set(prev).add(languageCode));
    } catch (err) {
      console.warn('Failed to preload language:', languageCode, err);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label htmlFor="language-select" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          {t('settings.language')}
        </Label>
        {loadingTranslations && (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        )}
      </div>
      
      <Select 
        value={currentLanguage} 
        onValueChange={handleLanguageChange}
        disabled={isChangingLanguage}
      >
        <SelectTrigger id="language-select" className="w-full">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span className="text-lg">{language.flag}</span>
              <span className="font-medium">{language.nativeName}</span>
              {language.region && (
                <Badge variant="outline" className="text-xs">
                  {language.region}
                </Badge>
              )}
              {isChangingLanguage && (
                <Loader2 className="h-3 w-3 animate-spin ml-auto" />
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {supportedLanguages.map((lang) => {
            const isPreloaded = preloadedLanguages.has(lang.code);
            const isCurrent = lang.code === currentLanguage;
            
            return (
              <SelectItem 
                key={lang.code} 
                value={lang.code}
                onMouseEnter={() => handlePreloadLanguage(lang.code)}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{lang.flag}</span>
                    <div className="flex flex-col">
                      <span className={`font-medium ${isCurrent ? 'text-primary' : ''}`}>
                        {lang.nativeName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {lang.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {lang.region && (
                      <Badge variant="outline" className="text-xs">
                        {lang.region}
                      </Badge>
                    )}
                    {isCurrent && (
                      <Badge variant="default" className="text-xs">
                        Current
                      </Badge>
                    )}
                    {isPreloaded && !isCurrent && (
                      <div className="w-2 h-2 bg-green-500 rounded-full" title="Preloaded" />
                    )}
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      
      <div className="text-sm text-muted-foreground space-y-1">
        <p>{t('settings.selectLanguage')}</p>
        {error && (
          <p className="text-destructive text-xs bg-destructive/10 p-2 rounded">
            Error: {error}
          </p>
        )}
        {supportedLanguages.length > 2 && (
          <p className="text-xs text-muted-foreground">
            💡 Hover over languages to preload them for faster switching
          </p>
        )}
      </div>
    </div>
  );
}