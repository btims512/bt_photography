'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { BLUR_DATA_URL } from '@/lib/blur';
import type { Photo } from '@/lib/photos';

interface LightboxProps {
  photos: Photo[];
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

// How far off to the side the incoming/outgoing photo starts/ends up
// before sliding into/out of the centered position - large enough that
// the slide itself is clearly visible (a small offset paired with a
// quick spring settled almost before you could see it move, reading as
// a near-instant swap rather than one photo sliding out as the next
// slides in).
const SLIDE_DISTANCE = 420;

const slideVariants = {
  enter: (direction: 1 | -1) => ({
    x: direction > 0 ? SLIDE_DISTANCE : -SLIDE_DISTANCE,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: 1 | -1) => ({
    x: direction > 0 ? -SLIDE_DISTANCE : SLIDE_DISTANCE,
    opacity: 0,
  }),
};

export default function Lightbox({ photos, index, onClose, onNavigate }: LightboxProps) {
  const isOpen = index !== null;
  const photo = index !== null ? photos[index] : null;
  // Which way the *next* photo should slide in from - 1 means "next" was
  // triggered (new photo enters from the right, matching a left swipe /
  // right-arrow tap), -1 means "prev" (enters from the left). Read by
  // slideVariants above via AnimatePresence's `custom` prop so the outgoing
  // photo exits toward the opposite side it's replaced from, rather than
  // both photos just cross-fading in place - the swipe (or arrow tap)
  // continues in the same direction instead of visually reversing itself.
  const [direction, setDirection] = useState<1 | -1>(1);

  const goPrev = useCallback(() => {
    if (index === null) return;
    setDirection(-1);
    onNavigate((index - 1 + photos.length) % photos.length);
  }, [index, photos.length, onNavigate]);

  const goNext = useCallback(() => {
    if (index === null) return;
    setDirection(1);
    onNavigate((index + 1) % photos.length);
  }, [index, photos.length, onNavigate]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handleKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose, goPrev, goNext]);

  return (
    <AnimatePresence>
      {isOpen && photo && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/95" />

          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close"
            className="absolute left-4 top-4 z-10 flex h-11 w-11 items-center justify-center text-white/80 outline-none transition-colors hover:text-white md:left-6 md:top-6"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>

          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                aria-label="Previous photo"
                className="absolute left-2 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center text-white/80 outline-none transition-colors hover:text-white md:left-6"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                aria-label="Next photo"
                className="absolute right-2 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center text-white/80 outline-none transition-colors hover:text-white md:right-6"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </>
          )}

          {/* Its own AnimatePresence, nested inside the outer one that
              handles the whole overlay mounting/unmounting - a plain key
              change on an element doesn't get an exit animation unless an
              AnimatePresence is actually watching that specific spot in the
              tree for children being swapped out. mode="popLayout" takes
              the exiting photo out of layout immediately (position:
              absolute) so it can slide out while the incoming one slides
              into the same centered flex position, instead of the two
              briefly fighting over space and jumping the container size
              around mid-transition. initial={false} skips this playing an
              enter animation on the very first photo when the lightbox
              opens - that's already handled by the outer AnimatePresence. */}
          <AnimatePresence mode="popLayout" custom={direction} initial={false}>
            <motion.div
              key={photo.src}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: 'spring', stiffness: 260, damping: 30 }, opacity: { duration: 0.25 } }}
              className="relative z-[5] flex max-h-[98vh] max-w-[98vw] items-center justify-center touch-pan-y"
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => e.preventDefault()}
              drag={photos.length > 1 ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={(_e, info) => {
                const swiped = info.offset.x < -60 || info.velocity.x < -500;
                const swipedBack = info.offset.x > 60 || info.velocity.x > 500;
                if (swiped) goNext();
                else if (swipedBack) goPrev();
              }}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                sizes="98vw"
                className="photo-protected h-auto max-h-[98vh] w-auto max-w-[98vw] object-contain"
                draggable={false}
                priority
                quality={90}
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
