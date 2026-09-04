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
  /**
   * Free-form name marking photos that belong to one body of work, so they
   * are shown as a set: interleaveByCategory keeps them consecutive rather
   * than dealing them out across genres, and chunkWithRails builds their
   * rail before any other, which is what puts them in the first one.
   *
   * It does not override the rule that a rail holds a single shape - see
   * projectGroups. A project spanning several shapes rails only its largest
   * matching subset, and the rest stay in the grid alongside it.
   */
  project?: string;
  /**
   * Position within `project`, and the order the rail slides through them.
   * Needed as its own field because nothing else survives the trip: the
   * photo list is interleaved by genre before it reaches the rail, which
   * deals a project's members out across three buckets, and the shape
   * grouping then sorts what is left by aspect ratio - i.e. by rounding
   * error, for a set that is all one shape.
   */
  projectOrder?: number;
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
  | { type: 'breakout'; photo: Photo }
  | { type: 'rail'; photos: Photo[] };

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
export function chunkWithBreakouts(
  photos: Photo[],
  breakoutEvery: number,
  columnCount = 3,
  /**
   * When above 1, each interrupt is a `rail` of this many same-shaped
   * photos (see takeUniformRail) instead of a single `breakout` photo -
   * what the Classic desktop layout uses for its vertical carousel. Left
   * at 1, the interrupt stays a single photo, which is what
   * PortfolioSectionModern still renders; opt-in rather than a change of
   * behaviour for both callers.
   */
  railSize = 1
): GallerySegment[] {
  const segments: GallerySegment[] = [];
  const breakoutQueue: Photo[] = [];
  const railedProjects = new Set<string>();

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
      if (railSize > 1) {
        const rail = takeUniformRail(breakoutQueue, railSize, railedProjects);
        if (rail) {
          segments.push({ type: 'rail', photos: rail });
        }
      } else {
        const breakoutPhoto = breakoutQueue.shift();
        if (breakoutPhoto) {
          segments.push({ type: 'breakout', photo: breakoutPhoto });
        }
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

/** How close two photos' aspect ratios must be, proportionally, to count as
 *  "the same shape" for rail grouping. 2.5% clusters photos that are
 *  nominally the same ratio but differ by some cropping (2666x4000 =
 *  0.6665 through 5444x8000 = 0.6805) while still separating genuinely
 *  different shapes (2:3 = 0.667 vs 4:5 = 0.800, 20% apart).
 *
 *  Raised from 2% when the photo now named portrait-04.jpg landed at
 *  0.6805 - 2.1% off the other 2:3 photos, so it fell just outside and
 *  became a group of one, which can never form a rail since a shape needs
 *  two distinct photos. Raised again from 2.5% when the photo now named
 *  portrait-02.jpg (0.6501) sat 2.55% off that same cluster and was the
 *  fifth photo the second rail needed: the widest pair the 2:3 group now
 *  spans is 2.71%, so 2.8% takes all of them. (Both photos have since been
 *  renumbered as the catalogue grew - the ratios and the reasoning are
 *  what's load-bearing here, not whichever filename happened to trigger
 *  them at the time.)
 *
 *  At rail size a 2.1% ratio difference is about 10px of height, so this
 *  spans roughly 13px - still well below noticing. Widen further only with
 *  the same care: the gap from the 2:3 cluster to the next real shape is
 *  12.9%, so there is room, but grouping visibly different shapes is
 *  exactly what the uniform-size work was undoing. */
const RAIL_RATIO_TOLERANCE = 0.028;

/** A rail shorter than this isn't worth pinning the viewport for - the
 *  photos fall through to a normal grid segment instead. */
const MIN_RAIL_PHOTOS = 3;

/**
 * Clusters photos into groups of near-identical aspect ratio. Sorts by ratio
 * and starts a new group whenever the next photo drifts more than
 * RAIL_RATIO_TOLERANCE from the current group's anchor, so every group is
 * guaranteed internally uniform (rather than rounding to fixed buckets,
 * where two nearly-identical ratios can land either side of a boundary).
 */
function groupByAspectRatio(photos: Photo[]): Photo[][] {
  const sorted = [...photos].sort((a, b) => a.width / a.height - b.width / b.height);
  const groups: Photo[][] = [];
  let current: Photo[] = [];
  let anchor = 0;

  for (const photo of sorted) {
    const ratio = photo.width / photo.height;
    if (current.length === 0) {
      anchor = ratio;
      current.push(photo);
    } else if (Math.abs(ratio - anchor) / anchor <= RAIL_RATIO_TOLERANCE) {
      current.push(photo);
    } else {
      groups.push(current);
      current = [photo];
      anchor = ratio;
    }
  }
  if (current.length > 0) groups.push(current);

  return groups;
}

/**
 * Rail candidates drawn from Photo.project rather than from shape alone, so
 * a body of work can be shown as one rail instead of being split across
 * whichever shape groups its photos happen to fall into.
 *
 * Each project still yields a single-shape group, because the rail sizes
 * every panel from one aspect ratio and fits the photo inside with
 * object-contain: a panel whose photo is a different shape doesn't crop, it
 * shrinks and floats in a box that isn't its own, and at rest it no longer
 * lines up with the grid photo the swell animates out of. So a project that
 * mixes shapes contributes only its largest matching subset here, and its
 * odd sizes fall through to the grid - where they keep their own proportions
 * and, since interleaveByCategory holds a project together, still sit
 * alongside the rail rather than somewhere else entirely.
 */
/** A group of photos a rail could be built from, and the project it came
 *  from if it was chosen for being one rather than for its shape. */
type RailCandidate = { photos: Photo[]; project?: string };

function projectGroups(queue: Photo[], alreadyRailed: Set<string>): RailCandidate[] {
  const byProject = new Map<string, Photo[]>();
  for (const photo of queue) {
    if (!photo.project || alreadyRailed.has(photo.project)) continue;
    const list = byProject.get(photo.project);
    if (list) list.push(photo);
    else byProject.set(photo.project, [photo]);
  }

  const groups: RailCandidate[] = [];
  for (const [project, members] of byProject) {
    const [largest] = groupByAspectRatio(members).sort((a, b) => b.length - a.length);
    if (!largest || largest.length < MIN_RAIL_PHOTOS) continue;
    // Ordered by projectOrder, not by anything the grouping produced.
    // groupByAspectRatio sorts by ratio to find its clusters, which for a
    // project whose photos are all nominally one shape means sorting them by
    // rounding error - 2160x2700 lands a thousandth ahead of 1122x1402 and
    // would lead the rail. The queue order is no better: it comes from
    // interleaveByCategory, which deals these out across three genres.
    groups.push({
      photos: members
        .filter((photo) => largest.includes(photo))
        .sort((a, b) => (a.projectOrder ?? 0) - (b.projectOrder ?? 0)),
      project,
    });
  }
  return groups.sort((a, b) => b.photos.length - a.photos.length);
}

/**
 * Pulls one rail's worth of same-shaped photos out of `queue`, mutating it to
 * remove what it takes. Returns null when no group can fill a worthwhile
 * rail, in which case the caller leaves everything queued for a later cycle.
 *
 * Tries aspect-ratio groups largest-first, so the shape with the most supply
 * gets used before a thinner one, and takes each group in queue order. It
 * used to round-robin across distinct photos and pad a short rail back up by
 * repeating its own members, both of which existed only because callers fed
 * it several laps of the same photo list; with every photo appearing once
 * there is nothing to deduplicate and nothing to pad with, and padding was
 * what put one photo at both ends of a three-photo rail.
 */
function pickRail(
  candidates: RailCandidate[],
  queue: Photo[],
  railSize: number,
  railedProjects: Set<string>
): Photo[] | null {
  for (const candidate of candidates) {
    if (candidate.photos.length < MIN_RAIL_PHOTOS) continue;
    // A project candidate is already a curated, bounded set - its size was
    // a deliberate choice made when its photos were tagged, unlike a
    // same-shape group, which could be as large as the whole catalogue
    // happens to share a ratio. Capping it at railSize the same way would
    // silently drop whichever members sorted past the cutoff, which is
    // exactly what tagging a project exists to avoid (see the doc comment
    // on projectGroups above) - so only a shape-based candidate is
    // truncated; a project rail always shows the whole project.
    const chosen = candidate.project ? candidate.photos : candidate.photos.slice(0, railSize);
    for (const photo of chosen) {
      const idx = queue.indexOf(photo);
      if (idx !== -1) queue.splice(idx, 1);
    }
    if (candidate.project) railedProjects.add(candidate.project);
    return chosen;
  }
  return null;
}

/**
 * A project's rail, built from the whole photo list rather than from the
 * rail queue. The queue only holds what has been walked past so far, and a
 * project's photos are spread through the list by interleaveByCategory - so
 * waiting for them to queue would land the project in some later rail, or
 * split it, or miss it. Taken up front and spent on the first rail instead.
 */
function takeProjectRail(pool: Photo[], railSize: number, railedProjects: Set<string>): Photo[] | null {
  return pickRail(projectGroups(pool, railedProjects), pool, railSize, railedProjects);
}

function takeUniformRail(queue: Photo[], railSize: number, railedProjects: Set<string>): Photo[] | null {
  // Projects first - that ordering is the whole mechanism by which a tagged
  // set lands in the first rail rather than wherever its shape came up, and
  // once per project so a second rail can't be built from the same set.
  return pickRail(
    [
      ...projectGroups(queue, railedProjects),
      ...groupByAspectRatio(queue)
        .sort((a, b) => b.length - a.length)
        .map((photos) => ({ photos })),
    ],
    queue,
    railSize,
    railedProjects
  );
}

/**
 * Mobile-only counterpart to chunkWithBreakouts: instead of interrupting the
 * grid with a single full-bleed photo, groups portrait photos into a
 * horizontal-scroll "rail" segment (see components/MobileRail.tsx) after
 * every `landscapeEvery` landscape photos.
 *
 * Every rail holds photos of a single aspect ratio (see takeUniformRail).
 * MobileRail sizes its photos to fill the frame's width with their natural
 * height, so a rail mixing a 2:3 photo with a 4:5 one renders them at
 * visibly different heights as they slide past; grouping by shape means the
 * photos within any one rail always match each other exactly. The tradeoff
 * is that a shape without enough supply never forms a rail at all - those
 * photos fall through to the trailing grid segment instead - so rails can be
 * fewer, and shorter than `railSize`, than a naive split would produce.
 *
 * No column-count trimming here, unlike chunkWithBreakouts - mobile always
 * renders grid segments as one flat list regardless of segment boundaries,
 * so there's no packed-column layout to keep even. No category round-robin
 * either: it just walks `photos` in the order given, so callers should pass
 * an already-interleaved list (e.g. interleaveByCategory's output) - the
 * landscape/portrait alternation that produces is also what keeps enough
 * portraits queued by the time each landscapeEvery threshold hits, rather
 * than all landscape draining first and dumping every portrait into one
 * trailing rail-less segment at the end.
 */
export function chunkWithRails(
  photos: Photo[],
  landscapeEvery: number,
  railSize: number,
  lead: Photo[] = []
): GallerySegment[] {
  const segments: GallerySegment[] = [];
  const railedProjects = new Set<string>();

  // Every rail is chosen here, before the walk below places any of them,
  // and each one is chosen from the whole catalogue of portraits rather
  // than from whatever had queued by the time its slot came round. Choosing
  // as it went was what left later rails short: the first slot arrives only
  // a few photos in, so a rail could only ever be built from the handful of
  // portraits walked past so far - three, where its shape had six to give.
  // It also could not have put a project first, since a project's photos
  // are dealt across genres by interleaveByCategory and rarely all present
  // that early.
  // `lead` opens the page in the order given and is spent doing so - held
  // out of the rail supply here, since a photo shows in one place only.
  // Pinning portraits therefore costs rails their photos, which is why the
  // caller has to decide what it is willing to give up.
  const pinned = new Set(lead);
  const unrailed = photos.filter((photo) => photo.height > photo.width && !pinned.has(photo));
  const railsAhead: Photo[][] = [];
  for (;;) {
    const rail =
      takeProjectRail(unrailed, railSize, railedProjects) ??
      takeUniformRail(unrailed, railSize, railedProjects);
    if (!rail) break;
    railsAhead.push(rail);
  }
  const railed = new Set(railsAhead.flat());

  // Its own segment rather than the head of the first one, so a rail slot
  // can't fall in the middle of it and split the run.
  if (lead.length > 0) {
    segments.push({ type: 'grid', photos: lead });
  }

  let gridBuffer: Photo[] = [];
  const leftoverPortraits: Photo[] = [];
  for (const photo of photos) {
    if (pinned.has(photo)) continue;
    // A railed photo is spent - it appears in its rail and nowhere else.
    if (railed.has(photo)) continue;
    if (photo.height > photo.width) {
      leftoverPortraits.push(photo);
      continue;
    }

    gridBuffer.push(photo);
    if (gridBuffer.length >= landscapeEvery) {
      segments.push({ type: 'grid', photos: gridBuffer });
      gridBuffer = [];
      const rail = railsAhead.shift();
      if (rail) segments.push({ type: 'rail', photos: rail });
    }
  }

  if (gridBuffer.length > 0) {
    segments.push({ type: 'grid', photos: gridBuffer });
  }
  // Portraits no rail could use - a shape with too few of its own to fill
  // one, or the remainder of a shape that filled one and had some over.
  if (leftoverPortraits.length > 0) {
    segments.push({ type: 'grid', photos: leftoverPortraits });
  }
  // Rails with no slot left to sit in, when the landscape supply ran out
  // before the rails did.
  for (const rail of railsAhead) {
    segments.push({ type: 'rail', photos: rail });
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
