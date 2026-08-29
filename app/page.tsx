import PortfolioSection from '@/components/PortfolioSection';
import { featuredPhotos } from '@/lib/photos';

export default function Home() {
  return (
    <div className="w-full">
      <PortfolioSection id="featured" photos={featuredPhotos} />
    </div>
  );
}
