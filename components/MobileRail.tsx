'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { motion, useInView, useScroll, useSpring, useTransform } from 'framer-motion';
import { BLUR_DATA_URL } from '@/lib/blur';
import { useLayoutMode } from '@/lib/layout-mode';
import { useCssScrollTimelineSupport } from '@/lib/use-css-scroll-support';
import type { Photo } from '@/lib/photos';

interface MobileRailProps {
  photos: Photo[];
  onOpen: (photo: Photo) => void;
}

// The pinned frame's height, as svh - full viewport, so there's no empty
// background gap below a shorter frame while it's pinned (an earlier,
// shorter version of this had exactly that gap).
const RAIL_FRAME_SVH = 100;
// Extra scroll consumed per photo-to-photo transition while pinned, as svh.
// Deliberately much shorter than a full screen per photo - enough dwell to
// keep the slide from being outrun by a fast scroll/swipe, without holding
// the rest of the page off-screen for as long as a full-viewport dwell
// would. Tune this (and RAIL_FRAME_SVH) if the pace feels off either way.
const RAIL_DWELL_PER_TRANSITION_SVH = 45;

// Horizontal gap between photos mid-slide, as cqw (% of the frame's own
// width, via `.rail-frame`'s container query context below). This is now
// the *only* thing separating one photo from the next: photos fill their
// panel's full width (see .rail-photo-box in globals.css), so the
// letterbox bars that used to sit inside each panel's edges and pad this
// out by another ~60px are gone. Raised from 7.5 to compensate - at 7.5
// the photos read as nearly touching once they filled their panels.
const RAIL_GAP_CQW = 12;

// One continuous wave, as a quadratic opener followed by smooth-quadratic
// (T) reflections that each mirror the previous control point - so the
// curve stays smooth across every joint without restating control points.
// Amplitude is deliberately shallow (y 1..11 around a midline of 6) so the
// line reads as a subtle texture in the black band rather than competing
// with the photo. Drawn wide (SQUIGGLE_VIEW_W units) and stretched to the
// frame by preserveAspectRatio="none"; the wave count is what survives
// that stretch, so more segments = tighter squiggle at any screen width.
const SQUIGGLE_VIEW_W = 240;
const SQUIGGLE_PATH = `M0 6 Q6 1 12 6 ${Array.from(
  { length: SQUIGGLE_VIEW_W / 12 - 1 },
  (_, i) => `T${(i + 2) * 12} 6`
).join(' ')}`;

