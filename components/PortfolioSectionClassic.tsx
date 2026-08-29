'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { distributeToColumns } from '@/lib/masonry';
import Lightbox from './Lightbox';
import type { Photo } from '@/lib/photos';

interface PortfolioSectionProps {
  id: string;
  photos: Photo[];
}

export default function PortfolioSectionClassic({ id, photos }: PortfolioSectionProps) {
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

  // Shortest-column packing: each photo goes into whichever column is
  // currently shortest. Unlike a fixed round-robin, this doesn't resonate
  // with any fixed-period pattern in the input order (e.g. category cycling
  // in featuredPhotos), so genres actually spread across columns instead of
  // aliasing into the same one.
  const columns = distributeToColumns(validPhotos, 3);
  let index = 0;

  return (
    <section id={id} style={{backgroundColor: 'var(--bg)'}}>
      <main className="px-6 md:px-[50px] py-6 md:py-8">
        <div className="flex flex-col gap-[10px] md:flex-row">
          {columns.map((column, columnIndex) => (
            <div key={columnIndex} className="flex flex-1 flex-col gap-[10px]">
              {column.map((photo) => {
                const currentIndex = index++;
                const priority = currentIndex === 0;
                return (
                  <motion.figure
                    key={photo.src}
                    initial={{ opacity: 0, y: 16, scale: 0.96 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.55, delay: currentIndex * 0.07, ease: 'easeOut' }}
                    whileHover={{ scale: 1.02 }}
                    className="relative m-0 cursor-pointer"
                    onContextMenu={(e) => e.preventDefault()}
                    onClick={() => setOpenIndex(validPhotos.indexOf(photo))}
                  >
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      width={photo.width}
                      height={photo.height}
                      sizes="(max-width: 767px) 100vw, 33vw"
                      className="block h-auto w-full"
                      priority={priority}
                    />
                  </motion.figure>
                );
              })}
            </div>
          ))}
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
