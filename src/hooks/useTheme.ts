import { useState } from 'react';
import type { Theme } from '../types';

/**
 * Hook para gerenciar o tema da aplicação
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark');

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return { theme, setTheme, toggleTheme };
}
