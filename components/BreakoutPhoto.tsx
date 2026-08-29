'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { BLUR_DATA_URL } from '@/lib/blur';
import type { Photo } from '@/lib/photos';

interface BreakoutPhotoProps {
  photo: Photo;
  priority?: boolean;
  onClick: () => void;
}

/**
 * A full-bleed photo that pins itself to the viewport while the user
 * scrolls, zooming in while panning slowly down through an oversized
 * version of the image (a fixed window pushing into a bigger canvas)
 * instead of flashing past like a regular grid photo, then releases back
 * into the grid once the extra scroll distance below is used up. Uses
 * `dvh` rather than `vh` throughout so the pin math stays correct on
 * mobile, where the address bar collapsing mid-scroll shifts the actual
 * visible viewport height.
 */
export default function BreakoutPhoto({ photo, priority, onClick }: BreakoutPhotoProps) {
  const pinRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: pinRef,
    offset: ['start start', 'end end'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['25dvh', '-25dvh']);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.18]);

  return (
    <div ref={pinRef} className="relative mx-[-24px] h-[160dvh] md:mx-[-50px] md:h-[220dvh]">
      <div
        onClick={onClick}
        onContextMenu={(e) => e.preventDefault()}
        className="sticky top-0 h-[100dvh] w-full cursor-pointer overflow-hidden bg-[var(--bg)]"
      >
        <motion.div style={{ y, scale }} className="absolute inset-x-0 top-[-25dvh] h-[150dvh]">
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="100vw"
            className="photo-protected object-cover"
            draggable={false}
            priority={priority}
            loading={priority ? undefined : 'eager'}
            quality={90}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        </motion.div>
      </div>
    </div>
  );
}
