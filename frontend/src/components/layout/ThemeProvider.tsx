'use client';

import React, { useEffect } from 'react';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'schedule-light' | 'schedule-dark' | null;
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  return <>{children}</>;
}
