import PortfolioSection from '@/components/PortfolioSection';
import { interleaveByCategory } from '@/lib/masonry';
import { featuredPhotos } from '@/lib/photos';

const BREAKOUT_EVERY = 12;

// Every real photo appears at least once. chunkWithBreakouts (lib/masonry.ts)
// needs at least BREAKOUT_EVERY landscape-oriented photos for the breakout
// to ever trigger; if the real set doesn't have that many yet, only the
// minimum number of landscape photos are repeated to close that gap,
// instead of repeating the whole set and diluting variety unnecessarily.
const landscapePhotos = featuredPhotos.filter((p) => p.width >= p.height);
const landscapeShortfall = Math.max(0, BREAKOUT_EVERY - landscapePhotos.length);
const padding =
  landscapePhotos.length > 0
    ? Array.from({ length: landscapeShortfall }, (_, i) => ({ ...landscapePhotos[i % landscapePhotos.length] }))
    : [];
const previewPhotos = [...featuredPhotos, ...padding];

export default function Home() {
  const photos = interleaveByCategory(previewPhotos);

  return (
    <div className="w-full">
      <PortfolioSection id="featured" photos={photos} breakoutEvery={BREAKOUT_EVERY} />
    </div>
  );
}
