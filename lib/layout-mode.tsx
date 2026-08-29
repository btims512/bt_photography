'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type LayoutMode = 'classic' | 'modern';

const STORAGE_KEY = 'bt-layout-mode';

const LayoutModeContext = createContext<{
  mode: LayoutMode;
  toggle: () => void;
} | null>(null);

export function LayoutModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<LayoutMode>('classic');

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'classic' || stored === 'modern') {
      setMode(stored);
    }
  }, []);

  const toggle = () => {
    setMode((prev) => {
      const next = prev === 'classic' ? 'modern' : 'classic';
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  return (
    <LayoutModeContext.Provider value={{ mode, toggle }}>
      {children}
    </LayoutModeContext.Provider>
  );
}

export function useLayoutMode() {
  const ctx = useContext(LayoutModeContext);
  if (!ctx) {
    throw new Error('useLayoutMode must be used within LayoutModeProvider');
  }
  return ctx;
}
