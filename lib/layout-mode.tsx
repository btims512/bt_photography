'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type LayoutMode = 'classic' | 'modern';

const STORAGE_KEY = 'bt-layout-mode';

const LayoutModeContext = createContext<{
  mode: LayoutMode;
  toggle: () => void;
  /** True once the header's own entrance sequence (logo lines, then nav) has
   *  finished, so page content can hold its reveal until the header is done. */
  headerReady: boolean;
  markHeaderReady: () => void;
} | null>(null);

// Safety net: if the header's onAnimationComplete callback never fires for
// any reason, don't leave the page content invisible forever.
const HEADER_READY_FALLBACK_MS = 2200;

export function LayoutModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<LayoutMode>('classic');
  const [headerReady, setHeaderReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'classic' || stored === 'modern') {
      setMode(stored);
    }
  }, []);

  useEffect(() => {
    const fallback = setTimeout(() => setHeaderReady(true), HEADER_READY_FALLBACK_MS);
    return () => clearTimeout(fallback);
  }, []);

  const toggle = () => {
    setMode((prev) => {
      const next = prev === 'classic' ? 'modern' : 'classic';
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  const markHeaderReady = () => setHeaderReady(true);

  return (
    <LayoutModeContext.Provider value={{ mode, toggle, headerReady, markHeaderReady }}>
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
