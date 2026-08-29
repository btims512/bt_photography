'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useInView, useScroll, useSpring, useTransform } from 'framer-motion';
import { BLUR_DATA_URL } from '@/lib/blur';
import { useLayoutMode } from '@/lib/layout-mode';
import { useCssScrollTimelineSupport } from '@/lib/use-css-scroll-support';
import { useMediaQuery } from '@/lib/use-media-query';
import type { Photo } from '@/lib/photos';

interface BreakoutPhotoProps {
  photo: Photo;
  priority?: boolean;
  onClick: () => void;
}

/**
 * A full-bleed-ish photo that breaks up the grid with a scroll-linked
 * pan/zoom (panning down through an oversized version of the image while
 * zooming in through the first half of the scroll and back out through the
 * second) instead of flashing past like a regular grid photo. Sits within
 * the page's normal side padding, same as the grid photos, rather than
 * stretching full-bleed.
 *
 * Desktop additionally pins itself to the viewport (position: sticky) so
 * it holds the screen for an extended "dwell" while you keep scrolling
 * through it, then releases back into the grid. Mobile deliberately does
 * NOT do this: iOS 26 Safari has a confirmed, currently-unpatched WebKit
 * bug where position: sticky/fixed elements near full viewport height
 * render incorrectly against its new floating bottom navigation controls
 * (tracked in e.g. mastodon/mastodon#36144 and Apple Developer Forums
 * thread 800798 - no reliable CSS workaround exists as of this writing).
 * That's what was actually causing the persistent gap on mobile, not a
 * sizing issue - dvh vs svh tuning never had a chance of fixing it, since
 * the bug is in Safari's sticky implementation itself. Mobile instead uses
 * a single normal-flow panel with no sticky/fixed positioning anywhere,
 * sidestepping the buggy mechanism entirely, trading the pin/dwell for
 * guaranteed-correct rendering. Desktop is unaffected by this bug and
 * keeps the full pin effect.
 *
 * The pan/zoom itself runs as native CSS scroll-driven animation wherever
 * the browser supports it (see lib/use-css-scroll-support.ts and the
 * .breakout-* rules in globals.css) instead of a JS scroll listener, since
 * that runs entirely on the compositor thread - immune to both main-thread
 * jank and iOS Safari's separate documented bug where scrollY stops
 * updating consistently during fast/momentum scrolling. Browsers without
 * support (checked via CSS.supports, defaulting to the JS path on the
 * server/first render) fall back to the original Framer Motion
 * useScroll/useSpring implementation.
 *
 * Desktop's pin/frame heights use `svh` (small viewport height - fixed at
 * the browser chrome's fully-expanded size), not `dvh`: `dvh` recalculates
 * live as Safari's address bar collapses/expands mid-scroll, and sticky's
 * release point depends on a stable frame/container height relationship -
 * svh avoids that drift (a separate, real fix, even though it wasn't the
 * fix for the mobile gap specifically).
 */
export default function BreakoutPhoto({ photo, priority, onClick }: BreakoutPhotoProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)', false);
  const pinRef = useRef<HTMLDivElement>(null);
  const cssSupported = useCssScrollTimelineSupport();

  // Desktop tracks progress across the whole pin container (the sticky
  // frame's sticky/dwell duration); mobile, with no pin, just tracks this
  // single panel's own passage through the viewport - a standard "start
  // entering from below" to "finish exiting above" range.
  const { scrollYProgress } = useScroll({
    target: pinRef,
    offset: isDesktop ? ['start start', 'end end'] : ['start end', 'end start'],
  });
  // Raw scroll progress updates in whatever-sized jumps the browser's
  // scroll events happen to fire in, which reads as jittery on a large,
  // full-bleed element. Springing it smooths that out into a fluid motion
  // rather than a series of little jumps. Only used on the JS fallback
  // path - the CSS path doesn't need it, since a compositor-driven
  // timeline doesn't have discrete "jumps" to smooth in the first place.
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 200, damping: 30, mass: 0.5 });
  const y = useTransform(smoothProgress, [0, 1], ['25%', '-25%']);
  const scale = useTransform(smoothProgress, [0, 0.5, 1], [1, 1.18, 1]);

  // Waits for the header's entrance sequence to finish (the same rule grid
  // photos follow) so this doesn't appear ready before the grid above it
  // has, even though its image bytes may load quickly on their own.
  const isInView = useInView(pinRef, { margin: '200px' });
  const { headerReady } = useLayoutMode();
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (isInView && headerReady) setRevealed(true);
  }, [isInView, headerReady]);

  const image = (
    <Image
      src={photo.src}
      alt={photo.alt}
      fill
      sizes="(max-width: 767px) calc(100vw - 48px), calc(100vw - 100px)"
      className="photo-protected object-cover"
      draggable={false}
      priority={priority}
      loading={priority ? undefined : 'eager'}
      quality={82}
      placeholder="blur"
      blurDataURL={BLUR_DATA_URL}
    />
  );

  const panLayer = cssSupported ? (
    <div className="breakout-pan-layer absolute inset-x-0 top-[-50%] h-[200%]">{image}</div>
  ) : (
    <motion.div
      style={{ y, scale, willChange: 'transform' }}
      className="absolute inset-x-0 top-[-50%] h-[200%]"
    >
      {image}
    </motion.div>
  );

  if (!isDesktop) {
    return (
      <motion.div
        ref={pinRef}
        onClick={onClick}
        onContextMenu={(e) => e.preventDefault()}
        className={`relative h-[60svh] w-full cursor-pointer overflow-hidden bg-[var(--bg)] ${cssSupported ? 'breakout-timeline-subject' : ''}`}
        initial={{ opacity: 0, y: 40 }}
        animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        {panLayer}
      </motion.div>
    );
  }

  return (
    <div
      ref={pinRef}
      className={`relative h-[220svh] ${cssSupported ? 'breakout-timeline-subject' : ''}`}
    >
      <motion.div
        onClick={onClick}
        onContextMenu={(e) => e.preventDefault()}
        className="sticky top-0 h-[100svh] w-full cursor-pointer overflow-hidden bg-[var(--bg)]"
        initial={{ y: '100%' }}
        animate={{ y: revealed ? '0%' : '100%' }}
        transition={{ duration: 0.85, ease: 'easeOut' }}
      >
        {panLayer}
      </motion.div>
    </div>
  );
}
