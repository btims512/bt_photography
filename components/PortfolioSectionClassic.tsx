'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { chunkWithRails, distributeToColumns, repeatWithOffset } from '@/lib/masonry';
import { BLUR_DATA_URL } from '@/lib/blur';
import { useRevealWhenReady } from '@/lib/use-reveal';
import { useWasInitiallyVisible } from '@/lib/use-was-initially-visible';
import { useMediaQuery } from '@/lib/use-media-query';
import { useLayoutMode } from '@/lib/layout-mode';
import Lightbox from './Lightbox';
import BreakoutPhoto from './BreakoutPhoto';
import MobileRail, { type PeekColumn } from './MobileRail';
import type { Photo } from '@/lib/photos';

/**
 * Describes the row of a grid segment that adjoins a rail, so the rail can
 * redraw it as a stand-in while it's pinned over the real thing (see
 * MobileRail's prevRow/nextRow). `edge` says which end of each column
 * touches the rail: 'bottom' for the segment above it, 'top' for below.
 *
 * The column packing has to be the one the real grid used, or the copies
 * would be of the wrong photos - hence distributeToColumns here with the
 * same count the grid renders at. It tracks column heights in units of
 * column width, which is the same currency PeekColumn.heightUnits wants,
 * though the gaps between photos are counted separately since packing
 * ignores them and the rendered column doesn't.
 */
function peekRow(photos: Photo[], columnCount: number, edge: 'top' | 'bottom'): PeekColumn[] {
  const columns = columnCount === 1 ? [photos] : distributeToColumns(photos, columnCount);
  return columns
    .filter((column) => column.length > 0)
    .map((column) => ({
      photo: edge === 'bottom' ? column[column.length - 1] : column[0],
      heightUnits: column.reduce((sum, p) => sum + p.height / p.width, 0),
      count: column.length,
    }));
}

/**
 * Stand-in for a rail with no grid segment on one side at all - the very
 * first or last thing on the page, which peekRow has nothing to draw from.
 * Repeats one photo (the gallery's own first/last, passed in by the
 * caller) across every column the rail needs, so that side still reads as
 * "the grid continues" rather than leaving the row empty. Each column gets
 * its own PeekColumn (same photo, count 1) rather than one shared across a
 * wider flex child, so it lays out identically to a real peekRow result -
 * MobileRail.tsx and .rail-peek-layer don't need to know this row isn't
 * backed by a real segment.
 */
function fallbackRow(photo: Photo, columnCount: number): PeekColumn[] {
  return Array.from({ length: columnCount }, () => ({
    photo,
    heightUnits: photo.height / photo.width,
    count: 1,
  }));
}

interface PortfolioSectionProps {
  id: string;
  photos: Photo[];
  /** Interrupt the grid with a full-bleed photo every N photos. Omit to disable. */
  breakoutEvery?: number;
}

// Mobile-only cadence for the horizontal photo rail (see MobileRail.tsx):
// every MOBILE_LANDSCAPE_EVERY landscape photos, insert a rail of
// MOBILE_RAIL_SIZE portrait photos, then resume the grid. Desktop is
// unaffected - it keeps the existing single-photo BreakoutPhoto interrupt.
const MOBILE_LANDSCAPE_EVERY = 9;
const MOBILE_RAIL_SIZE = 6;
// The real catalog doesn't yet have enough landscape/portrait photos to
// cycle this pattern more than once or twice, so this repeats the
// (already genre/orientation-interleaved) photo list a few laps purely to
// preview the cadence - offsetting each lap's start so consecutive laps
// don't visibly replay in the exact same order. Drop this once there are
// enough real photos of each orientation to not need padding.
const MOBILE_RAIL_LAPS = 4;

interface GridPhotoProps {
  photo: Photo;
  currentIndex: number;
  priority: boolean;
  onOpen: () => void;
  isDesktop: boolean;
}

// Every grid photo eager-loads (fetch starts immediately at page load,
// never deferred to scroll proximity) so nothing is still downloading by
// the time it's scrolled to - including everything after the breakout,
// which is far enough down the page that native lazy-loading's fetch
// timing isn't reliably ahead of scroll speed. The tradeoff is more
// simultaneous network load on slow connections; quality is tuned down a
// touch (see GridPhoto's `quality`) to help offset that.

