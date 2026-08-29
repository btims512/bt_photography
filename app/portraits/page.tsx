import PortfolioSection from '@/components/PortfolioSection';
import { portraitPhotos } from '@/lib/photos';

export default function PortraitsPage() {
  return (
    <div className="w-full">
      <PortfolioSection id="portraits" photos={portraitPhotos} />
    </div>
  );
}
