'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

/**
 * Captures whether an element was already visible in the viewport at page
 * load (before any user scrolling), for a one-time "already on screen at
 * load" entrance animation — as opposed to a reveal-on-scroll effect that
 * re-triggers for anything scrolled to later. The determination is made
 * once, ~200ms after mount, and locked in permanently after that; it never
 * re-evaluates on later scrolling, so an element scrolled into view later
 * doesn't retroactively count as "initially visible." The 200ms delay
 * (rather than reading `isInView` on the very first render) matters:
 * IntersectionObserver's first callback fires asynchronously, not
 * synchronously on mount, so checking immediately would almost always
 * read the hook's unset default instead of a real observation.
 */
export function useWasInitiallyVisible<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const isInView = useInView(ref);
  const isInViewRef = useRef(isInView);
  isInViewRef.current = isInView;

  const [wasInitiallyVisible, setWasInitiallyVisible] = useState<boolean | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setWasInitiallyVisible((prev) => (prev === null ? isInViewRef.current : prev));
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // Exposed as a true tri-state (not collapsed to a boolean): callers need
  // to tell "not determined yet" apart from "confirmed not visible", since
  // Framer Motion's `initial` prop only matters at mount - a caller can't
  // wait for this to resolve before deciding the mount-time `initial`
  // state, so every consumer should start in the same hidden pose and use
  // this value later to decide, via `animate`, whether to transition in
  // for real or snap instantly with no visible motion.
  return { ref, wasInitiallyVisible };
}
