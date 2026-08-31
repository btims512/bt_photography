'use client';

import { useLayoutMode } from '@/lib/layout-mode';
import HeroSectionClassic from './HeroSectionClassic';  
import HeroSectionModern from './HeroSectionModern';

export default function HeroSection() {
  const { mode } = useLayoutMode();
  return mode === 'modern' ? <HeroSectionModern /> : <HeroSectionClassic />;
}
