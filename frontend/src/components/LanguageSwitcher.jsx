import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  
  // Get current language properly, accounting for language codes like 'en-US'
  const currentLang = i18n.language?.split('-')[0] || 'en';

  const toggleLanguage = async () => {
    const newLang = currentLang === 'en' ? 'fr' : 'en';
    await i18n.changeLanguage(newLang);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="rounded-full"
      data-testid="language-switcher"
    >
      <Globe className="h-4 w-4 mr-2" />
      {currentLang === 'en' ? 'FR' : 'EN'}
    </Button>
  );
};