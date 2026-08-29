'use client';

import { useLayoutMode } from '@/lib/layout-mode';
import PortfolioSectionClassic from './PortfolioSectionClassic';
import PortfolioSectionModern from './PortfolioSectionModern';
import type { Photo } from '@/lib/photos';

interface PortfolioSectionProps {
  id: string;
  photos: Photo[];
}

export default function PortfolioSection({ id, photos }: PortfolioSectionProps) {
  const { mode } = useLayoutMode();
  return mode === 'modern' ? (
    <PortfolioSectionModern id={id} photos={photos} />
  ) : (
    <PortfolioSectionClassic id={id} photos={photos} />
  );
}
