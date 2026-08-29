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
 * A photo that pins itself to the viewport while the user scrolls, panning
 * slowly down through an oversized version of the image (a fixed window
 * pushing into a bigger canvas) while zooming in through the first half of
 * the scroll and back out through the second, instead of flashing past
 * like a regular grid photo, then releases back into the grid once the
 * extra scroll distance below is used up. Sits within the page's normal
 * side padding, same as the grid photos, rather than stretching full-bleed.
 *
 * The sticky frame is shorter on mobile (60dvh vs 100dvh on desktop) - at
 * full viewport height, the frame's now-narrower (padded, not full-bleed)
 * width made for a very tall/narrow crop window on phones, so object-cover
 * had to zoom in hard and cut off far more of the photo than intended. The
 * pan layer sizes itself as a percentage of the frame's own height (not a
 * fixed dvh value) so the sweep scales correctly at either height with no
 * JS media-query needed. `dvh` rather than `vh` is still used for the pin
 * distances themselves, so the math stays correct as the address bar
 * collapses/expands mid-scroll on mobile.
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

  // Expressed as a percentage of the pan layer's own height (not dvh)
  // so the sweep scales correctly whatever the sticky frame's actual
  // height is at the current breakpoint, with no JS media-query needed.
  // The pan still runs one-way top-to-bottom across the full scroll, but
  // the zoom is a pulse — in through the first half, back out through the
  // second — rather than continuing to zoom in the whole way through.
  const y = useTransform(smoothProgress, [0, 1], ['25%', '-25%']);
  const scale = useTransform(smoothProgress, [0, 0.5, 1], [1, 1.18, 1]);

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
    <div ref={pinRef} className="relative h-[100dvh] md:h-[220dvh]">
      <motion.div
        onClick={onClick}
        onContextMenu={(e) => e.preventDefault()}
        className="sticky top-0 h-[60dvh] w-full cursor-pointer overflow-hidden bg-[var(--bg)] md:h-[100dvh]"
        initial={{ y: '100%' }}
        animate={{ y: revealed ? '0%' : '100%' }}
        transition={{ duration: 0.85, ease: 'easeOut' }}
      >
        <motion.div
          style={{ y, scale, willChange: 'transform' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: revealed ? 1 : 0 }}
          transition={{ opacity: { duration: 0.75, ease: 'easeOut' } }}
          className="absolute inset-x-0 top-[-50%] h-[200%]"
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
            quality={82}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
