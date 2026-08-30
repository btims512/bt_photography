'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { chunkWithBreakouts, distributeToColumns } from '@/lib/masonry';
import { BLUR_DATA_URL } from '@/lib/blur';
import { useRevealWhenReady } from '@/lib/use-reveal';
import { useWasInitiallyVisible } from '@/lib/use-was-initially-visible';
import { useMediaQuery } from '@/lib/use-media-query';
import { useLayoutMode } from '@/lib/layout-mode';
import Lightbox from './Lightbox';
import BreakoutPhoto from './BreakoutPhoto';
import type { Photo } from '@/lib/photos';

interface PortfolioSectionProps {
  id: string;
  photos: Photo[];
  /** Interrupt the grid with a full-bleed photo every N photos. Omit to disable. */
  breakoutEvery?: number;
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

export default function PortfolioSectionModern({ id, photos, breakoutEvery }: PortfolioSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  // Defaults to mobile's single-column list (matches this codebase's
  // mobile-first Tailwind convention) so the brief pre-hydration mismatch on
  // desktop is "not yet packed into columns" rather than "3 columns crammed
  // onto a phone screen" for mobile visitors, who are the majority case.
  const isDesktop = useMediaQuery('(min-width: 768px)', false);

  // Filter out photos without src URLs
  const validPhotos = photos.filter((photo) => photo.src.trim() !== '');

  if (validPhotos.length === 0) {
    return (
      <section id={id} className="px-6 md:px-[50px] py-12 text-center" style={{backgroundColor: 'var(--bg)', color: 'var(--dim)'}}>
        <p>No images available yet</p>
      </section>
    );
  }

  const segments = breakoutEvery
    ? chunkWithBreakouts(validPhotos, breakoutEvery)
    : [{ type: 'grid' as const, photos: validPhotos }];
  let index = 0;

  return (
    <section id={id} style={{backgroundColor: 'var(--bg)'}}>
      <main className="px-6 md:px-[50px] py-8 md:py-10">
        <div className="flex flex-col gap-2 md:gap-3">
          {segments.map((segment, segmentIndex) => {
            if (segment.type === 'breakout') {
              const currentIndex = index++;
              return (
                <BreakoutPhoto
                  // isDesktop in the key + as a prop for the same reason as
                  // PortfolioSectionClassic: a mobile->desktop flip must
                  // remount so framer's ref-bound hooks re-bind to the
                  // branch that actually stays mounted.
                  key={`breakout-${segmentIndex}-${segment.photo.src}-${isDesktop ? 'd' : 'm'}`}
                  photo={segment.photo}
                  priority={currentIndex === 0}
                  onClick={() => setOpenIndex(validPhotos.indexOf(segment.photo))}
                  isDesktop={isDesktop}
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
                <div key={`grid-${segmentIndex}`} className="flex flex-col gap-2">
                  {segment.photos.map((photo) => {
                    const currentIndex = index++;
                    return (
                      <GridPhoto
                        key={`${currentIndex}-${photo.src}`}
                        photo={photo}
                        currentIndex={currentIndex}
                        priority={currentIndex === 0}
                        onOpen={() => setOpenIndex(validPhotos.indexOf(photo))}
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
            const columns = distributeToColumns(segment.photos, 3);
            return (
              <div key={`grid-${segmentIndex}`} className="flex flex-col gap-2 md:flex-row md:gap-3">
                {columns.map((column, columnIndex) => (
                  <div key={columnIndex} className="flex flex-1 flex-col gap-2 md:gap-3">
                    {column.map((photo) => {
                      const currentIndex = index++;
                      return (
                        <GridPhoto
                          key={`${currentIndex}-${photo.src}`}
                          photo={photo}
                          currentIndex={currentIndex}
                          priority={currentIndex === 0}
                          onOpen={() => setOpenIndex(validPhotos.indexOf(photo))}
                          isDesktop={isDesktop}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </main>
      <Lightbox
        photos={validPhotos}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onNavigate={setOpenIndex}
      />
    </section>
  );
}
