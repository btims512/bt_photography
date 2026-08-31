'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { chunkWithBreakouts, chunkWithRails, distributeToColumns, repeatWithOffset } from '@/lib/masonry';
import { BLUR_DATA_URL } from '@/lib/blur';
import { useRevealWhenReady } from '@/lib/use-reveal';
import { useWasInitiallyVisible } from '@/lib/use-was-initially-visible';
import { useMediaQuery } from '@/lib/use-media-query';
import { useLayoutMode } from '@/lib/layout-mode';
import Lightbox from './Lightbox';
import BreakoutPhoto from './BreakoutPhoto';
import DesktopRail from './DesktopRail';
import SplitGrid from './SplitGrid';
import MobileRail from './MobileRail';
import type { Photo } from '@/lib/photos';

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
// Photos per desktop vertical carousel (see DesktopRail.tsx). Desktop
// draws from the unrepeated catalog, so this is deliberately smaller than
// mobile's - the portrait supply has to stretch across several rails.
const DESKTOP_RAIL_SIZE = 4;
// The real catalog doesn't yet have enough landscape/portrait photos to
// cycle this pattern more than once or twice, so this repeats the
// (already genre/orientation-interleaved) photo list a few laps purely to
// preview the cadence - offsetting each lap's start so consecutive laps
// don't visibly replay in the exact same order. Drop this once there are
// enough real photos of each orientation to not need padding.
const MOBILE_RAIL_LAPS = 4;

/**
 * chunkWithBreakouts (lib/masonry.ts) dispenses one portrait photo per
 * breakoutEvery landscape photos; whatever's left once landscape supply
 * runs out gets dumped into a single trailing grid segment instead of a
 * breakout each. The real catalog only has a handful of landscape photos -
 * nowhere near enough for more than one breakoutEvery cycle - so without
 * this, only the first real portrait ever got a breakout and the rest
 * piled up together at the end, reading as "all landscape, then all
 * portrait." This pads landscape up to breakoutEvery * portraitCount so
 * every real portrait gets its own turn, spread through the page, with a
 * rotating offset (repeatWithOffset) so cycles don't visibly replay the
 * same block back to back. Scoped to desktop's own segmentation, not the
 * shared photos prop - mobile builds its own repeated pool on top of
 * whatever's passed in (see MOBILE_RAIL_LAPS above), so padding this list
 * further here would also multiply mobile's rail count as a side effect.
 * Drop this once the catalog has enough real landscape photos to not need
 * it.
 */
function padLandscapeForBreakouts(photos: Photo[], breakoutEvery: number, railSize = 1): Photo[] {
  const landscape = photos.filter((p) => p.width >= p.height);
  const portraits = photos.filter((p) => p.height > p.width);
  if (landscape.length === 0 || portraits.length === 0) return photos;

  // Each interrupt is now a carousel of railSize portraits rather than a
  // single photo, so the portrait pool needs repeating to keep the same
  // number of interrupts across the page - left unrepeated, the catalog's
  // handful of portraits fills one carousel and the entire rest of the
  // page runs without a single interrupt. The landscape target is then
  // derived from how many interrupts that pool can actually feed, so the
  // grid still spaces them breakoutEvery apart.
  const pool = railSize > 1 ? repeatWithOffset(portraits, railSize) : portraits;
  const interrupts = Math.max(1, Math.ceil(pool.length / railSize));
  const targetLandscapeCount = breakoutEvery * interrupts;
  const laps = Math.ceil(targetLandscapeCount / landscape.length);
  const paddedLandscape = repeatWithOffset(landscape, laps).slice(0, targetLandscapeCount);
  return [...pool, ...paddedLandscape];
}

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

  const segments = !breakoutEvery
    ? [{ type: 'grid' as const, photos: validPhotos }]
    : mounted && !isDesktop
      ? chunkWithRails(
          repeatWithOffset(validPhotos, MOBILE_RAIL_LAPS),
          MOBILE_LANDSCAPE_EVERY,
          MOBILE_RAIL_SIZE
        )
      : chunkWithBreakouts(padLandscapeForBreakouts(validPhotos, breakoutEvery, DESKTOP_RAIL_SIZE), breakoutEvery, 3, DESKTOP_RAIL_SIZE);
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
              // Both breakpoints now interrupt the grid with a rail, but
              // they travel in different directions and open differently -
              // see each component's doc comment. isDesktop is part of the
              // key so a breakpoint change remounts rather than re-renders,
              // for the same reason BreakoutPhoto needed it below: these
              // components' scroll hooks capture ref.current when their
              // effects first run, and a swap without a remount would leave
              // them bound to a node that no longer exists.
              const railKey = `rail-${segmentIndex}-${segment.photos[0]?.src ?? ''}-${isDesktop ? 'd' : 'm'}`;
              if (isDesktop) {
                return (
                  <DesktopRail
                    key={railKey}
                    photos={segment.photos}
                    onOpen={(photo) => setOpenIndex(visualOrder.indexOf(photo))}
                  />
                );
              }
              // Every mobile rail now runs MobileRail's 'fill' variant:
              // no black backdrop or edge rules, the photo itself swells
              // from grid size to full-bleed between two stand-ins for
              // its neighbouring grid photos. The 'classic' variant it
              // replaced (black stage, white edge rules) is deliberately
              // left intact in MobileRail.tsx and globals.css rather than
              // deleted - nothing on the page selects it today, but it's
              // still a complete working treatment to come back to, and
              // switching a rail back is a one-line change here.
              //
              // prevPhoto/nextPhoto are the neighbouring grid segments'
              // adjoining photos, which 'fill' renders as its stand-ins.
              // In practice both neighbours are always grid segments, the
              // page alternating grid/rail; the type checks guard a rail
              // that ends up first or last with no grid on one side, in
              // which case that side simply renders no stand-in.
              const prevSegment = segments[segmentIndex - 1];
              const nextSegment = segments[segmentIndex + 1];
              const prevPhoto =
                prevSegment?.type === 'grid'
                  ? prevSegment.photos[prevSegment.photos.length - 1]
                  : undefined;
              const nextPhoto = nextSegment?.type === 'grid' ? nextSegment.photos[0] : undefined;
              return (
                <MobileRail
                  key={railKey}
                  photos={segment.photos}
                  onOpen={(photo) => setOpenIndex(visualOrder.indexOf(photo))}
                  variant="fill"
                  prevPhoto={prevPhoto}
                  nextPhoto={nextPhoto}
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
            // A grid segment sitting either side of a rail draws away from
            // it as the rail arrives, so the grid parts and the rail's
            // black frame opens in the gap - see SplitGrid.tsx. Most
            // segments have a rail on *both* sides, since the page
            // alternates grid/rail, and those have to push down away from
            // the rail above and up away from the one below across their
            // own passage - checking only for a rail below (and so
            // treating every middle segment as 'up') left the lower half
            // of every split not moving at all. Desktop only, matching
            // where DesktopRail renders.
            const railBelow = segments[segmentIndex + 1]?.type === 'rail';
            const railAbove = segments[segmentIndex - 1]?.type === 'rail';
            const splitDirection =
              railAbove && railBelow ? 'both' : railBelow ? 'up' : railAbove ? 'down' : null;

            const columns = distributeToColumns(segment.photos, 3);
            const gridBody = (
              <div className="flex flex-col gap-[10px] md:flex-row">
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

            return splitDirection ? (
              <SplitGrid key={`grid-${segmentIndex}`} direction={splitDirection}>
                {gridBody}
              </SplitGrid>
            ) : (
              <div key={`grid-${segmentIndex}`}>{gridBody}</div>
            );
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