// Its own component (rather than inline in the .map() below) because the
// reveal hooks need a stable per-photo call site to satisfy rules of hooks.
//
// Desktop keeps the original reveal-on-scroll (fade + rise + scale, see
// useRevealWhenReady) since it re-triggers cleanly as each photo scrolls
// into view. Mobile behaves differently on purpose: only whatever was
// already visible in the viewport at page load (see
// useWasInitiallyVisible) slides in once, from alternating sides -
// currentIndex 0 from the right, 1 from the left, and so on - and anything
// reached only by scrolling gets no entrance animation at all, appearing
// the instant its data is ready rather than replaying a reveal each time.
function GridPhoto({ photo, currentIndex, priority, onOpen, isDesktop }: GridPhotoProps) {
  const { ref: revealRef, revealed } = useRevealWhenReady<HTMLElement>('400px');
  const { ref: initialRef, wasInitiallyVisible } = useWasInitiallyVisible<HTMLElement>();
  const { headerReady } = useLayoutMode();

  const setRef = (node: HTMLElement | null) => {
    if (isDesktop) revealRef.current = node;
    else initialRef.current = node;
  };

  const image = (
    <Image
      src={photo.src}
      alt={photo.alt}
      width={photo.width}
      height={photo.height}
      sizes="(max-width: 767px) 100vw, 33vw"
      className="photo-protected block h-auto w-full"
      draggable={false}
      priority={priority}
      loading={priority ? undefined : 'eager'}
      quality={82}
      placeholder="blur"
      blurDataURL={BLUR_DATA_URL}
    />
  );

  if (isDesktop) {
    const hiddenState = { opacity: 0, y: 20, scale: 0.95 };
    return (
      <motion.figure
        ref={setRef}
        initial={hiddenState}
        animate={revealed ? { opacity: 1, y: 0, scale: 1 } : hiddenState}
        transition={{ duration: 0.85, delay: currentIndex * 0.07, ease: 'easeOut' }}
        whileHover={{ scale: 1.02 }}
        className="relative m-0 cursor-pointer bg-[var(--bg)]"
        onContextMenu={(e) => e.preventDefault()}
        onClick={onOpen}
      >
        {image}
      </motion.figure>
    );
  }

  // Every mobile photo starts in the same hidden, off-to-one-side pose at
  // mount - `initial` only ever matters on the first render, so it can't
  // wait for the (necessarily async) wasInitiallyVisible determination.
  // Once ready, photos confirmed visible at load animate in for real;
  // anything below the fold snaps instantly (duration: 0) to its resting
  // state instead, invisibly, since it's still off-screen at that point -
  // by the time a real scroll could reach it, this has long since resolved.
  const fromRight = currentIndex % 2 === 0;
  const hiddenState = { opacity: 0, x: fromRight ? 60 : -60 };
  const visibleState = { opacity: 1, x: 0 };
  const isReady = wasInitiallyVisible !== null && headerReady;

  return (
    <motion.figure
      ref={setRef}
      initial={hiddenState}
      animate={isReady ? visibleState : hiddenState}
      transition={
        isReady && wasInitiallyVisible
          ? { duration: 0.6, delay: currentIndex * 0.08, ease: 'easeOut' }
          : { duration: 0 }
      }
      className="relative m-0 cursor-pointer bg-[var(--bg)]"
      onContextMenu={(e) => e.preventDefault()}
      onClick={onOpen}
    >
      {image}
    </motion.figure>
  );
}

