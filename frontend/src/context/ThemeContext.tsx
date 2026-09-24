import React, { createContext, useState, useEffect } from 'react';

export type Theme = 'slate' | 'indigo' | 'emerald' | 'sunset' | 'crimson' | 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme;
    return saved || 'slate';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    const root = document.documentElement;
    const themeClasses = ['theme-slate', 'theme-indigo', 'theme-emerald', 'theme-sunset', 'theme-crimson', 'theme-light'];
    themeClasses.forEach((cls) => root.classList.remove(cls));
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
