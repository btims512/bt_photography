'use client';

import { useEffect, useRef, useState, type CSSProperties, type TouchEvent as ReactTouchEvent } from 'react';
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
   * 'fill' is what every rail on the page uses today: no backdrop or
   * edge rules, the photo resting centred at grid-photo width between
   * stand-ins for its two neighbouring grid photos, then swelling to
   * full-bleed as those are pushed out of frame. See
   * .rail-fill-photo-box in globals.css for the full story.
   *
   * 'classic' is the original treatment - a black backdrop growing in
   * behind a fixed-ratio boxed photo, with white edge rules drawing
   * across the bands above and below it. Nothing selects it at the
   * moment (see PortfolioSectionClassic.tsx), but it's kept whole and
   * working rather than deleted: it's a finished alternative to come
   * back to, and every piece of it - the backdrop stages, the edge
   * rules, --rail-photo-zoom - is still wired up behind this prop.
   */
  variant?: 'classic' | 'fill';
  /**
   * Fill variant only: the row of the real grid immediately before and
   * after this whole rail in the page (from the neighbouring grid
   * segments, not this rail's own photo list) - one column on mobile,
   * three on desktop. Neither row is reachable on screen while the frame
   * is pinned - see .rail-peek-layer in globals.css - so each renders as
   * a stand-in in the band of frame either side of the resting photo,
   * then gets pushed out as that photo swells and brought back as it
   * settles. Omitted (that layer simply not rendered) when the rail has
   * no grid segment on that side.
   */
  prevRow?: PeekColumn[];
  nextRow?: PeekColumn[];
  /**
   * Fill variant only: a heading for the gallery, shown in the band above
   * the resting photo. Set per rail in RAIL_STYLES (lib/rails.ts).
   *
   * It is hidden behind `prevRow` at rest and uncovered as that row
   * travels up, so it wants a rail that has a row above it - which the
   * first rail always does, the page opening on a grid segment. Without
   * one there is simply nothing to uncover it and it sits visible
   * throughout; see .rail-title in globals.css.
   */
  title?: string;
  /**
   * Fill variant only: an Instagram-style seamless carousel. The photos sit
   * flush with no gap between them, so a picture cut across two slides
   * carries on unbroken as the track slides from one to the next. Every
   * other part of the rail - the pin, the parting rows, the title, the
   * swell, scroll and swipe both driving the slide - is unchanged.
   *
   * A slide can be half of a picture, so tapping one opens nothing: the
   * lightbox would show it cut off on its own. And the slides load only as
   * the rail comes within reach rather than with the page, since the other
   * rails' reason for loading up front (see the Image below) doesn't
   * outweigh eight more full-width photos for a rail that may sit far down.
   */
  seamless?: boolean;
  /**
   * Fill variant only: the photos snap rather than slide. They don't follow
   * the scroll: each holds still while the scroll passes through its stretch
   * of the rail, and once the scroll crosses halfway into the next photo's
   * stretch they glide there on their own, cleanly, at the same even pace a
   * swipe lands at. The swell, the parting rows and the title stay
   * scroll-driven. See Snap below.
   *
   * And one photo per gesture, whichever way: while the photos are showing,
   * a swipe up or down moves them exactly as a swipe left or right does -
   * following the finger, then onto the next or previous photo, never
   * further however hard it is thrown - rather than letting the page coast
   * through several. A scroll that carries in from outside the rail stops
   * on its first (or last) photo.
   */
  snap?: boolean;
  /**
   * With `snap`: Instagram's position dots, in the band under the photo -
   * uncovered as the row below parts, the way the title is by the row above.
   */
  dots?: boolean;
}

/**
 * One column's worth of a neighbouring grid row: the photo whose edge
 * actually adjoins the rail, plus enough about the column it came from
 * to work out where that edge really falls.
 *
 * The measurements are deliberately unit-less multiples of the column
 * width rather than pixels, since the column width is a viewport
 * expression (--rail-grid-w) that only CSS can resolve: a photo rendered
 * at column width stands `height / width` of that width tall, so
 * `heightUnits` summed over the column plus `count - 1` gaps *is* the
 * column's height, and CSS can finish the arithmetic at any window size
 * without anything being measured or re-measured on resize.
 */
