import PortfolioSection from '@/components/PortfolioSection';
import { portraitPhotos } from '@/lib/photos';
import { orderLikeHome } from '@/lib/mobile-order';

export default function PortraitsPage() {
  // In the order the home page meets these photos, so opening a section
  // after seeing it there picks up where it left off - see orderLikeHome.
  // Photos that appear only here follow, in their catalogue order.
  return (
    <div className="w-full">
      <PortfolioSection id="portraits" photos={orderLikeHome(portraitPhotos)} />
    </div>
  );
}
