'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { distributeRoundRobin } from '@/lib/masonry';
import type { Photo } from '@/lib/photos';

interface PortfolioSectionProps {
  id: string;
  photos: Photo[];
}

export default function PortfolioSectionClassic({ id, photos }: PortfolioSectionProps) {
  // Filter out photos without src URLs (placeholders)
  const validPhotos = photos.filter((photo) => photo.src.trim() !== '');

  if (validPhotos.length === 0) {
    return (
      <section id={id} className="px-6 md:px-[50px] py-12 text-center" style={{backgroundColor: 'var(--bg)', color: 'var(--dim)'}}>
        <p>No images available yet</p>
      </section>
    );
  }

  // Round-robin (not shortest-column) so photo order is preserved left-to-right,
  // e.g. landscape/portrait/landscape per row.
  const columns = distributeRoundRobin(validPhotos, 3);
  let index = 0;

  return (
    <section id={id} style={{backgroundColor: 'var(--bg)'}}>
      <main className="px-6 md:px-[50px] py-6 md:py-8">
        <div className="flex flex-col gap-[10px] md:flex-row">
          {columns.map((column, columnIndex) => (
            <div key={columnIndex} className="flex flex-1 flex-col gap-[10px]">
              {column.map((photo) => {
                const priority = index++ === 0;
                return (
                  <motion.figure
                    key={photo.src}
                    whileHover={{ scale: 1.02 }}
                    className="relative m-0 cursor-pointer"
                    onContextMenu={(e) => e.preventDefault()}
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
    </section>
  );
}
