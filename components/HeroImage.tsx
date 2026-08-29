'use client';

import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

interface HeroImageProps {
  src?: string;
}

export default function HeroImage({ src = 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=1600&q=80' }: HeroImageProps) {
  const ref = useRef(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, 100]);

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="relative w-full overflow-hidden"
      style={{
        height: '65vh',
        backgroundColor: 'var(--img-bed)',
        marginTop: '-200px',
        paddingTop: '200px'
      }}
    >
      <motion.div style={{ y }} className="relative w-full h-full">
        <Image
          src={src}
          alt="Hero concert photo"
          fill
          sizes="100vw"
          priority
          quality={90}
          className="object-cover w-full h-full"
          onContextMenu={(e) => e.preventDefault()}
        />
      </motion.div>
      {/* Dark overlay for text visibility */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 100%)',
          pointerEvents: 'none'
        }}
      />
    </motion.section>
  );
}
