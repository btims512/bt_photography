import PortfolioSection from '@/components/PortfolioSection';
import { interleaveByCategory } from '@/lib/masonry';
import { featuredPhotos } from '@/lib/photos';

export default function Home() {
  const photos = interleaveByCategory(featuredPhotos);

  return (
    <div className="w-full">
      <PortfolioSection id="featured" photos={photos} />
    </div>
  );
}
