import { carouselAfterPhotos, carouselPhotos, type Photo } from '@/lib/photos';

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
  /** Moves a whole photo at a time instead of sliding with the scroll - see MobileRail's `snap`. */
  snap?: boolean;
}

/** Keyed by the `project` a rail's photos share. */
export const RAIL_STYLES: Record<string, RailStyle> = {
  framed: { title: 'K|T Series' },
  tx: { title: 'TX' },
  'series-two': { title: 'HER' },
  // Placeholder title until the carousel has a name of its own.
  seamless: { title: 'Seamless Carousel', seamless: true, snap: true },
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
  { photos: carouselPhotos, after: carouselAfterPhotos },
];
