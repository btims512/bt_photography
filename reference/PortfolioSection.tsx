"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { distributeToColumns, type Photo } from "@/lib/masonry";

/**
 * Two-column masonry gallery.
 *
 * The numbers that matter, measured from the reference:
 *   - 50px page gutters, NO max-width (the grid is fluid to the window)
 *   - 10px between columns, 10px between images
 *   - images are full-bleed: no border, no radius, no shadow, no caption
 *   - each image keeps its own aspect ratio; columns end at different heights
 *
 * Images are packed shortest-column-first (see lib/masonry.ts) so the reading
 * order goes left, right, left, right the way the reference does, instead of
 * straight down column one the way `columns-2` would.
 */

export default function PortfolioSection({ photos }: { photos: Photo[] }) {
  const columns = distributeToColumns(photos, 2);
  let index = 0; // running index, for a stagger that reads across both columns

  return (
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
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.5, ease: "easeOut", delay }}
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
  );
}
