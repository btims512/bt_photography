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
