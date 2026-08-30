'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { motion, useInView, useScroll, useSpring, useTransform } from 'framer-motion';
import { BLUR_DATA_URL } from '@/lib/blur';
import { useLayoutMode } from '@/lib/layout-mode';
import { useCssScrollTimelineSupport } from '@/lib/use-css-scroll-support';
import type { Photo } from '@/lib/photos';

interface DesktopRailProps {
  photos: Photo[];
  onOpen: (photo: Photo) => void;
}

// The pinned frame's height, as svh. Exactly one viewport, which is what
// lets this use `contain 0% contain 100%` for its range - that only equals
// the real sticky engage/release points when the sticky child is exactly
// full viewport height (MobileRail has to compute `cover X%` positions by
// hand precisely because that assumption doesn't hold there).
const FRAME_SVH = 100;
// How fast the strip travels against the scroll. 1 would be exactly
// 1:1 - the photo moving with your finger - but a portrait photo at full
// desktop width is about 2.4 viewports tall, so revealing four of them
// end to end at 1:1 would make one carousel roughly ten viewports of
// scroll. 2 halves that while still reading as a scroll rather than a
// jump. Raise it for a shorter, faster section; lower it toward 1 for a
// more literal, slower one.
const PAN_RATE = 2;
// Vertical gap between photos, in px. Small, because the photos either
// side of it are full-bleed: a wide band between them reads as a pause in
// the travel rather than a seam.
const GAP_PX = 28;

// Where the slide sits within the dwell. Everything before SLIDE_START is
// the two staged reveals (backdrop, then photos); everything after
// SLIDE_END is those same two collapsing again, in reverse order. The
// dwell is scaled up by the leftover span so the slide keeps its
// per-photo pace instead of being squeezed - same arrangement as
// MobileRail's RAIL_INTRO_FRACTION, and the numbers here likewise have to
// match the keyframe stops in globals.css by hand, since CSS keyframe
// percentages can't read a value from JS.
const SLIDE_START = 0.2;
const SLIDE_END = 0.8;

/**
 * Desktop counterpart to MobileRail: same idea - a pinned frame whose
 * inner track slides while the page scrolls - but travelling vertically
 * rather than horizontally, and opening with a two-stage corner reveal.
 *
 * The order, and it is the whole point of the effect:
 *   1. The section arrives on the page's own light background.
 *   2. A black backdrop wipes in from the top-right corner until it fills
 *      the frame.
 *   3. The photo wipes in from that same corner until it is fully shown.
 *   4. The photos slide upward, one to the next.
 *   5. The photo wipes out into the *bottom-left* corner.
 *   6. The backdrop follows it out through the same corner, and the page
 *      colour is back.
 *
 * Entering by one corner and leaving by the opposite one is deliberate:
 * the section reads as something passing through rather than something
 * that opened and shut in place.
 *
 * Both wipes are clip-path: inset(), not a scale. A scale would enlarge
 * the photo itself - the previous desktop treatment did exactly that, and
 * this replaces it - whereas an inset clip holds the photo at its final
 * size throughout and only changes how much of it is uncovered, so it
 * reads as the frame opening rather than the image zooming.
 *
 * inset() takes its four sides as top/right/bottom/left, which is what
 * makes one property serve both corners: growing from the top-right means
 * relaxing the *bottom* and *left* insets (0% 0% 100% 100% -> 0% 0% 0% 0%),
 * and collapsing into the bottom-left means tightening the *top* and
 * *right* ones (0% 0% 0% 0% -> 100% 100% 0% 0%). The keyframes below
 * animate clip-path directly rather than driving it through custom
 * properties - inset() interpolates natively between compatible shapes, so
 * there's nothing to gain from the indirection and one less place for a
 * registered-property quirk to bite (see the NOTE ON THE DARK BACKDROP in
 * globals.css for where that has already cost us once).
 *
 * Sits above the sticky header (z-[35] against its z-30), so the backdrop
 * really does take over the whole viewport rather than stopping short of
 * it - the same layering the desktop breakout used before this.
 */
