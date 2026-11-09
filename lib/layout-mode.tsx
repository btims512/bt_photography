'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const LayoutModeContext = createContext<{
  /** True once the header's own entrance sequence (logo lines, then nav) has
   *  finished, so page content can hold its reveal until the header is done. */
  headerReady: boolean;
  markHeaderReady: () => void;
} | null>(null);

// Safety net: if the header's onAnimationComplete callback never fires for
// any reason, don't leave the page content invisible forever.
const HEADER_READY_FALLBACK_MS = 2200;

export function LayoutModeProvider({ children }: { children: ReactNode }) {
  const [headerReady, setHeaderReady] = useState(false);

  // The alternate layout this used to switch to is gone. A visitor who saved
  // it would otherwise carry a dead preference around forever.
  useEffect(() => {
    try {
      window.localStorage.removeItem('bt-layout-mode');
    } catch {}
  }, []);

  useEffect(() => {
    const fallback = setTimeout(() => setHeaderReady(true), HEADER_READY_FALLBACK_MS);
    return () => clearTimeout(fallback);
  }, []);

  const markHeaderReady = () => setHeaderReady(true);

  return (
    <LayoutModeContext.Provider value={{ headerReady, markHeaderReady }}>
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
