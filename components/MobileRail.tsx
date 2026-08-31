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
  /**
   * 'classic' is the original treatment: black backdrop growing in
   * behind a fixed-ratio boxed photo, white edge rules. 'fill' drops
   * all of that - the photo itself swells from grid-photo width to
   * full-bleed and its vertical anchor travels top -> center -> bottom
   * so it reads as inline with the grid at both ends of the dwell. See
   * .rail-fill-photo-box in globals.css for the full story. Currently
   * an experiment on the homepage's second rail only.
   */
  variant?: 'classic' | 'fill';
  /**
   * Fill variant only: the real grid photos immediately before and after
   * this whole rail in the page (from the neighbouring grid segments,
   * not this rail's own photo list). Neither is reachable on screen
   * while the frame is pinned - see .rail-peek-layer in globals.css -
   * so each renders as a stand-in in the band of frame either side of
   * the resting photo, then gets pushed out as that photo swells and
   * brought back as it settles. Omitted (that layer simply not
   * rendered) when the rail has no grid segment on that side.
   */
  prevPhoto?: Photo;
  nextPhoto?: Photo;
}

// The pinned frame's height, as svh - full viewport, so there's no empty
// background gap below a shorter frame while it's pinned (an earlier,
// shorter version of this had exactly that gap).
const RAIL_FRAME_SVH = 100;
// Extra scroll consumed per photo-to-photo transition while pinned, as svh.
// This is the single knob for the whole section's pace: everything else -
// the backdrop's two stages, the photo's rise, the slide, the rules - is
// expressed as a fraction of the dwell, so raising this stretches all of
// them together and lowering it compresses them together.
//
// Bigger means the section is *slower*, not longer-feeling: the same
// animation is spread over more scroll, so a given swipe advances it less
// and a fast flick has less chance of jumping several photos at once.
// Still well short of a full screen per photo, which would hold the rest
// of the page off-screen for an uncomfortable stretch.
const RAIL_DWELL_PER_TRANSITION_SVH = 65;

// The fill variant runs its slide this much slower than the classic one
// - the same animation spread over 25% more scroll, so each swipe
// advances it less. Scoped to the variant rather than folded into the
// constant above so the classic rail keeps the pace it was tuned at.
const RAIL_FILL_DWELL_SCALE = 1.25;

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

// The fill variant's gap instead, in px: exactly the page's own side
// gutter (the section's px-6, the same 24px .rail-fullbleed breaks out
// of). Its photos travel at full-bleed width, so this gap is the only
// thing between one and the next, and matching the gutter makes the
// spacing between sliding photos read as the same spacing the grid uses
// everywhere else on the page. Fixed px rather than the classic
// variant's cqw for that reason - the gutter it's matching is itself a
// fixed 24px at every viewport width, so a proportional gap would only
// agree with it at one screen size.
const RAIL_FILL_GAP_PX = 24;

