import PortfolioSection from '@/components/PortfolioSection';
import { interleaveByCategory } from '@/lib/masonry';
import { featuredPhotos } from '@/lib/photos';

// TEMP: repeats the real photos so the breakout/parallax layout can be
// previewed at gallery density. Kept modest (rather than a much larger
// count) so eager-loading actually finishes before you scroll to most
// photos, giving an accurate preview of real-world load behavior. Remove
// once there are enough real photos to fill it out naturally.
const previewPhotos = Array.from(
  { length: 24 },
  (_, i) => ({ ...featuredPhotos[i % featuredPhotos.length] })
);

export default function Home() {
  const photos = interleaveByCategory(previewPhotos);

  return (
    <div className="w-full">
      <PortfolioSection id="featured" photos={photos} breakoutEvery={12} />
    </div>
  );
}
