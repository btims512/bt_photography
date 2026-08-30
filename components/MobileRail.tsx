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

// Fraction of the dwell spent growing the black backdrop in at the start,
// and again shrinking it out at the end - the slide only runs across the
// span between them. MUST match the keyframe stops in globals.css
// (rail-backdrop-kf and friends), which can't read this value: CSS
// keyframe percentages have to be literals, so the two are kept in step by
// hand. The dwell below is scaled up by the leftover fraction so the slide
// itself keeps the same per-photo pace it had before the backdrop phases
// existed, rather than being squeezed into a shorter span.
const RAIL_SLIDE_START = 0.18;
const RAIL_SLIDE_END = 0.82;

// Horizontal gap between photos mid-slide, as cqw (% of the frame's own
// width, via `.rail-frame`'s container query context below). This is now
// the *only* thing separating one photo from the next: photos fill their
// panel's full width (see .rail-photo-box in globals.css), so the
// letterbox bars that used to sit inside each panel's edges and pad this
// out by another ~60px are gone. Raised from 7.5 to compensate - at 7.5
// the photos read as nearly touching once they filled their panels.
const RAIL_GAP_CQW = 12;

// The shape drawn across the black band above and below the photo: a
// corkscrew - a coil seen from the side, looping as it travels.
//
// Built from elliptical arcs rather than curves. Each arc runs a short
// step along the band but is given a radius wider than that step
// (EDGE_COIL_RX against EDGE_COIL_STEP), with the large-arc flag set, so
// it is forced to take the long way round between its two endpoints
// instead of bulging gently between them. That overshoot is what makes
// each turn close back on itself and cross the one before it, which is
// what separates a coil from a wave - a plain sine, however tight, never
// crosses. Widen the radius against the step for fatter loops, narrow it
// toward half the step and the coil relaxes back into a wave.
//
// Only this constant decides the shape. The draw-on, the timing and the
// two opposite entry directions all work off the path's *length*, so any
// single continuous subpath drops straight in - see the dash comments in
// globals.css, which likewise measure in fractions of that length rather
// than in geometry. Keep it one subpath: several `M` moves would draw all
// their pieces at once instead of as one travelling line.
const EDGE_VIEW_W = 240;
const EDGE_VIEW_H = 16;
const EDGE_COIL_STEP = 12;
const EDGE_COIL_RX = 9;
const EDGE_COIL_RY = 6;
const EDGE_MID = EDGE_VIEW_H / 2;
const EDGE_PATH = `M0 ${EDGE_MID} ${Array.from(
  { length: EDGE_VIEW_W / EDGE_COIL_STEP },
  (_, i) => `A${EDGE_COIL_RX} ${EDGE_COIL_RY} 0 1 1 ${(i + 1) * EDGE_COIL_STEP} ${EDGE_MID}`
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
  const totalDwellSvh =
    (gapCount * RAIL_DWELL_PER_TRANSITION_SVH) / (RAIL_SLIDE_END - RAIL_SLIDE_START);
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
  // The slide is held at both ends while the backdrop grows and shrinks,
  // so progress is remapped onto the span between them before driving the
  // track - matching rail-slide-kf's own stops.
  const slideProgress = useTransform(
    smoothProgress,
    [0, RAIL_SLIDE_START, RAIL_SLIDE_END, 1],
    [0, 0, 1, 1]
  );
  const transform = useTransform(slideProgress, (v) => `translateX(calc(${(-v).toFixed(4)} * ${shiftCqw}cqw))`);
  // Mirrors rail-backdrop-kf: the box starts at the photo's own resting
  // footprint, grows vertically to full height, then opens out sideways;
  // reversed on the way back. Each axis blends between the photo-sized
  // expression and the frame's full extent as one calc(), since a motion
  // value can only tween a number - the number here is how far through
  // that blend we are.
  const blend = (t: number, restExpr: string) =>
    `calc(${(1 - t).toFixed(4)} * (${restExpr}) + ${t.toFixed(4)} * 100%)`;
  const bdWidthT = useTransform(smoothProgress, [0, 0.06, 0.12, 0.88, 0.94, 1], [0, 0, 1, 1, 0, 0]);
  const bdHeightT = useTransform(smoothProgress, [0, 0.06, 0.12, 0.88, 0.94, 1], [0, 1, 1, 1, 1, 0]);
  const backdropWidth = useTransform(() => blend(bdWidthT.get(), '0.88 * var(--rail-photo-w)'));
  const backdropHeight = useTransform(() => blend(bdHeightT.get(), '0.88 * var(--rail-photo-w) / 0.66'));
  // JS-fallback equivalents of the three scroll-driven CSS animations
  // below - each mirrors its keyframe percentages exactly so both paths
  // look identical. See .rail-photo-zoom-kf / .rail-edge-kf in
  // globals.css for what the stops mean.
  const photoZoom = useTransform(smoothProgress, [0, 0.12, 0.18, 0.82, 0.88, 1], [0.88, 0.88, 1, 1, 0.88, 0.88]);
  const edgeFromLeft = useTransform(smoothProgress, [0, 0.12, 0.3, 0.7, 0.88, 1], [0.75, 0.75, 0, 0, 0.75, 0.75]);
  const edgeFromRight = useTransform(smoothProgress, [0, 0.12, 0.3, 0.7, 0.88, 1], [-1, -1, -0.25, -0.25, -1, -1]);

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

  const edgeLine = (fromRight: boolean) => (
    <svg
      className={`rail-edge${fromRight ? ' rail-edge-from-right' : ''}`}
      viewBox={`0 0 ${EDGE_VIEW_W} ${EDGE_VIEW_H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <motion.path
        d={EDGE_PATH}
        pathLength={1}
        style={cssSupported ? undefined : { strokeDashoffset: fromRight ? edgeFromRight : edgeFromLeft }}
      />
    </svg>
  );

  return (
    <div
      ref={outerRef}
      className={`rail-fullbleed relative ${cssSupported ? 'rail-timeline-subject' : ''}`}
      style={{ height: `${outerHeightSvh}svh` }}
    >
      <motion.div
        className="rail-frame sticky top-0 w-full overflow-hidden bg-[var(--bg)]"
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
        {/* Black backdrop, grown in before the slide starts and shrunk out
            after it ends. First in the DOM so it paints under the photos:
            everything here is position-auto, so paint order is source
            order. */}
        {cssSupported ? (
          <div className="rail-backdrop-layer">
            <div className="rail-backdrop" />
          </div>
        ) : (
          <div className="rail-backdrop-layer">
            <motion.div className="rail-backdrop" style={{ width: backdropWidth, height: backdropHeight }} />
          </div>
        )}

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
            rules hold still across the screen while the photos slide
            underneath them. */}
        <div className="rail-edge-layer">
          <div className="rail-edge-band">{edgeLine(false)}</div>
          <div className="rail-edge-spacer" />
          <div className="rail-edge-band">{edgeLine(true)}</div>
        </div>
      </motion.div>
    </div>
  );
}