export interface PeekColumn {
  photo: Photo;
  heightUnits: number;
  count: number;
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

// The fill variant's gap instead: exactly the page's own side gutter
// (--rail-gutter, set from the section's px-6 / md:px-[50px] - see
// .rail-fullbleed in globals.css). Its photos travel at their peak
// width, so this gap is the only thing between one and the next, and
// matching the gutter makes the spacing between sliding photos read as
// the same spacing the page uses at its own margins. Handed straight to
// CSS rather than resolved here, so it picks up the breakpoint's value
// without this component having to know which breakpoint it's on.
const RAIL_FILL_GAP = 'var(--rail-gutter)';

// Swipe tuning. AXIS_LOCK is how far a finger has to travel before the
// gesture is committed to one axis and stops being reconsidered - low
// enough to feel immediate, high enough that the small sideways drift in
// an ordinary vertical flick never reads as a swipe. A finger that hasn't
// moved for VELOCITY_STALE_MS before lifting is placing the photo rather
// than throwing it, so it releases with no speed at all.
const SWIPE_AXIS_LOCK_PX = 8;
const SWIPE_VELOCITY_STALE_MS = 100;

// Paging tuning - every rail's swipe (see Swipe in the component).
// PAGE_FLICK_VELOCITY is the finger speed, in px per ms, above which letting
// go counts as a flick and pages in the flick's direction however little
// ground the drag covered, measured over the last PAGE_VELOCITY_MS of
// movement.
//
// PAGE_MS is how long the glide across one whole photo takes; less distance
// takes proportionally less time, down to PAGE_MIN_MS, and a longer one is
// capped at PAGE_CATCH_UP photos' worth. Distance is the only input on
// purpose - how hard the swipe was is not one - so every release on every
// rail travels at the same even pace. PAGE_EASE is easeOutCubic as a CSS
// curve; easeOutCubic below is the same curve for the one glide JS drives.
// PAGE_OUT_MS is that glide: through the rail's closing (or opening) phase,
// when a swipe runs on past the last (or first) photo.
//
// HAND_OVER_QUIET_MS is how long the page has to have been still before a
// landed glide's offset is handed back to the scroll - see handOver.
//
// SNAP_STILL_FRAMES is how many frames the scroll has to sit still before a
// snapped rail stops watching it (see Snap). SNAP_END_INSET is where a swipe
// on a snapped rail parks the scroll for the first and last photo: in from
// the ends of the slide by this share of one photo's stretch, clear of the
// lines where the swell finishes and the closing phase begins, so a small
// scroll straight after the swipe doesn't start either.
const PAGE_FLICK_VELOCITY = 0.3;
const PAGE_VELOCITY_MS = 80;
const PAGE_MS = 480;
const PAGE_MIN_MS = 220;
const PAGE_CATCH_UP = 1.5;
const PAGE_OUT_MS = 650;
const PAGE_EASE = 'cubic-bezier(0.33, 1, 0.68, 1)';
const HAND_OVER_QUIET_MS = 90;
const SNAP_STILL_FRAMES = 8;
// How long after a finger lifts a scroll can still be that gesture's
// momentum - comfortably longer than the slowest native fling runs out.
const MOMENTUM_WINDOW_MS = 3000;
const SNAP_END_INSET = 0.35;

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

// The peek stand-ins are sized by their flex column, but next/image still
// wants to know how wide that lands so it fetches the right file: one
// column of three on desktop, the whole content width below that.
const peekSizes = '(min-width: 768px) calc((100vw - 120px) / 3), calc(100vw - 48px)';

/** One column's height, as a CSS length: `heightUnits` column-widths of
 *  photo plus the gaps between them. */
const columnHeight = (col: PeekColumn) =>
  `(var(--rail-grid-w) * ${col.heightUnits.toFixed(4)} + var(--rail-grid-gap) * ${col.count - 1})`;

/**
 * How far column `i` has to be lifted for its stand-in to sit on its real
 * counterpart: the difference between the deepest column in the row and
 * this one. Zero for the deepest, and zero throughout a single-column
 * (mobile) row, where the only column is trivially the deepest.
 *
 * Emitted as a CSS expression rather than a number because every term is
 * a viewport expression - the arithmetic can only be finished once the
 * browser knows the column width, and doing it there means it stays
 * right through a resize with nothing to recompute.
 */
const peekDelta = (row: PeekColumn[], i: number) =>
  row.length < 2
    ? '0px'
    : `calc(max(${row.map(columnHeight).join(', ')}) - ${columnHeight(row[i])})`;

/**
 * Live pixel geometry of a rail's slide, measured rather than derived: the
 * panel step is a CSS expression (--rail-fill-w plus the gutter, or cqw)
 * that only the browser can resolve, and the dwell is svh. Taken fresh per
 * use, so a resize or an orientation change needs nothing recomputed or
 * invalidated.
 */
function measureRail(outer: HTMLElement | null, track: HTMLElement | null, totalDwellSvh: number, gapCount: number) {
  const kids = track?.children;
  if (!outer || !kids || kids.length < 2 || typeof window === 'undefined') return null;
  // Difference between two siblings' offsets, so it covers the panel and
  // the gap after it without either being read separately.
  const step = (kids[1] as HTMLElement).offsetLeft - (kids[0] as HTMLElement).offsetLeft;
  const dwellPx = (totalDwellSvh / 100) * window.innerHeight;
  if (step <= 0 || dwellPx <= 0) return null;
  return {
    step,
    dwellPx,
    travel: gapCount * step,
    docTop: outer.getBoundingClientRect().top + window.scrollY,
  };
}
type RailGeom = NonNullable<ReturnType<typeof measureRail>>;

/** The same 0..1 the CSS timeline and `rawProgress` run on. */
const progressAt = (scrollY: number, m: RailGeom) => (scrollY - m.docTop) / m.dwellPx;
/** The scroll positions, in document px, that a rail's CSS animations run
 *  between - see scrollRange in the component. */
interface ScrollRange {
  railStart: number;
  railEnd: number;
  slideStart: number;
  slideEnd: number;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * The scroll positions a rail's CSS animations actually run between, in
 * document px: the whole animation, and the stretch of it the slide takes.
 *
 * A swipe has to leave a photo exactly in the frame, so on
 * the CSS path this reads the timeline's own numbers rather than
 * `progressAt`'s. The animations run over the `cover` range between
 * --rail-range-start and --rail-range-end, and the fill frame's header offset
 * leaves that range a header-height shorter at its start than the dwell
 * `progressAt` measures (see .rail-frame-fill) - a visible sliver of the next
 * photo for a swipe that is meant to come to rest on one. The JS fallback's track does run on `progressAt`, so
 * that is what it uses there.
 */
function computeScrollRange(
  m: RailGeom,
  outer: HTMLElement | null,
  cssSupported: boolean,
  rangeStartPct: number,
  rangeEndPct: number
): ScrollRange {
  let railStart = m.docTop;
  let railEnd = m.docTop + m.dwellPx;
  if (cssSupported && outer) {
    // `cover` runs from the element's top meeting the viewport's bottom to
    // its bottom leaving the viewport's top.
    const coverStart = m.docTop - window.innerHeight;
    const coverLength = outer.offsetHeight + window.innerHeight;
    railStart = coverStart + (coverLength * rangeStartPct) / 100;
    railEnd = coverStart + (coverLength * rangeEndPct) / 100;
  }
  const span = railEnd - railStart;
  return {
    railStart,
    railEnd,
    slideStart: railStart + span * RAIL_SLIDE_START,
    slideEnd: railStart + span * RAIL_SLIDE_END,
  };
}

/** How far through the slide `scrollY` is, 0..1, by `range`. */
const slideWithin = (range: ScrollRange, scrollY: number) =>
  Math.min(1, Math.max(0, (scrollY - range.slideStart) / (range.slideEnd - range.slideStart)));

/**
 * The photo a swipe lands on - Instagram's paging. A flick (finger
 * speed past PAGE_FLICK_VELOCITY, positive = moving right, towards the
 * previous photo) moves one photo in its own direction however short the
 * drag was; a slower release settles on whichever photo is nearer; and
 * neither can end more than one photo from `base`, however hard it was
 * thrown. `position` is in photos - 1.3 is 30% of the way from the second to
 * the third.
 *
 * `base` is the photo the gesture belongs to: the one it started on - or,
 * `inFlight`, the one a glide was already heading to when the finger caught
 * it. Then a flick carries on past that photo rather than being spent
 * arriving at it, so two quick flicks move two photos, the way they do on
 * Instagram, instead of the second one only finishing the first.
 */
function pageTarget(position: number, velocity: number, base: number, inFlight: boolean, gapCount: number) {
  let target: number;
  if (velocity < -PAGE_FLICK_VELOCITY) target = inFlight ? Math.max(Math.floor(position) + 1, base + 1) : Math.floor(position) + 1;
  else if (velocity > PAGE_FLICK_VELOCITY) target = inFlight ? Math.min(Math.ceil(position) - 1, base - 1) : Math.ceil(position) - 1;
  else target = Math.round(position);
  target = Math.min(base + 1, Math.max(base - 1, target));
  return Math.min(gapCount, Math.max(0, target));
}

/** How long a glide over `photos` photos' distance takes - see PAGE_MS. */
const pageDuration = (photos: number) =>
  Math.round(Math.max(PAGE_MIN_MS, PAGE_MS * Math.min(photos, PAGE_CATCH_UP)));

/** An element's current horizontal translation in px, part-way through a
 *  transition or scroll-driven animation included - 0 when it has none. */
const noop = () => {};

/** Milliseconds since `t`, a performance.now() timestamp. */
const msSince = (t: number) => performance.now() - t;

const translateXOf = (el: HTMLElement | null) => {
  if (!el) return 0;
  const t = getComputedStyle(el).transform;
  return t && t !== 'none' ? new DOMMatrixReadOnly(t).m41 : 0;
};

/**
 * A snapped track's glide (see Snap in the component): a cubic from where the
 * track was (`from`, moving at `v0` px per ms) to a photo (`to`, at rest) over
 * `duration`. With no speed to carry, `v0` is easeOutCubic's opening speed, so
 * a snap is the same curve as every other glide on the page; carrying speed
 * from a glide that changed course, it is capped at that same opening speed,
 * which keeps the curve from overshooting the photo.
 */
interface SnapMotion {
  raf: number;
  from: number;
  to: number;
  v0: number;
  t0: number;
  duration: number;
  /** Where the track is now. */
  x: number;
  /** The photo it is at, or gliding to. */
  index: number;
}

/** The glide's position and speed (px per ms) at `now` - at rest if none is running. */
function snapMotionAt(g: SnapMotion, now: number) {
  if (!g.raf || g.duration <= 0) return { x: g.x, v: 0 };
  const s = Math.min(1, Math.max(0, (now - g.t0) / g.duration));
  const d = g.to - g.from;
  const x = g.from + d * (3 * s * s - 2 * s * s * s) + g.v0 * g.duration * (s - 2 * s * s + s * s * s);
  const v = s >= 1 ? 0 : (d * (6 * s - 6 * s * s)) / g.duration + g.v0 * (1 - 4 * s + 3 * s * s);
  return { x, v };
}

function placeSnapTrack(g: SnapMotion, track: HTMLElement, px: number) {
  g.x = px;
  track.style.transform = `translate3d(${px}px, 0, 0)`;
}

function stopSnapMotion(g: SnapMotion) {
  if (g.raf) cancelAnimationFrame(g.raf);
  g.raf = 0;
}

/** Glide a snapped track to photo `index`, from wherever it is and at whatever
 *  speed it's already moving. `step` is one photo's width. */
function snapTrackTo(g: SnapMotion, track: HTMLElement, index: number, step: number) {
  const now = performance.now();
  const { x, v } = snapMotionAt(g, now);
  stopSnapMotion(g);
  g.index = index;
  const to = -index * step;
  const d = to - x;
  if (Math.abs(d) < 0.5 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    placeSnapTrack(g, track, to);
    return;
  }
  const duration = pageDuration(Math.abs(d) / step);
  const opening = (3 * d) / duration;
  g.from = x;
  g.to = to;
  g.t0 = now;
  g.duration = duration;
  g.v0 = v === 0 ? opening : Math.sign(v) * Math.min(Math.abs(v), Math.abs(opening));
  const tick = () => {
    const elapsed = performance.now() - g.t0;
    if (elapsed >= g.duration) {
      placeSnapTrack(g, track, g.to);
      g.raf = 0;
      return;
    }
    placeSnapTrack(g, track, snapMotionAt(g, performance.now()).x);
    g.raf = requestAnimationFrame(tick);
  };
  g.raf = requestAnimationFrame(tick);
}

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
  prevRow,
  nextRow,
  title,
  seamless = false,
  snap = false,
  dots = false,
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
  // A seamless rail's photos touch - the whole point of it - so its gap is
  // nothing at all rather than the gutter.
  const fillGap = seamless ? '0px' : RAIL_FILL_GAP;
  const railGap = isFill ? fillGap : `${RAIL_GAP_CQW}cqw`;
  // Each fill panel is exactly as wide as the photo at its peak, so the
  // gap between panels *is* the gap you see between photos. Sizing them
  // to the frame instead (which is what the classic variant does, and
  // what this did while only mobile existed) is invisible on a phone,
  // where a peak-width photo already fills the frame - but on desktop
  // the photo is bounded by height at around a third of the frame's
  // width, and the leftover slack either side of it lands in the gap,
  // pushing the photos most of a screen apart.
  const panelWidth = isFill ? 'var(--rail-fill-w)' : '100cqw';
  const panelStep = isFill
    ? `(var(--rail-fill-w) + ${fillGap})`
    : `${100 + RAIL_GAP_CQW}cqw`;
  // Total distance the track travels: (N-1) of those steps.
  const cssShiftValue = `calc(-1 * ${gapCount} * ${panelStep})`;

