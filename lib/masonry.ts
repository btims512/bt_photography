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
};

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
