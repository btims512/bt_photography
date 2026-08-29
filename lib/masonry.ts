/**
 * Shortest-column masonry packing.
 *
 * The Format theme places each image into whichever column is currently
 * shortest, which is why its two columns end at different heights and why the
 * reading order flows left/right rather than straight down one column.
 *
 * CSS `columns-2` does NOT do this — it fills column one top-to-bottom first.
 * So we pack here, deterministically, from the intrinsic dimensions. It runs
 * identically on the server and the client, so there is no hydration flash and
 * no layout shift.
 */

export type Photo = {
  src: string;
  alt: string;
  /** intrinsic pixel width — only the ratio matters */
  width: number;
  /** intrinsic pixel height */
  height: number;
  /** genre tag, used to interleave the featured/home grid */
  category?: 'comedy' | 'portraits' | 'music';
};

/**
 * Cycles through categories in a fixed order (comedy, portraits, music),
 * pulling the next unused photo from each in turn so genres spread out
 * instead of clumping together. Within whichever category's turn it is,
 * it also prefers a photo whose orientation (landscape/portrait) differs
 * from the last one placed, so the reading order alternates orientation
 * too where the available photos allow it. Categories that run out are
 * skipped; leftovers keep cycling among what's left.
 */
export function interleaveByCategory(photos: Photo[]): Photo[] {
  const order: Array<Photo['category']> = ['comedy', 'portraits', 'music'];
  const buckets = new Map<string, Photo[]>();
  const untagged: Photo[] = [];

  for (const photo of photos) {
    if (photo.category) {
      const bucket = buckets.get(photo.category) ?? [];
      bucket.push(photo);
      buckets.set(photo.category, bucket);
    } else {
      untagged.push(photo);
    }
  }

  const isPortraitOrientation = (p: Photo) => p.height > p.width;

  const result: Photo[] = [];
  let remaining = photos.length - untagged.length;
  let categoryIdx = 0;
  let lastWasPortrait: boolean | null = null;

  while (remaining > 0) {
    const category = order[categoryIdx % order.length];
    categoryIdx++;
    const bucket = buckets.get(category as string);
    if (!bucket || bucket.length === 0) continue;

    let pickIdx = 0;
    if (lastWasPortrait !== null) {
      const wantPortrait = !lastWasPortrait;
      const found = bucket.findIndex((p) => isPortraitOrientation(p) === wantPortrait);
      if (found !== -1) pickIdx = found;
    }
    const [photo] = bucket.splice(pickIdx, 1);
    result.push(photo);
    lastWasPortrait = isPortraitOrientation(photo);
    remaining--;
  }

  return [...result, ...untagged];
}

/**
 * Round-robin distribution: photo i always goes to column i % columnCount.
 * Unlike distributeToColumns, this preserves the exact left-to-right reading
 * order of the source array (e.g. landscape/portrait/landscape per row),
 * at the cost of columns no longer self-balancing by height.
 */
export function distributeRoundRobin(photos: Photo[], columnCount = 3): Photo[][] {
  const columns: Photo[][] = Array.from({ length: columnCount }, () => []);
  photos.forEach((photo, i) => {
    columns[i % columnCount].push(photo);
  });
  return columns;
}

export type GallerySegment =
  | { type: 'grid'; photos: Photo[] }
  | { type: 'breakout'; photo: Photo };

/**
 * Splits a flat photo list into masonry-grid chunks (of up to `breakoutEvery`
 * photos, in original order) interrupted by full-bleed "breakout" photos.
 * Every portrait photo is pulled out of its chunk's grid contribution: a
 * portrait squeezed into a 1/3-width grid column runs much taller than its
 * landscape neighbors, leaving the other columns padded with wasted space,
 * whereas breakout's pinned pan crops to a fixed frame regardless of source
 * orientation, so it's a better home for any of them. A chunk only ever
 * spends one on its own breakout slot; extras queue up and get used by the
 * next chunk's slot instead of lingering in a grid, so no chunk is ever left
 * with a leftover portrait.
 *
 * Grid segments are also trimmed to a multiple of `columnCount`: an uneven
 * count (e.g. 5 similar-height photos across 3 columns) leaves one column
 * shorter than the others, and since the row's height is set by the tallest
 * column, the short one just ends in visible empty space. The remainder
 * carries over into the next chunk instead of being flushed short.
 *
 * Chunking (rather than filtering portraits out of the whole sequence up
 * front) keeps category interleaving upstream — e.g. comedy/portraits
 * alternation — intact within each grid segment. Anything still queued once
 * photos run out (excess portraits, an uneven carry-over remainder) rides
 * along in a trailing grid segment rather than being dropped.
 */
export function chunkWithBreakouts(photos: Photo[], breakoutEvery: number, columnCount = 3): GallerySegment[] {
  const segments: GallerySegment[] = [];
  const breakoutQueue: Photo[] = [];
  let carryOver: Photo[] = [];

  for (let i = 0; i < photos.length; i += breakoutEvery) {
    const chunk = photos.slice(i, i + breakoutEvery);
    const hasMore = i + breakoutEvery < photos.length;

    const landscapeThisChunk: Photo[] = [];
    for (const photo of chunk) {
      if (photo.height > photo.width) {
        breakoutQueue.push(photo);
      } else {
        landscapeThisChunk.push(photo);
      }
    }

    const available = [...carryOver, ...landscapeThisChunk];
    const evenCount = available.length - (available.length % columnCount);
    const gridPhotos = available.slice(0, evenCount);
    carryOver = available.slice(evenCount);

    if (gridPhotos.length > 0) {
      segments.push({ type: 'grid', photos: gridPhotos });
    }

    if (hasMore) {
      const breakoutPhoto = breakoutQueue.shift();
      if (breakoutPhoto) {
        segments.push({ type: 'breakout', photo: breakoutPhoto });
      }
    }
  }

  const leftovers = [...carryOver, ...breakoutQueue];
  if (leftovers.length > 0) {
    segments.push({ type: 'grid', photos: leftovers });
  }

  return segments;
}

export function distributeToColumns(photos: Photo[], columnCount = 2): Photo[][] {
  const columns: Photo[][] = Array.from({ length: columnCount }, () => []);
  // Tracked in "units of column width" so it is resolution independent.
  const heights = new Array<number>(columnCount).fill(0);

  for (const photo of photos) {
    let shortest = 0;
    for (let i = 1; i < columnCount; i++) {
      if (heights[i] < heights[shortest]) shortest = i;
    }
    columns[shortest].push(photo);
    heights[shortest] += photo.height / photo.width;
  }

  return columns;
}
