import PortfolioSection from '@/components/PortfolioSection';
import { interleaveByCategory } from '@/lib/masonry';
import { featuredPhotos } from '@/lib/photos';

const BREAKOUT_EVERY = 6;

// Straight through, no padding: every photo appears exactly once. This used
// to top the list up with repeats of its own landscape photos, because the
// segmentation needs BREAKOUT_EVERY of them before it will interrupt the
// grid and the catalog didn't have that many. It does now (well past it), so
// the top-up added nothing and has gone - along with the laps mobile used to
// repeat the whole list for (see PortfolioSectionClassic.tsx), which is what
// was actually putting the same photo on the page several times over.
export default function Home() {
  const photos = interleaveByCategory(featuredPhotos);

  return (
    <div className="w-full">
      <PortfolioSection id="featured" photos={photos} breakoutEvery={BREAKOUT_EVERY} />
    </div>
  );
}
