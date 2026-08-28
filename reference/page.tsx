import HeroSection from "@/components/HeroSection";
import PortfolioSection from "@/components/PortfolioSection";
import Footer from "@/components/Footer";
import type { Photo } from "@/lib/masonry";

/**
 * The reference page is literally these three blocks and nothing else.
 *
 * The mix of aspect ratios is what creates the rhythm: roughly half portrait
 * (2:3) and half landscape (3:2), alternating. Feed real intrinsic dimensions
 * here — the masonry packer uses the ratio to decide placement.
 */

const PHOTOS: Photo[] = [
  { src: "/photos/01.jpg", alt: "", width: 1000, height: 1500 },
  { src: "/photos/02.jpg", alt: "", width: 1000, height: 1500 },
  { src: "/photos/03.jpg", alt: "", width: 1000, height: 1000 },
  { src: "/photos/04.jpg", alt: "", width: 1500, height: 1000 },
  { src: "/photos/05.jpg", alt: "", width: 1500, height: 1000 },
  { src: "/photos/06.jpg", alt: "", width: 1500, height: 1000 },
  { src: "/photos/07.jpg", alt: "", width: 1000, height: 1500 },
  { src: "/photos/08.jpg", alt: "", width: 1500, height: 1000 },
];

export default function Home() {
  return (
    <>
      <HeroSection pathname="/" />
      <PortfolioSection photos={PHOTOS} />
      <Footer />
    </>
  );
}
