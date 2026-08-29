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
 * Splits a flat photo list into masonry-grid segments of `breakoutEvery`
 * *visible* photos apiece, interrupted by full-bleed "breakout" photos.
 * `breakoutEvery` counts grid-eligible (landscape) photos specifically, not
 * raw position in the array — every portrait photo is pulled out into a
 * queue for the breakout slot instead of the grid (a portrait squeezed into
 * a 1/3-width grid column runs much taller than its landscape neighbors,
 * leaving the other columns padded with wasted space, whereas breakout's
 * pinned pan crops to a fixed frame regardless of source orientation, so
 * it's a better home for any of them). Counting raw position instead of
 * visible count would make the breakout arrive early whenever a stretch
 * happened to be portrait-heavy, showing up after e.g. 6 grid photos
 * instead of the requested 12 just because the other 6 were portraits
 * routed elsewhere.
 *
 * Landscape photos are picked by round-robin across categories (not by
 * walking the input in its already-interleaved order) because categories
 * differ in how landscape-heavy they are — if e.g. one category happens to
 * be all-landscape while another is mostly portrait-oriented, walking the
 * interleaved sequence in order drains the all-landscape category's supply
 * far faster, so a single grid segment ends up dominated by it even though
 * the input alternated categories evenly. Round-robining specifically over
 * each category's *landscape* photos keeps the grid's visible mix even
 * regardless of that imbalance. Portrait-oriented photos still queue for
 * breakout in their original relative order, since that queue doesn't care
 * about category mixing.
 *
 * Grid segments are also trimmed to a multiple of `columnCount`: an uneven
 * count (e.g. 5 similar-height photos across 3 columns) leaves one column
 * shorter than the others, and since the row's height is set by the tallest
 * column, the short one just ends in visible empty space (this only matters
 * for desktop's packed-column layout; mobile renders every grid segment as
 * one continuous list regardless of segment boundaries). The remainder
 * carries over to accumulate with whatever comes next instead of being
 * flushed short. Anything still queued once photos run out (excess
 * portraits, a final uneven remainder) rides along in a trailing grid
 * segment rather than being dropped.
 */
export function chunkWithBreakouts(photos: Photo[], breakoutEvery: number, columnCount = 3): GallerySegment[] {
  const segments: GallerySegment[] = [];
  const breakoutQueue: Photo[] = [];

  const categoryOrder: Array<Photo['category']> = [];
  const landscapeByCategory = new Map<Photo['category'], Photo[]>();
  let landscapeRemaining = 0;

  for (const photo of photos) {
    if (photo.height > photo.width) {
      breakoutQueue.push(photo);
      continue;
    }
    const bucket = landscapeByCategory.get(photo.category);
    if (bucket) {
      bucket.push(photo);
    } else {
      landscapeByCategory.set(photo.category, [photo]);
      categoryOrder.push(photo.category);
    }
    landscapeRemaining++;
  }

  let gridBuffer: Photo[] = [];
  let categoryIdx = 0;

  while (landscapeRemaining > 0) {
    const category = categoryOrder[categoryIdx % categoryOrder.length];
    categoryIdx++;
    const bucket = landscapeByCategory.get(category);
    if (!bucket || bucket.length === 0) continue;

    gridBuffer.push(bucket.shift()!);
    landscapeRemaining--;

    if (gridBuffer.length >= breakoutEvery) {
      const evenCount = gridBuffer.length - (gridBuffer.length % columnCount);
      if (evenCount > 0) {
        segments.push({ type: 'grid', photos: gridBuffer.slice(0, evenCount) });
        gridBuffer = gridBuffer.slice(evenCount);
      }
      const breakoutPhoto = breakoutQueue.shift();
      if (breakoutPhoto) {
        segments.push({ type: 'breakout', photo: breakoutPhoto });
      }
    }
  }

  if (gridBuffer.length > 0) {
    segments.push({ type: 'grid', photos: gridBuffer });
  }
  if (breakoutQueue.length > 0) {
    segments.push({ type: 'grid', photos: breakoutQueue });
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
