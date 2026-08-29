'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import { useLayoutMode } from './layout-mode';

/**
 * Mirrors the old `whileInView` + `viewport={{ once: true }}` reveal, but
 * also waits for the header's own entrance sequence to finish first, so
 * photos never start animating at the same time as the header/nav. Once
 * revealed it stays revealed (scrolling back up won't hide it again).
 */
export function useRevealWhenReady<T extends HTMLElement>(margin: `${number}px`) {
  const ref = useRef<T>(null);
  const isInView = useInView(ref, { margin });
  const { headerReady } = useLayoutMode();
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (isInView && headerReady) setRevealed(true);
  }, [isInView, headerReady]);

  return { ref, revealed };
}
