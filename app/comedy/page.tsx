import PortfolioSection from '@/components/PortfolioSection';
import { comedyPhotos } from '@/lib/photos';

export default function ComedyPage() {
  return (
    <div className="w-full">
      <PortfolioSection id="comedy" photos={comedyPhotos} />
    </div>
  );
}