  // scrollY as a plain motion value; rawProgress below reads the outer
  // element's live position off it each tick rather than relying on
  // useScroll's target/offset system, for the same reason the CSS side
  // can't use the `contain` range - see the doc comment above.
  const { scrollY } = useScroll();
  const rawProgress = useTransform(scrollY, () => {
    // Nothing downstream of this is used on the CSS path, but everything
    // downstream of it still recomputes whenever it changes - Framer's
    // derived values subscribe to their inputs whether or not anything reads
    // them - and several of those read computed style (fillMetrics), which
    // can force a style recalculation mid-frame on every frame of scrolling,
    // for every rail on the page. Holding this at 0 there holds all of that
    // still.
    if (cssSupported) return 0;
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
  // same 0/18/82/100 stops, with the anchors computed in pixels from the
  // live viewport instead of the CSS calc chain. innerWidth stands in for
  // 100cqw (the frame is full-bleed) and innerHeight for 100svh - a
  // close-enough approximation for the fallback path, which no current
  // mobile browser takes.
  // Pixel equivalents of the CSS custom properties the fill variant's
  // keyframes run on (--rail-rest-scale, --rail-fill-inset,
  // --rail-peek-travel), mirroring the calc chain in
  // .rail-fullbleed-fill exactly - including its breakpoint, since the
  // gutter and what counts as one grid photo both change at 768px. The
  // fill frame is a header shorter than the viewport and pins below it,
  // so frameH here is its whole height (see .rail-frame-fill). Nothing
  // here translates the photo: it grows about its own centre and stays
  // centred, so scale is the whole of its movement.
  const fillMetrics = () => {
    if (typeof window === 'undefined') return { travel: 0, restScale: 1 };
    const headerPx =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--header-shrunk-height')
      ) || 72;
    const vw = window.innerWidth;
    const wide = vw >= 768;
    const gutter = wide ? 50 : 24;
    const gridGap = 10;
    const gridW = wide ? (vw - 2 * gutter - 2 * gridGap) / 3 : vw - 2 * gutter;
    const frameH = window.innerHeight - headerPx;
    // Mirrors --rail-fill-w and --rail-title-band in .rail-fullbleed-fill.
    const titleBand = 48;
    const peakW = Math.min(vw, fillRatio * (frameH - 2 * titleBand) + 6);
    const restH = gridW / fillRatio;
    return {
      travel: Math.max(0, (frameH - restH) / 2 - gridGap),
      restScale: peakW > 0 ? gridW / peakW : 1,
    };
  };
  const fillZoom = useTransform(smoothProgress, (p) => {
    const { restScale } = fillMetrics();
    if (p <= 0.18) return restScale + (1 - restScale) * (p / 0.18);
    if (p >= 0.82) return restScale + (1 - restScale) * (1 - (p - 0.82) / 0.18);
    return 1;
  });
  // JS-fallback equivalents of rail-peek-above-kf / rail-peek-below-kf -
  // pure travel, no opacity, same stops as the CSS: both rows part over
  // 0-18% and return over 82-100%, together and in opposite directions,
  // so these two differ only in sign.
  const peekTravelAt = (p: number) => {
    const { travel } = fillMetrics();
    if (p <= RAIL_SLIDE_START) return travel * (p / RAIL_SLIDE_START);
    if (p >= RAIL_SLIDE_END) return travel * (1 - (p - RAIL_SLIDE_END) / (1 - RAIL_SLIDE_END));
    return travel;
  };
  const peekAboveY = useTransform(smoothProgress, (p) => -peekTravelAt(p));
  const peekBelowY = useTransform(smoothProgress, (p) => peekTravelAt(p));

  const isInView = useInView(outerRef, { margin: '200px' });
  // For a seamless rail's deferred loading (see `seamless`): a screen's
  // grace either way is well ahead of need, since the slide itself doesn't
  // start until the rail has pinned and the photo has swelled.
  const approaching = useInView(outerRef, { margin: '100% 0px 100% 0px', once: true });
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

  // ---------------------------------------------------------------------
  // Swipe
  //
  // Vertical scrolling is untouched: the browser still pans the page
  // itself, and the track's position is still derived from where that
  // scroll got to, on whichever of the two paths above this device takes.
  // Swipe is *added* on the one axis a pinned frame leaves unused -
  // `touch-action: pan-y pinch-zoom` (.rail-swipe-area in globals.css)
  // leaves vertical panning and pinch-zoom with the browser and hands us
  // only horizontal movement. Nothing here ever calls preventDefault or
  // touches the scroller mid-drag, so there is no wrestling with the
  // native pan - which is the failure mode the doc comment above warns
  // about, and the reason vertical gating is still left entirely to the
  // sticky frame.
  //
  // Every rail swipes the same way, Instagram's: the photos follow the
  // finger, and on letting go they glide onto a whole photo (pageTarget
  // decides which) at an even pace set only by how far there is to go
  // (pageDuration), never by how hard the swipe was. One rule and one pace
  // for every rail, so no rail swipes faster than another.
  //
  // A swipe never becomes a second source of truth for where the track is.
  // The track is positioned by scroll alone, and the finger - and the glide
  // after it - move a separate offset layer that composes with the track's
  // transform. The glide is a CSS transition on that layer, so like the
  // scroll-driven track it runs on the compositor, not in script frame by
  // frame. Once it has landed, the offset is handed back to the scroll in one
  // step (handOver): the scroll gains exactly what the offset gives up, so
  // nothing moves, and position is once again purely a function of scrollY.
  // That hand-over always happens while the page is still - when a glide
  // lands, or the moment a finger touches down - so an offset never rides
  // along under a vertical scroll, and a scroll is never interrupted to make
  // room for one.
  const swipeRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  // The offset the layer is at, or gliding to.
  const offsetRef = useRef(0);
  const swipe = useRef({
    // Whether this gesture is the rail's to handle at all, and once it has
    // moved far enough to tell, which way it is going.
    active: false,
    axis: null as null | 'x' | 'y',
    startX: 0,
    startY: 0,
    // Where the finger has asked the photos to be, kept whole - before the
    // clamp that stops them running past either end, so a push past an end
    // isn't lost (see runsOut).
    wantX: 0,
    lastT: 0,
    // The scroll range this gesture works in, the photo it belongs to (see
    // pageTarget), and whether it caught a glide on its way there.
    range: null as ScrollRange | null,
    base: 0,
    inFlight: false,
    // The finger's recent positions, for its release speed.
    samples: [] as { t: number; x: number }[],
    // Snapped rails only: the track's position when the finger took hold of
    // it, and whether it has been caught yet - on the first sideways move,
    // not on touch, so a vertical scroll that starts on the rail never stops
    // a snap part-way.
    basePx: 0,
    caught: false,
  });
  // Set on a gesture that turned out to be a swipe, so the click it would
  // otherwise fire on the panel underneath doesn't open the lightbox.
  // Cleared at the next touchstart rather than when consumed, so a swipe
  // that ends off a panel can't leave it armed for a later, genuine tap.
  const suppressClick = useRef(false);
  // A scroll glide JS is driving (see glideScroll), while one runs.
  const settleRaf = useRef<number | null>(null);
  const cancelSettle = () => {
    if (settleRaf.current !== null) {
      cancelAnimationFrame(settleRaf.current);
      settleRaf.current = null;
    }
  };
  // The photo an offset glide is heading to while one runs, and the same
  // value as it stood when the latest finger came down (see the window
  // listeners below, which hand the glide over before this rail's own
  // touchstart runs).
  const glideTarget = useRef<number | null>(null);
  const caughtGlide = useRef<number | null>(null);
  const handOverTimer = useRef<number | undefined>(undefined);
  // Fingers down anywhere on the page, when the last one lifted, and when the
  // page last scrolled.
  const touches = useRef(0);
  const lastTouchEndAt = useRef(-Infinity);
  const lastScrollAt = useRef(0);
  useEffect(
    () => () => {
      cancelSettle();
      window.clearTimeout(handOverTimer.current);
    },
    []
  );

  const measure = () => measureRail(outerRef.current, trackRef.current, totalDwellSvh, gapCount);
  const scrollRange = (m: RailGeom) => computeScrollRange(m, outerRef.current, cssSupported, rangeStartPct, rangeEndPct);

  /** Move the offset layer to `px`, gliding there over `durationMs`, or at once. */
  const setOffset = (px: number, durationMs = 0) => {
    offsetRef.current = px;
    const el = swipeRef.current;
    if (!el) return;
    const glide = durationMs > 0 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.style.transition = glide ? `transform ${durationMs}ms ${PAGE_EASE}` : 'none';
    el.style.transform = px === 0 ? '' : `translate3d(${px}px, 0, 0)`;
  };

  /** Where the photos are showing, in photos (1.3 is 30% of the way from the
   *  second to the third): the scroll's share, less the offset layer's -
   *  read part-way through a glide if one is running. */
  const shownAt = (m: RailGeom, range: ScrollRange) =>
    slideWithin(range, window.scrollY) * gapCount - translateXOf(swipeRef.current) / m.step;

  /**
   * Give the offset layer's offset back to the scroll, in one step: the offset
   * goes to 0 and the scroll moves by exactly what that offset was worth, in
   * the same task, so they reach the screen together and nothing moves.
   *
   * Only while the page is still. Moving the scroll under a finger that is
   * about to drag it, or during a momentum scroll - which a programmatic
   * scroll stops dead - would be felt, so with `whenStill` a hand-over that
   * finds either waits for it to pass. A finger coming down is the one time
   * it goes ahead regardless: that finger has already stopped any momentum,
   * and hasn't started moving yet.
   */
  const handOver = (whenStill: boolean) => {
    window.clearTimeout(handOverTimer.current);
    const layer = swipeRef.current;
    const m = measure();
    if (!layer || !m) return;
    if (whenStill && (touches.current > 0 || msSince(lastScrollAt.current) < HAND_OVER_QUIET_MS)) {
      handOverTimer.current = window.setTimeout(() => handOver(true), HAND_OVER_QUIET_MS);
      return;
    }
    const offset = translateXOf(layer);
    glideTarget.current = null;
    setOffset(0);
    if (Math.abs(offset) < 0.01) return;
    const range = scrollRange(m);
    const scrollPerPx = (range.slideEnd - range.slideStart) / m.travel;
    const toScroll = window.scrollY - offset * scrollPerPx;
    window.scrollTo(window.scrollX, toScroll);
    // The JS fallback eases its track toward the scroll on a spring, which
    // would play this step out as a visible slide; land the spring on it.
    if (!cssSupported) smoothProgress.jump(Math.min(1, Math.max(0, progressAt(toScroll, m))));
  };

  /** Glide until photo `index` is in the frame, on the offset layer - from
   *  wherever it is, part-way through another glide included - then hand
   *  over once it lands. */
  const glideTo = (index: number, m: RailGeom, range: ScrollRange) => {
    const layer = swipeRef.current;
    if (!layer) return;
    const from = translateXOf(layer);
    const to = (slideWithin(range, window.scrollY) * gapCount - index) * m.step;
    window.clearTimeout(handOverTimer.current);
    // Hold it where it is, and commit that, so the transition set next starts
    // from here rather than from wherever the last one was heading.
    setOffset(from);
    void layer.offsetWidth;
    const duration = Math.abs(to - from) < 0.5 ? 0 : pageDuration(Math.abs(to - from) / m.step);
    glideTarget.current = index;
    setOffset(to, duration);
    handOverTimer.current = window.setTimeout(() => handOver(true), duration + 34);
  };

  /** Glide the page scroll to `to`, easing out, for a swipe that runs on out
   *  of the rail - a phase only the scroll can play, since the swell and the
   *  parting rows are scroll-driven. */
  const glideScroll = (to: number, durationMs: number) => {
    cancelSettle();
    const from = window.scrollY;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || Math.abs(to - from) < 0.5) {
      window.scrollTo(window.scrollX, to);
      return;
    }
    const t0 = performance.now();
    const tick = () => {
      const t = Math.min(1, (performance.now() - t0) / durationMs);
      window.scrollTo(window.scrollX, from + (to - from) * easeOutCubic(t));
      settleRaf.current = t < 1 ? requestAnimationFrame(tick) : null;
    };
    settleRaf.current = requestAnimationFrame(tick);
  };

