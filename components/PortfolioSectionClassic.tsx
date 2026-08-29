'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { chunkWithBreakouts, distributeToColumns } from '@/lib/masonry';
import { BLUR_DATA_URL } from '@/lib/blur';
import { useRevealWhenReady } from '@/lib/use-reveal';
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
      transition={{ duration: 0.7, delay: currentIndex * 0.09, ease: 'easeOut' }}
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
        loading={priority ? undefined : 'eager'}
        quality={90}
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
      />
    </motion.figure>
  );
}

export default function PortfolioSectionClassic({ id, photos, breakoutEvery }: PortfolioSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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

            // Shortest-column packing: each photo goes into whichever column
            // is currently shortest. Unlike a fixed round-robin, this doesn't
            // resonate with any fixed-period pattern in the input order (e.g.
            // category cycling in featuredPhotos), so genres actually spread
            // across columns instead of aliasing into the same one.
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
