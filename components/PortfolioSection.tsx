'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { distributeToColumns, type Photo } from '@/lib/masonry';

interface PortfolioSectionProps {
  id: string;
  photos: Photo[];
}

export default function PortfolioSection({ id, photos }: PortfolioSectionProps) {
  // Filter out photos without src URLs (placeholders)
  const validPhotos = photos.filter((photo) => photo.src.trim() !== '');

  if (validPhotos.length === 0) {
    return (
      <section id={id} className="bg-white px-6 md:px-[50px] py-12 text-center text-gray-500">
        <p>No images available yet</p>
      </section>
    );
  }

  const columns = distributeToColumns(validPhotos, 2);
  let index = 0;

  return (
    <section id={id} className="bg-white">
      <main className="px-6 md:px-[50px]">
        <div className="flex flex-col gap-[10px] md:flex-row">
          {columns.map((column, columnIndex) => (
            <div key={columnIndex} className="flex flex-1 flex-col gap-[10px]">
              {column.map((photo) => {
                const delay = index++ * 0.06;
                return (
                  <motion.figure
                    key={photo.src}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.5, ease: 'easeOut', delay }}
                    className="relative m-0"
                  >
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      width={photo.width}
                      height={photo.height}
                      sizes="(max-width: 767px) calc(100vw - 48px), calc((100vw - 110px) / 2)"
                      className="block h-auto w-full"
                      priority={delay === 0}
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