export default function PortfolioSectionClassic({ id, photos, breakoutEvery }: PortfolioSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  // Defaults to mobile's single-column list (matches this codebase's
  // mobile-first Tailwind convention) so the brief pre-hydration mismatch on
  // desktop is "not yet packed into columns" rather than "3 columns crammed
  // onto a phone screen" for mobile visitors, who are the majority case.
  const isDesktop = useMediaQuery('(min-width: 768px)', false);
  // False on the server and the hydration render (where isDesktop is still
  // its mobile default even on a desktop viewport), true from the first
  // post-mount render, once isDesktop reflects the real viewport. Gates the
  // mobile rail layout below: without it, desktop's initial render would
  // produce the rail segment list (repeated photos, multi-screen-tall rail
  // shells) and then swap to the breakout layout after mount - a large,
  // visibly broken-looking flash. Gated this way, every first paint is the
  // original breakout layout, and only real phones swap to rails (a swap
  // that happens below the fold, since rails never sit at the very top).
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter out photos without src URLs (placeholders)
  const validPhotos = photos.filter((photo) => photo.src.trim() !== '');

  if (validPhotos.length === 0) {
    return (
      <section id={id} className="px-6 md:px-[50px] py-12 text-center" style={{backgroundColor: 'var(--bg)', color: 'var(--dim)'}}>
        <p>No images available yet</p>
      </section>
    );
  }

  // Desktop is archived on a plain grid for now - one segment, every photo,
  // the same masonry columns the 'grid' segment type already renders below.
  // This used to be chunkWithBreakouts (rail interrupts + full-bleed
  // breakout photos), which is what mounted && !isDesktop being false also
  // fell through to *before* mount (there being no confirmed breakpoint
  // yet) - so this branch already doubled as the pre-hydration default for
  // every visitor, not just confirmed desktop ones; it still does. The
  // rail/breakout machinery itself - chunkWithBreakouts, DesktopRail,
  // SplitGrid, padLandscapeForBreakouts, the CSS driving all of it - is
  // untouched and still imported/exported where it was; only this call
  // site stopped reaching for it, so bringing desktop's scrolling
  // treatment back later is a one-line change here, not a rebuild.
  const segments = !breakoutEvery || isDesktop || !mounted
    ? [{ type: 'grid' as const, photos: validPhotos }]
    : chunkWithRails(repeatWithOffset(validPhotos, MOBILE_RAIL_LAPS), MOBILE_LANDSCAPE_EVERY, MOBILE_RAIL_SIZE);
  let index = 0;

  // The Lightbox's prev/next order has to match whatever's actually on
  // screen, not validPhotos' original order - which stopped being the same
  // thing once desktop's segments started padding/repeating landscape
  // photos (padLandscapeForBreakouts above) and packing them into columns
  // (distributeToColumns below), and mobile's started repeating everything
  // for the rail (repeatWithOffset above). Walking segments the same way
  // the JSX below does - including desktop's own column-packing - keeps
  // this from drifting out of sync with a future change to either.
  const visualOrder: Photo[] = [];
  for (const segment of segments) {
    if (segment.type === 'breakout') {
      visualOrder.push(segment.photo);
    } else if (segment.type === 'rail' || !isDesktop) {
      visualOrder.push(...segment.photos);
    } else {
      for (const column of distributeToColumns(segment.photos, 3)) {
        visualOrder.push(...column);
      }
    }
  }

  return (
    <section id={id} style={{backgroundColor: 'var(--bg)'}}>
      <main className="px-6 md:px-[50px] py-6 md:py-8">
        <div className="flex flex-col gap-[10px]">
          {segments.map((segment, segmentIndex) => {
            if (segment.type === 'breakout') {
              const currentIndex = index++;
              // isDesktop is part of the key on purpose: BreakoutPhoto
              // renders completely different DOM per branch, but framer's
              // useInView/useScroll only capture ref.current when their
              // effects first run - for a component that hydrates in the
              // mobile branch (isDesktop's SSR default) and then flips to
              // desktop, they'd keep observing the unmounted mobile node
              // forever, leaving the desktop frame permanently stuck in its
              // hidden pre-entrance state (a blank 100svh gap where the
              // photo belongs). Changing the key forces a remount on the
              // flip so every hook re-binds to the real node. Grid photos
              // don't need this only because their keys happen to change
              // across the flip anyway (column packing renumbers them).
              return (
                <BreakoutPhoto
                  key={`breakout-${segmentIndex}-${segment.photo.src}-${isDesktop ? 'd' : 'm'}`}
                  photo={segment.photo}
                  priority={currentIndex === 0}
                  onClick={() => setOpenIndex(visualOrder.indexOf(segment.photo))}
                  isDesktop={isDesktop}
                />
              );
            }

            if (segment.type === 'rail') {
              // Both breakpoints now run the same rail on the same 'fill'
              // treatment - the photo rests at grid-photo size between
              // stand-ins for the grid rows either side of it, swells,
              // slides sideways through the set, then settles back into
              // the flow. Only the scale differs: "one grid photo" is the
              // whole content width on mobile's single column and one
              // column of three on desktop, which is the single number
              // (--rail-grid-w) everything else follows from.
              //
              // isDesktop stays in the key so a breakpoint change remounts
              // rather than re-renders - the scroll hooks capture
              // ref.current when their effects first run, and the two
              // breakpoints hand it different neighbour rows, so a swap
              // without a remount would leave it bound to stale geometry.
              //
              // DesktopRail (vertical travel, black backdrop, corner
              // wipes) and MobileRail's own 'classic' variant are both
              // left intact rather than deleted: nothing selects either
              // today, but they're finished treatments to come back to.
              const railKey = `rail-${segmentIndex}-${segment.photos[0]?.src ?? ''}-${isDesktop ? 'd' : 'm'}`;
              // The grid rows the rail adjoins, which it redraws as
              // stand-ins while it's pinned over them.
              const prevSegment = segments[segmentIndex - 1];
              const nextSegment = segments[segmentIndex + 1];
              const railColumns = isDesktop ? 3 : 1;
              // A rail with no grid segment on one side - the page's very
              // first or last thing - falls back to the gallery's own
              // first/last photo (see fallbackRow) rather than rendering
              // no stand-in at all.
              const prevRow =
                prevSegment?.type === 'grid'
                  ? peekRow(prevSegment.photos, railColumns, 'bottom')
                  : fallbackRow(validPhotos[0], railColumns);
              const nextRow =
                nextSegment?.type === 'grid'
                  ? peekRow(nextSegment.photos, railColumns, 'top')
                  : fallbackRow(validPhotos[validPhotos.length - 1], railColumns);
              return (
                <MobileRail
                  key={railKey}
                  photos={segment.photos}
                  onOpen={(photo) => setOpenIndex(visualOrder.indexOf(photo))}
                  variant="fill"
                  prevRow={prevRow}
                  nextRow={nextRow}
                />
              );
            }

            if (!isDesktop) {
              // Mobile: a flat single-column list in the photos' real order.
              // A packed multi-column masonry doesn't have a clean mobile
              // equivalent (CSS Grid forces every column to share row
              // heights, and grouping columns in the DOM then stacking them
              // with flex-col shows all of column 0, then column 1, etc,
              // scrambling the reading order) - so mobile just skips column
              // packing entirely instead of faking it.
              return (
                <div key={`grid-${segmentIndex}`} className="flex flex-col gap-[10px]">
                  {segment.photos.map((photo) => {
                    const currentIndex = index++;
                    return (
                      <GridPhoto
                        key={`${currentIndex}-${photo.src}`}
                        photo={photo}
                        currentIndex={currentIndex}
                        priority={currentIndex === 0}
                        onOpen={() => setOpenIndex(visualOrder.indexOf(photo))}
                        isDesktop={isDesktop}
                      />
                    );
                  })}
                </div>
              );
            }

            // Desktop: shortest-column packing, each photo going into
            // whichever column is currently shortest so columns end at
            // similar heights. Independent per-column flex flow (rather
            // than CSS grid) is what makes a true masonry possible - grid
            // would force every row to the height of its tallest column.
            // items-start on the row is what actually delivers that: a
            // flex row's default cross-axis behaviour is stretch, which
            // silently re-imposes the exact "every column matches the
            // tallest one" grid forces - inflating the shorter columns
            // with blank space below their real last photo rather than
            // clipping anything, so it went unnoticed while photos were
            // split across many small segments (each column's natural
            // imbalance only a photo or two) and only became obvious once
            // desktop's rail/breakout interrupts were archived (below)
            // and every photo landed in one large segment instead, where
            // shortest-column packing's own imperfection compounds over
            // more photos.
            //
            // These segments used to be wrapped in SplitGrid, which drew
            // the halves either side of a rail apart so the rail's black
            // frame opened in the widening gap. The fill rail has no
            // black frame to reveal, and - more decisively - it now draws
            // copies of these very photos as its stand-ins, positioned to
            // land exactly on the originals. A transform on the real ones
            // moves them out from under their copies and the seam opens
            // up, so the parting had to go with the backdrop that
            // motivated it. SplitGrid.tsx is left in the tree alongside
            // DesktopRail for whenever that treatment comes back.
            const columns = distributeToColumns(segment.photos, 3);
            const gridBody = (
              <div className="flex flex-col gap-[10px] md:flex-row md:items-start">
                {columns.map((column, columnIndex) => (
                  <div key={columnIndex} className="flex flex-1 flex-col gap-[10px]">
                    {column.map((photo) => {
                      const currentIndex = index++;
                      return (
                        <GridPhoto
                          key={`${currentIndex}-${photo.src}`}
                          photo={photo}
                          currentIndex={currentIndex}
                          priority={currentIndex === 0}
                          onOpen={() => setOpenIndex(visualOrder.indexOf(photo))}
                          isDesktop={isDesktop}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            );

            return <div key={`grid-${segmentIndex}`}>{gridBody}</div>;
          })}
        </div>
      </main>
      <Lightbox
        photos={visualOrder}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onNavigate={setOpenIndex}
      />
    </section>
  );
}