// The shape drawn across the black band above and below the photo. A plain
// horizontal rule at the viewBox's midline: quiet and editorial, staying
// out of the photo's way rather than competing with it. Drawn in
// EDGE_VIEW_W user units and stretched to the frame by
// preserveAspectRatio="none".
//
// Only this constant decides the shape - the draw-on, the timing, and the
// two opposite entry directions all work off the path's length, not its
// geometry, so swapping in any other single path changes the look without
// touching the animation. (It has held a shallow wave and an arc-built
// corkscrew; both were tried and set aside in favour of the rule.) Keep it
// a single continuous subpath: a path broken into several `M` moves draws
// all its pieces at once rather than as one travelling line, since the
// dash runs over the path's whole length.
const EDGE_VIEW_W = 240;
const EDGE_VIEW_H = 12;
const EDGE_PATH = `M0 6 L${EDGE_VIEW_W} 6`;

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
export default function MobileRail({
  photos,
  onOpen,
  variant = 'classic',
  prevPhoto,
  nextPhoto,
}: MobileRailProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const cssSupported = useCssScrollTimelineSupport();
  const isFill = variant === 'fill';
  // Rails are uniform-ratio by construction (takeUniformRail groups to
  // within 2.5%), so the first photo's ratio stands in for the whole
  // set - it feeds the CSS math (--rail-fill-r) and the JS fallback's
  // pixel version of the same anchors below.
  const fillRatio = photos[0] ? photos[0].width / photos[0].height : 0.66;

  const gapCount = photos.length - 1;
  const totalDwellSvh =
    (gapCount * RAIL_DWELL_PER_TRANSITION_SVH * (isFill ? RAIL_FILL_DWELL_SCALE : 1)) /
    (RAIL_SLIDE_END - RAIL_SLIDE_START);
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

  // One panel's worth of travel: its own width plus the gap after it.
  // Left as a CSS length expression rather than a number so the fill
  // variant's fixed-px gap and the classic variant's proportional one
  // can share the arithmetic below - both stay correct at any frame size
  // without measuring anything in JS.
  const railGap = isFill ? `${RAIL_FILL_GAP_PX}px` : `${RAIL_GAP_CQW}cqw`;
  const panelStep = isFill ? `(100cqw + ${RAIL_FILL_GAP_PX}px)` : `${100 + RAIL_GAP_CQW}cqw`;
  // Total distance the track travels: (N-1) of those steps.
  const cssShiftValue = `calc(-1 * ${gapCount} * ${panelStep})`;

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
  const transform = useTransform(
    slideProgress,
    (v) => `translateX(calc(${(-v).toFixed(4)} * ${gapCount} * ${panelStep}))`
  );
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
  const edgeFromLeft = useTransform(smoothProgress, [0, 0.12, 0.82, 0.88, 1], [1, 1, 0, 1, 1]);
  const edgeFromRight = useTransform(smoothProgress, [0, 0.12, 0.82, 0.88, 1], [-1, -1, 0, -1, -1]);

  // Fill-variant fallback equivalents of rail-fill-kf (globals.css):
  // same 0/18/82/100 stops, with the translate anchors computed in
  // pixels from the live viewport instead of the CSS calc chain.
  // innerWidth stands in for 100cqw (the frame is full-bleed) and
  // innerHeight for 100svh - a close-enough approximation for the
  // fallback path, which no current mobile browser takes.
  const fillZoom = useTransform(smoothProgress, [0, 0.18, 0.82, 1], [0.88, 1, 1, 0.88]);
  // Pixel equivalents of the CSS custom properties the fill variant's
  // keyframes run on (--rail-fill-rise, --rail-fill-inset,
  // --rail-peek-travel). The fill frame is a header shorter than the
  // viewport and pins below it, so frameH here is its whole height -
  // there's no separate content inset (see .rail-frame-fill).
  const fillMetrics = () => {
    if (typeof window === 'undefined') return { rise: 0, travel: 0 };
    const headerPx =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--header-shrunk-height')
      ) || 72;
    const frameH = window.innerHeight - headerPx;
    const w = Math.min(window.innerWidth, fillRatio * 0.94 * frameH);
    const h = w / fillRatio;
    return {
      rise: Math.max(0, (frameH - h) / 2),
      travel: Math.max(0, (frameH - 0.88 * h) / 2 - 10),
    };
  };
  // Centred at rest, risen flush to the frame's top across the slide.
  const fillY = useTransform(smoothProgress, (p) => {
    const { rise } = fillMetrics();
    if (p <= 0.18) return -rise * (p / 0.18);
    if (p >= 0.82) return -rise * (1 - (p - 0.82) / 0.18);
    return -rise;
  });
  // JS-fallback equivalents of rail-peek-above-kf / rail-peek-below-kf -
  // pure travel, no opacity, same stops as the CSS: top out first
  // (0-9%) and back last (91-100%), bottom out second (9-18%) and back
  // first (82-91%).
  const peekAboveY = useTransform(smoothProgress, (p) => {
    const { travel } = fillMetrics();
    if (p <= 0.09) return -travel * (p / 0.09);
    if (p >= 0.91) return -travel * (1 - (p - 0.91) / 0.09);
    return -travel;
  });
  const peekBelowY = useTransform(smoothProgress, (p) => {
    const { travel } = fillMetrics();
    if (p <= 0.09) return 0;
    if (p <= 0.18) return travel * ((p - 0.09) / 0.09);
    if (p >= 0.91) return 0;
    if (p >= 0.82) return travel * (1 - (p - 0.82) / 0.09);
    return travel;
  });

  const isInView = useInView(outerRef, { margin: '200px' });
  const { headerReady } = useLayoutMode();
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (isInView && headerReady) setRevealed(true);
  }, [isInView, headerReady]);

  // The fill variant's fallback y is viewport-derived, so its first
  // client render disagrees with the server's (which has no viewport) -
  // a hydration mismatch. Holding the inline fallback style off until
  // after mount sidesteps that: pre-mount, the CSS class's own static
  // approach anchor (translate + 0.88 initial zoom) paints the identical
  // resting state, so nothing visibly changes when the style lands.
  const [fallbackReady, setFallbackReady] = useState(false);
  useEffect(() => {
    setFallbackReady(true);
  }, []);

  const panels = photos.map((photo, i) => (
    <div
      key={`${photo.src}-${i}`}
      className="relative flex h-full cursor-pointer items-center justify-center"
      style={{ flex: '0 0 100cqw' }}
      onClick={() => onOpen(photo)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Motion comes from the CSS class where scroll-timelines are
          supported; on the fallback Framer writes an inline transform
          instead. The fill variant keeps its animated half in a separate
          class (.rail-fill-photo-box-css) applied only on the CSS path,
          so the fallback inherits the sizing without a resting
          scale/translate that Framer's own transform would compose with
          rather than replace. The classic variant needs no such split -
          its class animates `transform`, which Framer's inline transform
          simply overrides. */}
      <motion.div
        className={`${
          isFill
            ? `rail-fill-photo-box ${cssSupported ? 'rail-fill-photo-box-css' : ''}`
            : 'rail-photo-box'
        } relative`}
        style={
          cssSupported
            ? undefined
            : isFill
              ? fallbackReady
                ? { scale: fillZoom, y: fillY }
                : undefined
              : { scale: photoZoom }
        }
      >
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes={isFill ? '100vw' : 'calc(100vw - 48px)'}
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
      className={`rail-fullbleed relative ${cssSupported ? 'rail-timeline-subject' : ''} ${
        isFill ? 'rail-fullbleed-fill' : ''
      }`}
      // --rail-fill-r lives out here rather than on the frame because
      // .rail-fullbleed-fill's negative margins are derived from it; the
      // frame and everything inside inherit it.
      style={
        {
          height: `${outerHeightSvh}svh`,
          ...(isFill ? { '--rail-fill-r': fillRatio.toFixed(4) } : null),
        } as CSSProperties
      }
    >
      <motion.div
        className={`rail-frame sticky top-0 w-full overflow-hidden bg-[var(--bg)] ${
          isFill ? 'rail-frame-fill' : ''
        }`}
        style={
          {
            // The fill variant pins below the header rather than at the
            // viewport top, and is shorter by the same amount so it still
            // reaches the viewport's bottom edge while pinned - see
            // .rail-frame-fill in globals.css for why, and for what that
            // does to the range math below. Inline rather than in the
            // class because `top` has to beat Tailwind's own top-0 and
            // the height shares RAIL_FRAME_SVH with the classic branch.
            height: isFill
              ? `calc(${RAIL_FRAME_SVH}svh - var(--header-shrunk-height))`
              : `${RAIL_FRAME_SVH}svh`,
            ...(isFill ? { top: 'var(--header-shrunk-height)' } : null),
            '--rail-range-start': `cover ${rangeStartPct.toFixed(4)}%`,
            '--rail-range-end': `cover ${rangeEndPct.toFixed(4)}%`,
          } as CSSProperties
        }
        // The classic variant fades its frame in as it comes into view -
        // it arrives as a distinct black stage, so announcing itself
        // suits it. The fill variant deliberately doesn't: its resting
        // state is meant to be indistinguishable from three ordinary
        // grid photos, and those don't fade in on mobile either (see
        // GridPhoto - anything below the fold appears the instant it's
        // ready). A fade here also risks being caught mid-flight on a
        // fast scroll, which reads as exactly the flicker this is
        // supposed to avoid.
        initial={{ opacity: isFill ? 1 : 0 }}
        animate={{ opacity: isFill || revealed ? 1 : 0 }}
        transition={{ duration: isFill ? 0 : 0.6, ease: 'easeOut' }}
      >
        {/* Black backdrop, grown in before the slide starts and shrunk out
            after it ends. First in the DOM so it paints under the photos:
            everything here is position-auto, so paint order is source
            order. The fill variant has no backdrop at all - the swelling
            photo is the whole event, on the page's own background. */}
        {isFill ? null : cssSupported ? (
          <div className="rail-backdrop-layer">
            <div className="rail-backdrop" />
          </div>
        ) : (
          <div className="rail-backdrop-layer">
            <motion.div className="rail-backdrop" style={{ width: backdropWidth, height: backdropHeight }} />
          </div>
        )}

        {/* Stand-ins for the real grid photos either side of this whole
            rail - see the prevPhoto/nextPhoto doc comment above and
            .rail-peek-layer in globals.css. Before the swelling photo in
            the DOM, so that photo paints on top once they overlap. */}
        {isFill && prevPhoto && (
          <motion.div
            className="rail-peek-layer rail-peek-above"
            style={cssSupported ? undefined : fallbackReady ? { y: peekAboveY } : undefined}
          >
            <Image
              src={prevPhoto.src}
              alt={prevPhoto.alt}
              width={prevPhoto.width}
              height={prevPhoto.height}
              sizes="calc(100vw - 48px)"
              className="photo-protected block h-auto w-full"
              draggable={false}
              loading="eager"
              quality={82}
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
            />
          </motion.div>
        )}
        {isFill && nextPhoto && (
          <motion.div
            className="rail-peek-layer rail-peek-below"
            style={cssSupported ? undefined : fallbackReady ? { y: peekBelowY } : undefined}
          >
            <Image
              src={nextPhoto.src}
              alt={nextPhoto.alt}
              width={nextPhoto.width}
              height={nextPhoto.height}
              sizes="calc(100vw - 48px)"
              className="photo-protected block h-auto w-full"
              draggable={false}
              loading="eager"
              quality={82}
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
            />
          </motion.div>
        )}

        {cssSupported ? (
          <div
            className="rail-track relative flex h-full"
            style={
              {
                gap: railGap,
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
              gap: railGap,
              transform,
              willChange: 'transform',
            }}
          >
            {panels}
          </motion.div>
        )}

        {/* Overlaid on the frame rather than nested in the track, so the
            rules hold still across the screen while the photos slide
            underneath them. Dropped entirely for the fill variant - the
            rules were designed against the black bands, which it doesn't
            have. */}
        {!isFill && (
          <div className="rail-edge-layer">
            <div className="rail-edge-band">{edgeLine(false)}</div>
            <div className="rail-edge-spacer" />
            <div className="rail-edge-band">{edgeLine(true)}</div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