  /** The finger's speed over its last PAGE_VELOCITY_MS, in px per ms - 0 if
   *  it had come to rest before lifting (placing the photo, not throwing it). */
  const releaseVelocity = () => {
    const st = swipe.current;
    const first = st.samples[0];
    const last = st.samples[st.samples.length - 1];
    if (msSince(st.lastT) > SWIPE_VELOCITY_STALE_MS || !first || last.t <= first.t) return 0;
    return (last.x - first.x) / (last.t - first.t);
  };

  /**
   * Whether a release at an end photo carries on out of the rail: the gesture
   * belongs to that end photo, lands on it, and was still pushing that way -
   * past the track's end (`banked`, the push the track couldn't show) or
   * flicked.
   */
  const runsOut = (target: number, velocity: number, banked: number, m: RailGeom) => {
    const base = swipe.current.base;
    if (target === gapCount && base === gapCount) return banked < -m.step * 0.25 || velocity < -PAGE_FLICK_VELOCITY;
    if (target === 0 && base === 0) return banked > m.step * 0.25 || velocity > PAGE_FLICK_VELOCITY;
    return false;
  };

  // ---------------------------------------------------------------------
  // Snap (the `snap` prop)
  //
  // A snapped rail's photos don't follow the scroll. Its track is taken off
  // the scroll timeline and moved here instead, a whole photo at a time: it
  // holds still while the scroll is inside one photo's stretch of the slide,
  // and the moment the scroll crosses halfway into the next photo's stretch
  // it glides there on its own (snapTrackTo), at the page's one glide pace.
  //
  // Two things keep that clean where an earlier version skipped and jumped.
  // While the page is scrolling, the scroll is read every frame rather than
  // waited for in scroll events, which Safari hands out unevenly during a
  // momentum scroll - so a snap starts on the frame the scroll crosses the
  // line, not in a late burst. And when the scroll has already crossed into
  // another photo's stretch before a glide has landed, the glide bends toward
  // the new photo carrying the speed it had, rather than starting a fresh ease
  // from standstill: several of those restarts in one flick were the lurching.
  const snapMotion = useRef<SnapMotion>({ raf: 0, from: 0, to: 0, v0: 0, t0: 0, duration: 0, x: 0, index: 0 });
  const frameRef = useRef<HTMLDivElement>(null);
  // The photo the dots mark, kept in state only for the dots - the motion
  // itself never waits on a render.
  const [dotIndex, setDotIndex] = useState(0);
  const dotRef = useRef(0);
  const markPhoto = (index: number) => {
    if (dotRef.current === index) return;
    dotRef.current = index;
    setDotIndex(index);
  };
  // Until when a scroll is this rail's own doing (see onTouchEnd), not one to
  // stop.
  const ownScrollUntil = useRef(0);
  const latestMark = useRef(markPhoto);
  useEffect(() => {
    latestMark.current = markPhoto;
  });

