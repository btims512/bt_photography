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
 * A photo that breaks up the grid with a scroll-linked pan/zoom instead of
 * flashing past like a regular grid photo. Sits within the page's normal
 * side padding, same as the grid photos, rather than stretching full-bleed.
 *
 * Desktop and mobile deliberately differ, not just in sizing:
 *
 * Desktop fills its frame with object-cover (cropping to fill) and pans
 * down through an oversized version of the image while zooming in through
 * the first half of the scroll and back out through the second, additionally
 * pinning itself to the viewport (position: sticky) so it holds the screen
 * for an extended "dwell" while you keep scrolling, then releases back into
 * the grid.
 *
 * Mobile shows the complete photo instead (object-contain, full viewport
 * height) with only a gentle zoom pulse - no pan, no crop, no sticky pin.
 * Panning only made sense as a way to reveal portions of the image hidden
 * by object-cover's crop; with object-contain there's nothing hidden left
 * to pan across. And no pin: iOS 26 Safari has a confirmed, currently-
 * unpatched WebKit bug where position: sticky/fixed elements near full
 * viewport height render incorrectly against its new floating bottom
 * navigation controls (tracked in e.g. mastodon/mastodon#36144 and Apple
 * Developer Forums thread 800798 - no reliable CSS workaround exists as of
 * this writing). That bug, not a sizing issue, was the real cause of a
 * persistent gap after the breakout on mobile in earlier attempts - mobile
 * now uses a single normal-flow panel with no sticky/fixed positioning
 * anywhere, sidestepping it entirely. Desktop is unaffected by this bug.
 *
 * The zoom/pan itself runs as native CSS scroll-driven animation wherever
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
 * svh avoids that drift (a separate, real fix, unrelated to the mobile gap
 * above, which svh alone didn't resolve since the cause was the sticky bug
 * itself, not a height calculation).
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
  // Smaller peak than desktop's: this scales the whole contained image
  // (including its letterbox margins), not just a crop-filled frame.
  const mobileScale = useTransform(smoothProgress, [0, 0.5, 1], [1, 1.12, 1]);

  // Waits for the header's entrance sequence to finish (the same rule grid
  // photos follow) so this doesn't appear ready before the grid above it
  // has, even though its image bytes may load quickly on their own.
  const isInView = useInView(pinRef, { margin: '200px' });
  const { headerReady } = useLayoutMode();
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (isInView && headerReady) setRevealed(true);
  }, [isInView, headerReady]);

  if (!isDesktop) {
    const mobileImage = (
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes="calc(100vw - 48px)"
        className="photo-protected object-contain"
        draggable={false}
        priority={priority}
        loading={priority ? undefined : 'eager'}
        quality={82}
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
      />
    );

    return (
      <motion.div
        ref={pinRef}
        onClick={onClick}
        onContextMenu={(e) => e.preventDefault()}
        className={`relative h-[100svh] w-full cursor-pointer overflow-hidden bg-[var(--bg)] ${cssSupported ? 'breakout-timeline-subject' : ''}`}
        initial={{ opacity: 0, y: 40 }}
        animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        {cssSupported ? (
          <div className="breakout-zoom-only-layer absolute inset-0">{mobileImage}</div>
        ) : (
          <motion.div
            style={{ scale: mobileScale, willChange: 'transform' }}
            className="absolute inset-0"
          >
            {mobileImage}
          </motion.div>
        )}
      </motion.div>
    );
  }

  const desktopImage = (
    <Image
      src={photo.src}
      alt={photo.alt}
      fill
      sizes="calc(100vw - 100px)"
      className="photo-protected object-cover"
      draggable={false}
      priority={priority}
      loading={priority ? undefined : 'eager'}
      quality={82}
      placeholder="blur"
      blurDataURL={BLUR_DATA_URL}
    />
  );

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
        {cssSupported ? (
          <div className="breakout-pan-layer absolute inset-x-0 top-[-50%] h-[200%]">{desktopImage}</div>
        ) : (
          <motion.div
            style={{ y, scale, willChange: 'transform' }}
            className="absolute inset-x-0 top-[-50%] h-[200%]"
          >
            {desktopImage}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