/**
 * Mobile-only interlude between grid segments: a horizontal strip of
 * portrait photos, pinned to the viewport while an inner track slides left
 * as you scroll - based on the "Horizontal Scroll Section" pattern at
 * https://scroll-driven-animations.style/demos/horizontal-section/.
 *
 * This went through a couple of other shapes first, each solving one
 * requirement at the cost of another:
 * - No pin at all (tying the slide to the frame's own scroll passage, like
 *   BreakoutPhoto's mobile zoom) kept the grid always visible above/below,
 *   but a fast scroll could blow straight through the slide before it
 *   finished - there's no browser-native way to gate scroll progress
 *   behind an in-page animation without pinning something.
 * - A pinned frame shorter than the viewport (trying to keep some grid
 *   content peeking in around it) gated scroll correctly, but left an
 *   empty background gap below the frame for the whole dwell, since
 *   nothing else is pinned there to fill that space.
 *
 * This pins at full viewport height (RAIL_FRAME_SVH), the same tradeoff
 * BreakoutPhoto's desktop pin already makes: the grid above/below isn't
 * visible during the dwell, but there's no dead space either, and the
 * slide is still robustly gated by the browser's own scroll mechanism
 * (rather than hand-rolled touch/wheel interception, which is exactly the
 * kind of thing that reads as janky on iOS) so it always finishes before
 * you can scroll past it. The extra scroll consumed *beyond* the frame's
 * own height (RAIL_DWELL_PER_TRANSITION_SVH per photo) is what's actually
 * tunable for pace - the frame height itself is fixed at 100 now.
 *
 * The rangeStartPct/rangeEndPct math below computes exactly where the real
 * sticky engage/release points fall as `cover X%` positions, rather than
 * assuming CSS's `contain 0% contain 100%` (what BreakoutPhoto's desktop
 * pin uses) lines up with them - it only does when the sticky child is
 * exactly full viewport height, and this formula stays correct even if
 * RAIL_FRAME_SVH ever changes again. The Framer Motion fallback computes
 * the matching progress by hand from the frame's own bounding box each
 * scroll tick (rawProgress), for the same reason it can't use useScroll's
 * offset shorthand.
 *
 * Native CSS scroll-driven animation (`.rail-timeline-subject` /
 * `.rail-track` in globals.css) runs wherever supported - compositor
 * thread, immune to main-thread jank - confirmed via a real WebKit 26 (iOS
 * 26's engine) test to be the path this device actually takes.
 *
 * Sits within the page's normal side padding, same as the grid photos -
 * not full-bleed. Photos use object-contain (the complete photo, no
 * cropping), same as BreakoutPhoto, but inside a fixed 3:4 box
 * (.rail-photo-box in globals.css) centered in each full-size panel,
 * rather than each photo independently filling as much of the panel as
 * its own aspect ratio allows - every real photo here (roughly 2:3 to 4:5)
 * is proportionally wider than the panel itself, so left to object-contain
 * against the whole panel, every photo ended up the same *width* but a
 * different *height*, reading as inconsistently-sized photos sliding past
 * each other. The fixed box gives every photo the same footprint, at the
 * cost of a little letterboxing for whichever photos sit further from
 * 3:4. Panel widths are in `cqw` (container query width, relative to this
 * frame) rather than a percentage of the track's own width, so the gap
 * between panels doesn't shrink the panels themselves.
 *
 * The frame is statically black (bg-black, no animation) so it's already
 * black as it approaches from below rather than turning black once you
 * scroll into it - see the NOTE ON THE DARK BACKDROP in globals.css for
 * why this deliberately isn't scroll-driven.
 */
