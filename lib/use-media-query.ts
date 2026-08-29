'use client';

import { useEffect, useState } from 'react';

/**
 * SSR-safe media query hook. Returns `defaultValue` for the very first
 * render (server and client must agree to avoid a hydration mismatch),
 * then syncs to the real value after mount and stays in sync as the
 * viewport crosses the breakpoint (e.g. rotating a phone, resizing a
 * window) rather than only checking once.
 */
export function useMediaQuery(query: string, defaultValue: boolean): boolean {
  const [matches, setMatches] = useState(defaultValue);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
