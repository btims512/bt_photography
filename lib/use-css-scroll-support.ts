'use client';

import { useEffect, useState } from 'react';

/**
 * Detects native CSS scroll-driven animation support (`animation-timeline:
 * view()`). Where supported, scroll-linked effects should run as pure CSS
 * instead of a JS scroll listener - CSS scroll-timelines run entirely on
 * the compositor thread, immune to main-thread jank and to iOS Safari's
 * documented bug where `scrollY` stops updating consistently during fast
 * scrolling (the actual cause of janky JS-driven scroll animation on
 * mobile, not something tunable away with easing/spring parameters).
 * Defaults to false (the JS fallback) until confirmed client-side, so
 * server and client agree on the first render.
 */
export function useCssScrollTimelineSupport(): boolean {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()'));
  }, []);

  return supported;
}
