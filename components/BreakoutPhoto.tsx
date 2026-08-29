'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useInView, useScroll, useSpring, useTransform } from 'framer-motion';
import { BLUR_DATA_URL } from '@/lib/blur';
import { useLayoutMode } from '@/lib/layout-mode';
import type { Photo } from '@/lib/photos';

interface BreakoutPhotoProps {
  photo: Photo;
  priority?: boolean;
  onClick: () => void;
}

/**
 * A photo that pins itself to the viewport while the user scrolls, zooming
 * in while panning slowly down through an oversized version of the image
 * (a fixed window pushing into a bigger canvas) instead of flashing past
 * like a regular grid photo, then releases back into the grid once the
 * extra scroll distance below is used up. Sits within the page's normal
 * side padding, same as the grid photos, rather than stretching full-bleed.
 * Uses `dvh` rather than `vh` throughout so the pin math stays correct on
 * mobile, where the address bar collapsing mid-scroll shifts the actual
 * visible viewport height.
 *
 * On first appearance (once the grid above it has revealed, see
 * `headerReady`/`isInView` below) the whole panel slides up from below
 * into place — a separate `y` transform on the outer sticky frame, kept
 * apart from the inner layer's scroll-linked `y` so the two don't fight
 * over the same property.
 */
export default function BreakoutPhoto({ photo, priority, onClick }: BreakoutPhotoProps) {
  const pinRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: pinRef,
    offset: ['start start', 'end end'],
  });
  // Raw scroll progress updates in whatever-sized jumps the browser's
  // scroll events happen to fire in, which reads as jittery on a large,
  // full-bleed element. Springing it smooths that out into a fluid motion
  // rather than a series of little jumps.
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 200, damping: 30, mass: 0.5 });

  const y = useTransform(smoothProgress, [0, 1], ['25dvh', '-25dvh']);
  const scale = useTransform(smoothProgress, [0, 1], [1, 1.18]);

  // Waits for the header's entrance sequence to finish (the same rule grid
  // photos follow) so this doesn't appear ready before the grid above it
  // has, even though its image bytes may load quickly on their own.
  const isInView = useInView(pinRef, { margin: '200px' });
  const { headerReady } = useLayoutMode();
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (isInView && headerReady) setRevealed(true);
  }, [isInView, headerReady]);

  return (
    <div ref={pinRef} className="relative h-[160dvh] md:h-[220dvh]">
      <motion.div
        onClick={onClick}
        onContextMenu={(e) => e.preventDefault()}
        className="sticky top-0 h-[100dvh] w-full cursor-pointer overflow-hidden bg-[var(--bg)]"
        initial={{ y: '100%' }}
        animate={{ y: revealed ? '0%' : '100%' }}
        transition={{ duration: 0.85, ease: 'easeOut' }}
      >
        <motion.div
          style={{ y, scale, willChange: 'transform' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: revealed ? 1 : 0 }}
          transition={{ opacity: { duration: 0.75, ease: 'easeOut' } }}
          className="absolute inset-x-0 top-[-25dvh] h-[150dvh]"
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(max-width: 767px) calc(100vw - 48px), calc(100vw - 100px)"
            className="photo-protected object-cover"
            draggable={false}
            priority={priority}
            loading={priority ? undefined : 'eager'}
            quality={90}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
