import PortfolioSection from '@/components/PortfolioSection';
import { musicPhotos } from '@/lib/photos';

export default function MusicPage() {
  return (
    <div className="w-full">
      <PortfolioSection id="music" photos={musicPhotos} />
    </div>
  );
}