export default function MobileRail({ photos, onOpen }: MobileRailProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const cssSupported = useCssScrollTimelineSupport();

  const gapCount = photos.length - 1;
  const totalDwellSvh = gapCount * RAIL_DWELL_PER_TRANSITION_SVH;
  const outerHeightSvh = RAIL_FRAME_SVH + totalDwellSvh;
  // Treating the viewport as "100" in the same svh-based unit system as
  // RAIL_FRAME_SVH/totalDwellSvh, so these ratios hold on any device
  // without measuring actual pixels.
  const VIEWPORT_SVH = 100;
  // Where along the default `cover` range (0% = frame's top just entering
  // at the viewport's bottom, 100% = frame's bottom just exiting the
  // viewport's top) the real sticky engage/release points fall - see the
  // doc comment above for the derivation.
  const rangeStartPct = (100 * VIEWPORT_SVH) / (outerHeightSvh + VIEWPORT_SVH);
  const rangeEndPct = (100 * (VIEWPORT_SVH - RAIL_FRAME_SVH + outerHeightSvh)) / (outerHeightSvh + VIEWPORT_SVH);

  // Total scroll distance the track travels: (N-1) panel-widths plus (N-1)
  // gaps, all in cqw so it stays correct at any frame size without
  // measuring anything in JS.
  const shiftCqw = gapCount * (100 + RAIL_GAP_CQW);
  const cssShiftValue = `calc(-${shiftCqw}cqw)`;

  // scrollY as a plain motion value; rawProgress below reads the outer
  // element's live position off it each tick rather than relying on
  // useScroll's target/offset system, for the same reason the CSS side
  // can't use the `contain` range - see the doc comment above.
  const { scrollY } = useScroll();
  const rawProgress = useTransform(scrollY, () => {
    if (!outerRef.current || typeof window === 'undefined') return 0;
    const top = outerRef.current.getBoundingClientRect().top;
    const totalDwellPx = (totalDwellSvh / 100) * window.innerHeight;
    if (totalDwellPx <= 0) return 0;
    return Math.min(1, Math.max(0, -top / totalDwellPx));
  });
  // Raw scroll progress updates in whatever-sized jumps the browser's
  // scroll events happen to fire in - on iOS especially they arrive
  // sparsely during momentum scrolling, which reads as twitchy. Springing
  // it smooths those jumps into continuous motion (same treatment and
  // tuning as BreakoutPhoto's JS path). Only the JS fallback needs it - the
  // CSS path is compositor-driven and has no discrete jumps to smooth.
  const smoothProgress = useSpring(rawProgress, { stiffness: 200, damping: 30, mass: 0.5 });
  const transform = useTransform(smoothProgress, (v) => `translateX(calc(${(-v).toFixed(4)} * ${shiftCqw}cqw))`);
  // JS-fallback equivalents of the three scroll-driven CSS animations
  // below - each mirrors its keyframe percentages exactly so both paths
  // look identical. See .rail-photo-zoom-kf / .rail-squiggle-kf in
  // globals.css for what the stops mean.
  const photoZoom = useTransform(smoothProgress, [0, 0.08, 0.92, 1], [0.88, 1, 1, 0.88]);
  const squiggleFromLeft = useTransform(smoothProgress, [0, 0.14, 0.3, 0.72, 0.88, 1], [1, 1, 0, 0, 1, 1]);
  const squiggleFromRight = useTransform(smoothProgress, [0, 0.14, 0.3, 0.72, 0.88, 1], [-1, -1, 0, 0, -1, -1]);

  const isInView = useInView(outerRef, { margin: '200px' });
  const { headerReady } = useLayoutMode();
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (isInView && headerReady) setRevealed(true);
  }, [isInView, headerReady]);

  const panels = photos.map((photo, i) => (
    <div
      key={`${photo.src}-${i}`}
      className="relative flex h-full cursor-pointer items-center justify-center"
      style={{ flex: '0 0 100cqw' }}
      onClick={() => onOpen(photo)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* scale comes from the CSS class where scroll-timelines are
          supported; on the fallback Framer writes an inline transform,
          which takes precedence over the class's own - the class's
          animation is inert there anyway, since its timeline doesn't
          resolve. */}
      <motion.div
        className="rail-photo-box relative"
        style={cssSupported ? undefined : { scale: photoZoom }}
      >
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="calc(100vw - 48px)"
          className="photo-protected object-contain"
          draggable={false}
          loading="eager"
          quality={82}
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
        />
      </motion.div>
    </div>
  ));

  const squiggle = (fromRight: boolean) => (
    <svg
      className={`rail-squiggle${fromRight ? ' rail-squiggle-from-right' : ''}`}
      viewBox={`0 0 ${SQUIGGLE_VIEW_W} 12`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <motion.path
        d={SQUIGGLE_PATH}
        pathLength={1}
        style={cssSupported ? undefined : { strokeDashoffset: fromRight ? squiggleFromRight : squiggleFromLeft }}
      />
    </svg>
  );

  return (
    <div
      ref={outerRef}
      className={`relative w-full ${cssSupported ? 'rail-timeline-subject' : ''}`}
      style={{ height: `${outerHeightSvh}svh` }}
    >
      <motion.div
        className="rail-frame sticky top-0 w-full overflow-hidden bg-black"
        style={
          {
            height: `${RAIL_FRAME_SVH}svh`,
            '--rail-range-start': `cover ${rangeStartPct.toFixed(4)}%`,
            '--rail-range-end': `cover ${rangeEndPct.toFixed(4)}%`,
          } as CSSProperties
        }
        initial={{ opacity: 0 }}
        animate={{ opacity: revealed ? 1 : 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {cssSupported ? (
          <div
            className="rail-track relative flex h-full"
            style={
              {
                gap: `${RAIL_GAP_CQW}cqw`,
                '--rail-shift': cssShiftValue,
              } as CSSProperties
            }
          >
            {panels}
          </div>
        ) : (
          <motion.div
            className="relative flex h-full"
            style={{
              width: 'max-content',
              gap: `${RAIL_GAP_CQW}cqw`,
              transform,
              willChange: 'transform',
            }}
          >
            {panels}
          </motion.div>
        )}

        {/* Overlaid on the frame rather than nested in the track, so the
            squiggles hold still across the screen while the photos slide
            underneath them. */}
        <div className="rail-squiggle-layer">
          <div className="rail-squiggle-band">{squiggle(false)}</div>
          <div className="rail-squiggle-spacer" />
          <div className="rail-squiggle-band">{squiggle(true)}</div>
        </div>
      </motion.div>
    </div>
  );
}
