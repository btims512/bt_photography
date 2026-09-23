import { chunkWithRails, type GallerySegment, type Photo } from '@/lib/masonry';
import { MOBILE_CODA, MOBILE_LEAD, MOBILE_TAIL, homePhotos } from '@/lib/photos';
import { RAIL_STYLES, STANDALONE_RAILS, type StandaloneRail } from '@/lib/rails';

/*
 * The order the mobile page meets its photos in - built once here, so the
 * page that renders it and the pages that follow it can't disagree.
 *
 * Two callers:
 *   - PortfolioSectionClassic, for the layout itself (mobileSegments).
 *   - The section pages, for their running order (orderLikeHome): a visitor
 *     who meets a photo on the home page and then opens that section finds
 *     the section starting where the home page started, in the same
 *     sequence. That is a consequence of the home page's own composition
 *     rather than a second list to keep in step with it - move a photo on
 *     the home page and its section follows.
 */

// Mobile-only cadence for the horizontal photo rail (see MobileRail.tsx):
// every MOBILE_LANDSCAPE_EVERY landscape photos, insert a rail of
// MOBILE_RAIL_SIZE portrait photos, then resume the grid. Desktop is
// unaffected - it keeps the existing single-photo BreakoutPhoto interrupt.
//
// This also sets how much is left over to cushion the next rail: the walk
// spends this many landscape photos before each rail, and whatever remains
// when the supply runs out is what separates the rails that follow. Against
// the five landscape photos the pinned lists leave behind, four consumed all
// but one and left a single photo between two rails; three left two, but
// both were comedy, which reads as more of the K|T rail rather than a break
// from it. Two leaves portrait-09 at the head of that gap. Raising it back
// costs the gap a photo for every one it gains the opening grid.
export const MOBILE_LANDSCAPE_EVERY = 2;
export const MOBILE_RAIL_SIZE = 5;

/**
 * The named photos, in the order named rather than the list's - and only
 * those actually present, so a name missing from `photos` (a section page
 * that doesn't hold it) is simply skipped.
 */
const named = (photos: Photo[], srcs: string[]): Photo[] =>
  srcs.map((src) => photos.find((photo) => photo.src === src)).filter((photo): photo is Photo => photo !== undefined);

/**
 * How the mobile page lays `photos` out: pinned lead, grid rows interrupted
 * by gathered rails, tail, coda, and then any standalone rails placed after
 * everything else - each followed by the grid photos it pushes down.
 */
export function mobileSegments(photos: Photo[], standaloneRails?: StandaloneRail[]): GallerySegment[] {
  // A photo a standalone rail places for itself (see STANDALONE_RAILS) is
  // taken out of the ordinary flow, so it shows there and nowhere else.
  const placedByRails = new Set(
    (standaloneRails ?? []).flatMap((rail) => [...rail.photos, ...rail.after].map((photo) => photo.src))
  );
  return [
    ...chunkWithRails(
      photos.filter((photo) => !placedByRails.has(photo.src)),
      MOBILE_LANDSCAPE_EVERY,
      MOBILE_RAIL_SIZE,
      named(photos, MOBILE_LEAD),
      named(photos, MOBILE_TAIL),
      named(photos, MOBILE_CODA)
    ),
    // Placed as given, after the catalogue's own segments. Each is an
    // ordinary rail segment followed by an ordinary grid segment, so the rail
    // picks up its neighbouring rows for the peek stand-ins exactly as a
    // gathered rail does - it can't tell the difference.
    ...(standaloneRails ?? []).flatMap((rail): GallerySegment[] => [
      { type: 'rail', photos: rail.photos },
      ...(rail.after.length > 0 ? [{ type: 'grid' as const, photos: rail.after }] : []),
    ]),
  ];
}

/** Every photo in a set of segments, in the order they are met. */
export function flattenSegments(segments: GallerySegment[]): Photo[] {
  return segments.flatMap((segment) => (segment.type === 'breakout' ? [segment.photo] : segment.photos));
}

/**
 * What counts as the same photograph for ordering. A rail that needs a
 * different crop carries its own file, named for the rail it was cut for
 * (portrait-11-him.jpg is the 2:3 crop of portrait-11.jpg - see himPhotos),
 * and the two should sort to the same place: the Portraits page shows the
 * uncropped one where the home page shows the crop.
 */
const RAIL_CROP = new RegExp(`-(${Object.keys(RAIL_STYLES).join('|')})(\\.[a-z]+)$`);
const sameAs = (src: string) => src.replace(RAIL_CROP, '$2');

/**
 * `photos` rearranged to follow `reference`. Anything absent from the
 * reference keeps its own relative order, after everything the reference
 * accounts for - so a section page opens with the photos the home page
 * showed, in that sequence, and then the ones it keeps to itself.
 */
export function orderLike(photos: Photo[], reference: Photo[]): Photo[] {
  const rank = new Map<string, number>();
  reference.forEach((photo, index) => {
    const key = sameAs(photo.src);
    if (!rank.has(key)) rank.set(key, index);
  });
  return photos
    .map((photo, index) => ({ photo, index, rank: rank.get(sameAs(photo.src)) ?? Number.POSITIVE_INFINITY }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((entry) => entry.photo);
}

let homeOrder: Photo[] | null = null;

/** The mobile home page's running order, rails and all. */
export function homeMobileOrder(): Photo[] {
  homeOrder ??= flattenSegments(mobileSegments(homePhotos, STANDALONE_RAILS));
  return homeOrder;
}

/** A section's photos, in the order the home page meets them. */
export function orderLikeHome(photos: Photo[]): Photo[] {
  return orderLike(photos, homeMobileOrder());
}
