import { carouselAfterPhotos, carouselPhotos, featuredPhotos, himPhotos, type Photo } from '@/lib/photos';

/*
 * Everything that defines a scroll rail (components/MobileRail.tsx) as a
 * piece of the page, in one place. The component itself takes whatever it
 * is given; this is where the page decides what that is.
 *
 * Adding a rail of photos from the home page's own list:
 *   1. Tag the photos in lib/photos.ts with the same `project`, and a
 *      `projectOrder` for the order they slide in.
 *   2. Add that project to RAIL_STYLES below.
 * The page gathers a project's photos into a rail on its own (see
 * chunkWithRails in lib/masonry.ts); nothing else needs touching.
 *
 * Adding a rail that isn't part of that list - one whose photos shouldn't
 * appear anywhere else, like the seamless carousel - is a list of photos
 * and an entry in STANDALONE_RAILS instead.
 */

export interface RailStyle {
  /** Heading revealed above the photo as the rail opens. Omit for none. */
  title?: string;
  /** Photos sit flush with no gap, Instagram-carousel style - see MobileRail's `seamless`. */
  seamless?: boolean;
  /** Photos snap a whole photo at a time as you scroll, instead of sliding with it, one photo per gesture - see MobileRail's `snap`. */
  snap?: boolean;
  /** With `snap`: Instagram-style position dots under the photo - see MobileRail's `dots`. */
  dots?: boolean;
  /**
   * The shape the rail shows its photos at (width / height), trimmed evenly to
   * fit - see MobileRail's `frameRatio`. Omit to show them at their own shape.
   */
  ratio?: number;
}

/** Keyed by the `project` a rail's photos share. */
// The 2:3 rails open at the seamless carousel's 3:4, so every rail on the page
// but K|T (its own 4:5 frames) opens to the same size. 3:4 rather than K|T's
// 4:5 because it's the smaller trim: 5.6% off the top and bottom of a 2:3
// photo, against 8.3%.
const THREE_BY_FOUR = 3 / 4;

export const RAIL_STYLES: Record<string, RailStyle> = {
  framed: { title: 'K|T Series' },
  tx: { title: 'TX', ratio: THREE_BY_FOUR },
  'series-two': { title: 'HER', ratio: THREE_BY_FOUR },
  him: { title: 'HIM', ratio: THREE_BY_FOUR },
  // Placeholder title until the carousel has a name of its own.
  seamless: { title: 'Seamless Carousel', seamless: true, snap: true, dots: true },
};

/**
 * The style for a rail, or none at all for a rail built from a shape group,
 * which is just whatever photos happened to share an aspect ratio and has
 * nothing to be called. Keyed off the project every photo in the rail
 * shares - checked rather than read off the first photo, so a shape rail
 * that happens to open with a tagged photo can't inherit that project's
 * title.
 */
export function railStyle(photos: Photo[]): RailStyle {
  const project = photos[0]?.project;
  if (!project || !photos.every((photo) => photo.project === project)) return {};
  return RAIL_STYLES[project] ?? {};
}

/**
 * A rail placed as it is rather than gathered from the home page's photos,
 * with the grid photos that follow it. A rail parts the grid rows either
 * side of it as it opens, so each of these wants at least one photo in
 * `after` to push down - and something below it to hand the page back to
 * once it unpins.
 *
 * A photo from featuredPhotos can be used in either list: the mobile page
 * takes it out of its usual place, so it shows here and nowhere else there.
 */
export interface StandaloneRail {
  photos: Photo[];
  after: Photo[];
}

/**
 * Standalone rails for the end of the mobile home page, in order, after
 * everything else - including MOBILE_CODA, so the last rail of the
 * ordinary list and the first of these are always separated by photos.
 * Mobile only, like every rail.
 */
export const STANDALONE_RAILS: StandaloneRail[] = [
  // comedy-02 keeps HIM and the seamless carousel from sitting flush.
  { photos: himPhotos, after: featuredPhotos.filter((photo) => photo.src === '/photos/comedy-02.jpg') },
  { photos: carouselPhotos, after: carouselAfterPhotos },
];
