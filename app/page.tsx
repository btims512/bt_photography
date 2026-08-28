import type { Photo } from '@/lib/masonry';
import HeroSection from '@/components/HeroSection';
import PortfolioSection from '@/components/PortfolioSection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';

export default function Home() {
  // Placeholder photos using picsum.photos (reliable placeholder service).
  // Mix of 3:2 landscape and 2:3 portrait for masonry rhythm.

  const comedyPhotos: Photo[] = Array.from({ length: 6 }, (_, i) => {
    const isPortrait = i % 2 === 1;
    const width = isPortrait ? 400 : 600;
    const height = isPortrait ? 600 : 400;
    return {
      src: `https://picsum.photos/${width}/${height}?random=${i + 1}`,
      alt: `Comedy performance ${i + 1}`,
      width: isPortrait ? 2 : 3,
      height: isPortrait ? 3 : 2,
    };
  });

  const portraitPhotos: Photo[] = Array.from({ length: 6 }, (_, i) => {
    const isPortrait = i % 2 === 1;
    const width = isPortrait ? 400 : 600;
    const height = isPortrait ? 600 : 400;
    return {
      src: `https://picsum.photos/${width}/${height}?random=${100 + i}`,
      alt: `Portrait ${i + 1}`,
      width: isPortrait ? 2 : 3,
      height: isPortrait ? 3 : 2,
    };
  });

  const musicPhotos: Photo[] = Array.from({ length: 6 }, (_, i) => {
    const isPortrait = i % 2 === 1;
    const width = isPortrait ? 400 : 600;
    const height = isPortrait ? 600 : 400;
    return {
      src: `https://picsum.photos/${width}/${height}?random=${200 + i}`,
      alt: `Music performance ${i + 1}`,
      width: isPortrait ? 2 : 3,
      height: isPortrait ? 3 : 2,
    };
  });

  return (
    <div className="w-full">
      <main>
        <HeroSection />
        <PortfolioSection id="comedy" photos={comedyPhotos} />
        <PortfolioSection id="portrait" photos={portraitPhotos} />
        <PortfolioSection id="music" photos={musicPhotos} />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
