'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { chunkWithBreakouts, distributeToColumns } from '@/lib/masonry';
import { BLUR_DATA_URL } from '@/lib/blur';
import Lightbox from './Lightbox';
import BreakoutPhoto from './BreakoutPhoto';
import type { Photo } from '@/lib/photos';

interface PortfolioSectionProps {
  id: string;
  photos: Photo[];
  /** Interrupt the grid with a full-bleed photo every N photos. Omit to disable. */
  breakoutEvery?: number;
}

export default function PortfolioSectionModern({ id, photos, breakoutEvery }: PortfolioSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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
              <div key={`grid-${segmentIndex}`} className="flex flex-col gap-2 md:flex-row md:gap-3">
                {columns.map((column, columnIndex) => (
                  <div key={columnIndex} className="flex flex-1 flex-col gap-2 md:gap-3">
                    {column.map((photo) => {
                      const currentIndex = index++;
                      const priority = currentIndex === 0;
                      return (
                        <motion.figure
                          key={`${currentIndex}-${photo.src}`}
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          whileInView={{ opacity: 1, y: 0, scale: 1 }}
                          viewport={{ once: true, margin: '400px' }}
                          transition={{ duration: 0.7, delay: currentIndex * 0.09, ease: 'easeOut' }}
                          whileHover={{ scale: 1.02 }}
                          className="relative m-0 cursor-pointer bg-[var(--bg)]"
                          onContextMenu={(e) => e.preventDefault()}
                          onClick={() => setOpenIndex(validPhotos.indexOf(photo))}
                        >
                          <Image
                            src={photo.src}
                            alt={photo.alt}
                            width={photo.width}
                            height={photo.height}
                            sizes="(max-width: 767px) 50vw, 33vw"
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
