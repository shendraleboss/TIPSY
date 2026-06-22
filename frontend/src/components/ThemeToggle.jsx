import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ThemeToggle = () => {
  const [theme, setTheme] = useState(
    localStorage.getItem('tipsy_theme') || 'dark'
  );

  useEffect(() => {
    const root = window.document.documentElement;
    
    // On nettoie l'ancienne classe et on ajoute la nouvelle
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    // On sauvegarde le choix dans le localStorage pour persister entre les sessions
    localStorage.setItem('tipsy_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button 
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full w-10 h-10"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-yellow-400 hover:text-yellow-300 transition-colors" />
      ) : (
        <Moon className="h-5 w-5 text-slate-700 hover:text-slate-900 transition-colors" />
      )}
    </Button>
  );
};