export default function DesktopRail({ photos, onOpen }: DesktopRailProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const cssSupported = useCssScrollTimelineSupport();

  const gapCount = photos.length - 1;
  const slideSpan = SLIDE_END - SLIDE_START;

  // Every photo in a rail shares an aspect ratio (takeUniformRail groups
  // them that way), so one ratio sizes them all. At full-bleed width the
  // frame spans the viewport, which is what lets these be written in vw
  // and stay correct at any window size without measuring anything.
  const ratio = photos[0].width / photos[0].height;
  const photoHeight = `(100vw / ${ratio.toFixed(4)})`;
  // The strip is taller than the frame by exactly what has to travel past
  // it for every photo to be seen end to end.
  const travel = `(${photos.length} * ${photoHeight} + ${gapCount * GAP_PX}px - 100svh)`;
  const cssShiftValue = `calc(-1 * ${travel})`;
  // Scroll needed for that travel at PAN_RATE, then widened so the slide
  // occupies only its share of the dwell and the wipes keep the rest.
  const outerHeight = `calc(${FRAME_SVH}svh + ${travel} / ${PAN_RATE} / ${slideSpan.toFixed(4)})`;

  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ['start start', 'end end'],
  });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 200, damping: 30, mass: 0.5 });

  // JS-fallback equivalents of the three scroll-driven CSS animations, each
  // mirroring its keyframe stops exactly. clip-path is built as a string
  // from a plain number rather than interpolated between two inset()
  // values, since a motion value can only tween numbers.
  const slide = useTransform(smoothProgress, [0, SLIDE_START, SLIDE_END, 1], [0, 0, 1, 1]);
  const trackTransform = useTransform(slide, (v) => `translateY(calc(${(-v).toFixed(4)} * ${travel}))`);
  const clipFrom = (inPct: number, outPct: number) =>
    `inset(${outPct.toFixed(2)}% ${outPct.toFixed(2)}% ${inPct.toFixed(2)}% ${inPct.toFixed(2)}%)`;
  const backdropIn = useTransform(smoothProgress, [0, 0.08, 1], [100, 0, 0]);
  const backdropOut = useTransform(smoothProgress, [0, 0.92, 1], [0, 0, 100]);
  const backdropClip = useTransform(() => clipFrom(backdropIn.get(), backdropOut.get()));
  const viewIn = useTransform(smoothProgress, [0, 0.08, 0.2, 1], [100, 100, 0, 0]);
  const viewOut = useTransform(smoothProgress, [0, 0.8, 0.92, 1], [0, 0, 100, 100]);
  const viewClip = useTransform(() => clipFrom(viewIn.get(), viewOut.get()));

  const isInView = useInView(outerRef, { margin: '200px' });
  const { headerReady } = useLayoutMode();
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (isInView && headerReady) setRevealed(true);
  }, [isInView, headerReady]);

  const panels = photos.map((photo, i) => (
    <div
      key={`${photo.src}-${i}`}
      className="dtrail-panel relative flex cursor-pointer items-center justify-center"
      onClick={() => onOpen(photo)}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="dtrail-photo-box relative">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="100vw"
          className="photo-protected object-cover"
          draggable={false}
          loading="eager"
          quality={82}
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
        />
      </div>
    </div>
  ));

  return (
    <div
      ref={outerRef}
      className={`dtrail-fullbleed relative ${cssSupported ? 'dtrail-timeline-subject' : ''}`}
      style={{ height: outerHeight }}
    >
      <motion.div
        className="dtrail-frame sticky top-0 z-[35] w-full overflow-hidden bg-[var(--bg)]"
        style={{ height: `${FRAME_SVH}svh`, '--dtrail-photo-h': `calc(${photoHeight})` } as CSSProperties}
        initial={{ opacity: 0 }}
        animate={{ opacity: revealed ? 1 : 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {cssSupported ? (
          <div className="dtrail-backdrop" />
        ) : (
          <motion.div className="dtrail-backdrop" style={{ clipPath: backdropClip }} />
        )}

        {cssSupported ? (
          <div className="dtrail-view">
            <div
              className="dtrail-track"
              style={{ gap: `${GAP_PX}px`, '--dtrail-shift': cssShiftValue } as CSSProperties}
            >
              {panels}
            </div>
          </div>
        ) : (
          <motion.div className="dtrail-view" style={{ clipPath: viewClip }}>
            <motion.div
              className="dtrail-track"
              style={{ gap: `${GAP_PX}px`, transform: trackTransform, willChange: 'transform' }}
            >
              {panels}
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
