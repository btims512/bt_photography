'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { chunkWithBreakouts, distributeToColumns } from '@/lib/masonry';
import { BLUR_DATA_URL } from '@/lib/blur';
import { useRevealWhenReady } from '@/lib/use-reveal';
import { useMediaQuery } from '@/lib/use-media-query';
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
}

// Beyond a small eager-loaded head start, photos fall back to native lazy
// loading. Eager-loading every photo works fine on fast desktop connections
// but makes every image compete for the same limited mobile bandwidth,
// which is what actually causes slow/incomplete-looking photos on phones -
// lazy-loaded images still get a generous browser-native prefetch margin,
// and scrolling itself takes real time, so this doesn't reintroduce visible
// pop-in for normal scroll speeds.
const EAGER_COUNT = 6;

// Its own component (rather than inline in the .map() below) because the
// reveal hook needs a stable per-photo call site to satisfy rules of hooks.
function GridPhoto({ photo, currentIndex, priority, onOpen }: GridPhotoProps) {
  const { ref, revealed } = useRevealWhenReady<HTMLElement>('400px');
  const hiddenState = { opacity: 0, y: 20, scale: 0.95 };

  return (
    <motion.figure
      ref={ref}
      initial={hiddenState}
      animate={revealed ? { opacity: 1, y: 0, scale: 1 } : hiddenState}
      transition={{ duration: 0.85, delay: currentIndex * 0.07, ease: 'easeOut' }}
      whileHover={{ scale: 1.02 }}
      className="relative m-0 cursor-pointer bg-[var(--bg)]"
      onContextMenu={(e) => e.preventDefault()}
      onClick={onOpen}
    >
      <Image
        src={photo.src}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        sizes="(max-width: 767px) 100vw, 33vw"
        className="photo-protected block h-auto w-full"
        draggable={false}
        priority={priority}
        loading={priority ? undefined : currentIndex < EAGER_COUNT ? 'eager' : undefined}
        quality={90}
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
      />
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

  // Filter out photos without src URLs (placeholders)
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
      <main className="px-6 md:px-[50px] py-6 md:py-8">
        <div className="flex flex-col gap-[10px]">
          {segments.map((segment, segmentIndex) => {
            if (segment.type === 'breakout') {
              const currentIndex = index++;
              return (
                <BreakoutPhoto
                  key={`breakout-${segmentIndex}-${segment.photo.src}`}
                  photo={segment.photo}
                  priority={currentIndex === 0}
                  onClick={() => setOpenIndex(validPhotos.indexOf(segment.photo))}
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
                        onOpen={() => setOpenIndex(validPhotos.indexOf(photo))}
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
              <div key={`grid-${segmentIndex}`} className="flex flex-col gap-[10px] md:flex-row">
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
                          onOpen={() => setOpenIndex(validPhotos.indexOf(photo))}
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
