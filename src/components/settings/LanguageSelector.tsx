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

export default function LanguageSelector() {
  const { currentLanguage, language, supportedLanguages, setLanguage, t } = useLanguage();

  const handleLanguageChange = (languageCode: string) => {
    setLanguage(languageCode);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="language-select">{t('settings.language')}</Label>
      <Select value={currentLanguage} onValueChange={handleLanguageChange}>
        <SelectTrigger id="language-select" className="w-full">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span>{language.flag}</span>
              <span>{language.nativeName}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {supportedLanguages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <div className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.nativeName}</span>
                <span className="text-muted-foreground">({lang.name})</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">
        {t('settings.selectLanguage')}
      </p>
    </div>
  );
}