  useEffect(() => {
    if (!snap) return;
    const g = snapMotion.current;
    let frame = 0;
    let stillFrames = 0;
    let lastY = -1;
    // Set on a frame the page moved too far to tell momentum from a jump:
    // the next frame decides (see watch).
    let undecided = false;
    let geo: { step: number; range: ScrollRange } | null = null;
    const read = () => {
      const m = measureRail(outerRef.current, trackRef.current, totalDwellSvh, gapCount);
      return m ? { step: m.step, range: computeScrollRange(m, outerRef.current, cssSupported, rangeStartPct, rangeEndPct) } : null;
    };
    const photoAt = (at: { range: ScrollRange }) =>
      Math.min(gapCount, Math.max(0, Math.round(slideWithin(at.range, window.scrollY) * gapCount)));
    // While the photos are showing, the frame stops the browser panning the
    // page (.rail-snap-hold), so vertical swipes come to onTouchMove instead -
    // see the prop doc for why.
    const hold = (at: { range: ScrollRange }) => {
      const y = window.scrollY;
      const inside = y >= at.range.slideStart - 2 && y <= at.range.slideEnd + 2;
      frameRef.current?.classList.toggle('rail-snap-hold', inside);
      return inside;
    };
    const watch = () => {
      frame = 0;
      const track = trackRef.current;
      if (!geo || !track) return;
      const y = window.scrollY;
      const inside = hold(geo);
      const moved = lastY >= 0 ? Math.abs(y - lastY) : 0;
      const perPhoto = (geo.range.slideEnd - geo.range.slideStart) / gapCount;
      const coasting =
        inside &&
        moved > 0.5 &&
        // Momentum is what follows a finger lifting.
        msSince(lastTouchEndAt.current) < MOMENTUM_WINDOW_MS &&
        touches.current === 0 &&
        settleRaf.current === null &&
        msSince(ownScrollUntil.current) > 0;
      // Momentum also keeps moving frame after frame, where the page being put
      // somewhere - a restored scroll position, a link - moves once and stops.
      // A single frame can't tell a big momentum step (a slow frame mid-fling)
      // from a jump, so after a big one, wait a frame: still moving is
      // momentum, stopped is a jump, snapped to like any other scroll.
      if (coasting && moved >= perPhoto * 0.5 && !undecided) {
        undecided = true;
        lastY = y;
        stillFrames = 0;
        frame = requestAnimationFrame(watch);
        return;
      }
      const wasUndecided = undecided;
      undecided = false;
      if (coasting || (wasUndecided && inside && moved > 0.5 && touches.current === 0)) {
        // The page is coasting with the photos showing - a momentum scroll
        // carried in from outside the rail, or through it. Stop it on the
        // photo showing: one photo per gesture, however hard it was.
        const span = geo.range.slideEnd - geo.range.slideStart;
        const inset = g.index === 0 ? SNAP_END_INSET : g.index === gapCount ? -SNAP_END_INSET : 0;
        ownScrollUntil.current = performance.now() + 150;
        window.scrollTo(window.scrollX, geo.range.slideStart + span * ((g.index + inset) / gapCount));
        lastY = window.scrollY;
        stillFrames = 0;
        frame = requestAnimationFrame(watch);
        return;
      }
      // Mid-swipe the finger has the track; its release decides where it lands.
      if (!swipe.current.caught) {
        const index = photoAt(geo);
        if (index !== g.index) {
          snapTrackTo(g, track, index, geo.step);
          latestMark.current(index);
        }
      }
      stillFrames = y === lastY ? stillFrames + 1 : 0;
      lastY = y;
      if (stillFrames < SNAP_STILL_FRAMES) frame = requestAnimationFrame(watch);
      else geo = null;
    };
    const onScroll = () => {
      if (frame) return;
      // Measured once per burst of scrolling, not per frame.
      geo = read();
      stillFrames = 0;
      frame = requestAnimationFrame(watch);
    };
    // A resize changes the photo width, and with it where every photo sits.
    const onResize = () => {
      const at = read();
      const track = trackRef.current;
      if (!at || !track || swipe.current.axis === 'x') return;
      stopSnapMotion(g);
      placeSnapTrack(g, track, -g.index * at.step);
    };
    // Wherever the page already is on mount - opened or restored part-way
    // down - is a jump, not a glide: there's nothing to glide from.
    const start = read();
    if (start && trackRef.current) {
      g.index = photoAt(start);
      placeSnapTrack(g, trackRef.current, -g.index * start.step);
      hold(start);
      lastY = window.scrollY;
      const index = g.index;
      frame = requestAnimationFrame(() => {
        frame = 0;
        latestMark.current(index);
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (frame) cancelAnimationFrame(frame);
      stopSnapMotion(g);
    };
  }, [snap, totalDwellSvh, gapCount, cssSupported, rangeStartPct, rangeEndPct]);

  // Page-wide listeners, reaching this render's handlers through a ref so
  // they're attached once rather than on every render.
  const latest = useRef<{ touchStart: () => void; touchEnd: (e: TouchEvent) => void; scroll: () => void }>({
    touchStart: noop,
    touchEnd: noop,
    scroll: noop,
  });
  useEffect(() => {
    latest.current = {
      touchStart: () => {
        touches.current += 1;
        // A finger coming down anywhere ends any offset glide where it is, and
        // hands it straight back to the scroll - see handOver. This runs in the
        // capture phase, ahead of this rail's own touchstart, which reads
        // caughtGlide to know the finger caught one.
        caughtGlide.current = glideTarget.current;
        if (glideTarget.current !== null || offsetRef.current !== 0) handOver(false);
      },
      touchEnd: (e: TouchEvent) => {
        touches.current = e.touches.length;
        if (touches.current === 0) lastTouchEndAt.current = performance.now();
      },
      scroll: () => {
        lastScrollAt.current = performance.now();
      },
    };
  });
  useEffect(() => {
    const onTouchStartAnywhere = () => latest.current.touchStart();
    const onTouchEndAnywhere = (e: TouchEvent) => latest.current.touchEnd(e);
    const onScroll = () => latest.current.scroll();
    const capture = { capture: true, passive: true };
    window.addEventListener('touchstart', onTouchStartAnywhere, capture);
    window.addEventListener('touchend', onTouchEndAnywhere, capture);
    window.addEventListener('touchcancel', onTouchEndAnywhere, capture);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStartAnywhere, capture);
      window.removeEventListener('touchend', onTouchEndAnywhere, capture);
      window.removeEventListener('touchcancel', onTouchEndAnywhere, capture);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const onTouchStart = (e: ReactTouchEvent) => {
    suppressClick.current = false;
    const st = swipe.current;
    // Refused up front, and only made active below once this really is a
    // gesture we handle. Otherwise a touch that started somewhere we bailed
    // on could still be claimed by its first move - measured against
    // whatever start coordinates the *previous* gesture left behind, jumping
    // the rail by the difference.
    st.active = false;
    st.axis = null;
    st.caught = false;
    if (gapCount < 1 || e.touches.length !== 1) return;
    const m = measure();
    if (!m) return;
    // Only while the photos are sliding - from the moment the photo has
    // finished swelling out to the moment it starts to settle back. Before
    // then a swipe would drag the next photo in under one still growing;
    // after, there is no photo left to page to (a push past the last one
    // still carries the rail on out - see runsOut). The couple of pixels'
    // give at each end is for a glide that has just landed exactly on the
    // end photo, where the scroll can round a pixel short of the line.
    const range = scrollRange(m);
    if (window.scrollY < range.slideStart - 2 || window.scrollY > range.slideEnd + 2) return;
    cancelSettle();
    const t = e.touches[0];
    st.active = true;
    st.startX = t.clientX;
    st.startY = t.clientY;
    st.lastT = performance.now();
    st.range = range;
    // The page-wide touchstart has already handed any glide back to the
    // scroll; if it caught one, that glide's destination is what this gesture
    // pages from.
    st.inFlight = caughtGlide.current !== null;
    st.base = caughtGlide.current ?? Math.min(gapCount, Math.max(0, Math.round(slideWithin(range, window.scrollY) * gapCount)));
    st.wantX = 0;
    st.samples = [];
  };

  const onTouchMove = (e: ReactTouchEvent) => {
    const st = swipe.current;
    if (!st.active) return;
    // A second finger means a pinch: give the gesture up rather than
    // dragging the track around underneath it.
    if (e.touches.length !== 1) {
      st.active = false;
      return;
    }
    const t = e.touches[0];
    if (st.axis === null) {
      const dx = t.clientX - st.startX;
      const dy = t.clientY - st.startY;
      if (Math.abs(dx) < SWIPE_AXIS_LOCK_PX && Math.abs(dy) < SWIPE_AXIS_LOCK_PX) return;
      st.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      // Vertical is the browser's to pan - except on a snapped rail, whose
      // frame has stopped it doing so (see Snap), where a swipe up or down
      // pages exactly as one left or right does.
      if (st.axis === 'y' && !snap) {
        st.active = false;
        return;
      }
      // Follow the finger from here, not from where it first went down, so
      // the axis lock's few pixels aren't paid back as a jump.
      st.startX = t.clientX;
      st.startY = t.clientY;
    }
    const m = measure();
    const range = st.range;
    if (!m || !range) return;
    const now = performance.now();
    // Along the gesture's own axis. Up and left both mean "next", down and
    // right "previous", so a vertical swipe moves the photos the way the
    // finger goes: up, and the next photo comes in from the right.
    const along = st.axis === 'x' ? t.clientX : t.clientY;
    st.lastT = now;
    st.samples.push({ t: now, x: along });
    while (st.samples.length > 2 && now - st.samples[0].t > PAGE_VELOCITY_MS) st.samples.shift();
    // What the finger has asked for is kept whole in `wantX`; what the
    // photos can actually show is the clamped version of it - past the last
    // photo there is nothing further to pull into view.
    st.wantX = along - (st.axis === 'x' ? st.startX : st.startY);
    if (snap) {
      const track = trackRef.current;
      const g = snapMotion.current;
      if (!track) return;
      if (!st.caught) {
        // Catch the track where it is - part-way through a snap, if one is
        // running - and hold it there for the finger to move. The photo the
        // snap was heading to is the one this gesture pages from.
        const { x } = snapMotionAt(g, now);
        stopSnapMotion(g);
        st.inFlight = Math.abs(x + g.index * m.step) > 0.5;
        st.base = g.index;
        st.basePx = x;
        placeSnapTrack(g, track, x);
        st.caught = true;
      }
      placeSnapTrack(g, track, Math.max(-m.travel, Math.min(0, st.basePx + st.wantX)));
      return;
    }
    const s = slideWithin(range, window.scrollY);
    setOffset(Math.max(-(1 - s) * m.travel, Math.min(s * m.travel, st.wantX)));
  };

  const onTouchEnd = () => {
    const st = swipe.current;
    const wasSwipe = st.active && st.axis !== null;
    st.active = false;
    st.axis = null;
    if (!wasSwipe) return;
    suppressClick.current = true;
    const m = measure();
    const range = st.range;
    if (!m || !range) {
      setOffset(0);
      return;
    }
    const velocity = releaseVelocity();
    if (snap) {
      const track = trackRef.current;
      const g = snapMotion.current;
      if (!track || !st.caught) return;
      st.caught = false;
      const target = pageTarget(-g.x / m.step, velocity, st.base, st.inFlight, gapCount);
      const outwards = runsOut(target, velocity, st.basePx + st.wantX - g.x, m);
      snapTrackTo(g, track, target, m.step);
      markPhoto(target);
      if (outwards) {
        glideScroll(target === gapCount ? range.railEnd : range.railStart, PAGE_OUT_MS);
        return;
      }
      // Move the page scroll onto that photo's own stretch of the slide, so the
      // next scroll carries on from this photo rather than snapping back to
      // wherever the scroll was left. Invisible: the frame is pinned, and
      // everything the scroll still drives is holding still anywhere in the
      // slide.
      const inset = target === 0 ? SNAP_END_INSET : target === gapCount ? -SNAP_END_INSET : 0;
      ownScrollUntil.current = performance.now() + 150;
      window.scrollTo(window.scrollX, range.slideStart + (range.slideEnd - range.slideStart) * ((target + inset) / gapCount));
      return;
    }
    const target = pageTarget(shownAt(m, range), velocity, st.base, st.inFlight, gapCount);
    if (runsOut(target, velocity, st.wantX - offsetRef.current, m)) {
      handOver(false);
      glideScroll(target === gapCount ? range.railEnd : range.railStart, PAGE_OUT_MS);
      return;
    }
    glideTo(target, m, range);
  };

  const panels = photos.map((photo, i) => {
    const image = (
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes={isFill ? '100vw' : 'calc(100vw - 48px)'}
        // Cover, not contain, for a seamless slide: its box runs half a
        // pixel wider than the photo's own ratio (.rail-seamless-photo),
        // and contain would answer that with half a pixel of letterbox -
        // the very gap the overlap is there to close.
        className={`photo-protected ${seamless ? 'object-cover' : 'object-contain'}`}
        draggable={false}
        // The one place lazy loading can't be used: a rail panel sits
        // off to the side of the frame rather than below the fold, so it
        // isn't near the viewport by the browser's reckoning until it has
        // already begun sliding in - and it arrives blank. The grid and
        // the peek stand-ins around it stay lazy. A seamless rail holds
        // off until it's within reach instead (see `approaching`), then
        // goes eager for the same reason.
        loading={seamless && !approaching ? 'lazy' : 'eager'}
        quality={82}
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
      />
    );
    return (
      <div
        key={`${photo.src}-${i}`}
        className={`relative flex h-full items-center justify-center${seamless ? '' : ' cursor-pointer'}`}
        style={{ flex: `0 0 ${panelWidth}` }}
        onClick={() => {
          if (seamless || suppressClick.current) return;
          onOpen(photo);
        }}
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
                  ? { scale: fillZoom }
                  : undefined
                : { scale: photoZoom }
          }
        >
          {seamless ? <div className="rail-seamless-photo">{image}</div> : image}
        </motion.div>
      </div>
    );
  });

  // Positioned purely by scroll, exactly as before - the CSS path on the
  // compositor via .rail-track, the fallback via Framer's inline
  // transform. A snapped track is positioned by the Snap section instead, a
  // whole photo at a time, on either path.
  const track = snap ? (
    <div
      ref={trackRef}
      className={`rail-snap-track relative flex h-full${seamless ? ' rail-seamless-track' : ''}`}
      style={{ gap: railGap }}
    >
      {panels}
    </div>
  ) : cssSupported ? (
    <div
      ref={trackRef}
      className={`rail-track relative flex h-full${seamless ? ' rail-seamless-track' : ''}`}
      style={{ gap: railGap, '--rail-shift': cssShiftValue } as CSSProperties}
    >
      {panels}
    </div>
  ) : (
    <motion.div
      ref={trackRef}
      className={`relative flex h-full${seamless ? ' rail-seamless-track' : ''}`}
      style={{ width: 'max-content', gap: railGap, transform, willChange: 'transform' }}
    >
      {panels}
    </motion.div>
  );

  // A separate layer for the finger's offset and the glide after it, so they
  // compose with the track's own transform instead of replacing it - neither
  // path above has to know that swipe exists, and the offset is back to 0
  // as soon as the glide has landed (see handOver).
  const swipeLayer = (
    <div ref={swipeRef} className="rail-swipe h-full">
      {track}
    </div>
  );

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
        ref={frameRef}
        className={`rail-frame rail-swipe-area sticky top-0 w-full overflow-hidden bg-[var(--bg)] ${
          isFill ? 'rail-frame-fill' : ''
        }`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
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

        {/* The gallery's title. Deliberately the last thing before the
            peek rows: it is hidden by the row below it in paint order,
            which here means the row that comes *after* it in the DOM, and
            revealed as that row travels up off it. Nothing about it
            animates - see .rail-title in globals.css for why the reveal
            and its mirror image on the way out are entirely the peek
            row's own keyframes. */}
        {isFill && title && (
          <h2 className="rail-title">
            {/* Two rules, not one background line behind the text: each is
                a flex item that takes an equal share of whatever the words
                leave over, which is what makes them the same length at any
                viewport without either being measured. Empty and
                decorative - the heading's text is the whole of what it
                says. */}
            <span className="rail-title-rule" aria-hidden="true" />
            <span className="rail-title-text">{title}</span>
            <span className="rail-title-rule" aria-hidden="true" />
          </h2>
        )}

        {/* Stand-ins for the real grid rows either side of this whole rail
            - see the prevRow/nextRow doc comment above and
            .rail-peek-layer in globals.css. Before the swelling photo in
            the DOM, so that photo paints on top once they overlap. */}
        {isFill && prevRow && prevRow.length > 0 && (
          <motion.div
            className="rail-peek-layer rail-peek-above"
            style={cssSupported ? undefined : fallbackReady ? { y: peekAboveY } : undefined}
          >
            {prevRow.map((col, i) => (
              <div
                key={`${col.photo.src}-${i}`}
                style={{ '--rail-peek-delta': peekDelta(prevRow, i) } as CSSProperties}
              >
                <Image
                  src={col.photo.src}
                  alt={col.photo.alt}
                  width={col.photo.width}
                  height={col.photo.height}
                  sizes={peekSizes}
                  className="photo-protected block h-auto w-full"
                  draggable={false}
                  quality={82}
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                />
              </div>
            ))}
          </motion.div>
        )}
        {/* Position dots, in the band under the photo - just before the row
            below in the DOM, so that row hides them at rest and uncovers them
            as it parts, the way the row above does the title. */}
        {isFill && snap && dots && (
          <div className="rail-dots" aria-hidden="true">
            {photos.map((photo, i) => (
              <span
                key={`${photo.src}-${i}`}
                className="rail-dot"
                data-active={i === dotIndex}
                data-far={Math.min(3, Math.abs(i - dotIndex))}
              />
            ))}
          </div>
        )}
        {isFill && nextRow && nextRow.length > 0 && (
          <motion.div
            className="rail-peek-layer rail-peek-below"
            style={cssSupported ? undefined : fallbackReady ? { y: peekBelowY } : undefined}
          >
            {nextRow.map((col, i) => (
              <div key={`${col.photo.src}-${i}`}>
                <Image
                  src={col.photo.src}
                  alt={col.photo.alt}
                  width={col.photo.width}
                  height={col.photo.height}
                  sizes={peekSizes}
                  className="photo-protected block h-auto w-full"
                  draggable={false}
                  quality={82}
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                />
              </div>
            ))}
          </motion.div>
        )}

        {/* Fill variant only: clips the track to one photo's width,
            centred - see .rail-slide-viewport in globals.css for why the
            frame alone (full width, for the peek rows) isn't enough to
            keep adjacent panels hidden. A plain div, not part of the
            cssSupported/fallback split below - its width is a static
            calc(), nothing here needs to animate. */}
        {isFill ? <div className="rail-slide-viewport">{swipeLayer}</div> : swipeLayer}

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
