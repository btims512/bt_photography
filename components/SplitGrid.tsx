'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

interface SplitGridProps {
  children: ReactNode;
  /**
   * Which rail(s) this segment has to draw away from. 'up' for a segment
   * with a rail only below it, 'down' for one with a rail only above, and
   * 'both' for a segment between two rails - which is most of them, since
   * the grid alternates grid/rail/grid/rail down the page. The rail's
   * black frame is what the widening gap reveals.
   */
  direction: 'up' | 'down' | 'both';
}

/** How far each half pulls away from the rail, in svh. The gap between the
 *  two halves opens to twice this, since both move. Kept modest: the point
 *  is that the grid visibly parts, not that it flies apart - and anything
 *  larger starts to tear a segment away from the grid above or below it
 *  that it is *not* separating from. */
const SPLIT_SVH = 14;

/**
 * Wraps the grid segment immediately before or after a rail and draws it
 * away from that rail as it is approached, so the grid appears to part and
 * the rail's black frame opens up in the widening gap between the two
 * halves rather than simply scrolling into view.
 *
 * Each half is driven by its *own* passage through the viewport rather
 * than by the rail's scroll position. Reading the rail's progress from
 * here would mean either a cross-element timeline (`timeline-scope`, whose
 * support is thinner than the rest of the scroll-driven features this app
 * relies on) or threading a ref between siblings; a segment's own
 * position tells us everything needed, since "this segment is leaving the
 * top of the screen" and "the rail below it is arriving" are the same
 * moment by construction.
 *
 * The two directions therefore watch different ends of their own travel:
 * the half above the rail is measured as its bottom edge leaves the
 * screen, the half below as its top edge arrives. Both peak at exactly the
 * point the rail takes over the viewport, which is what makes the parting
 * read as one movement rather than two.
 *
 * Transform only - the halves move without their layout boxes moving, so
 * nothing below them reflows and the page's scroll length is unchanged.
 * That is also why the effect reverses for free on the way back up.
 */
export default function SplitGrid({ children, direction }: SplitGridProps) {
  const ref = useRef<HTMLDivElement>(null);
  const up = direction === 'up';

  const both = direction === 'both';
  const { scrollYProgress } = useScroll({
    target: ref,
    // Each case watches the stretch over which this segment hands the
    // screen to - or takes it from - its rail. 'up': its bottom edge
    // travelling from the viewport's bottom to its top. 'down': the
    // mirror, its top edge arriving. 'both': its whole passage, so it
    // starts pushed down away from the rail it just left and ends pushed
    // up away from the one it is about to meet.
    offset: both
      ? ['start end', 'end start']
      : up
        ? ['end end', 'end start']
        : ['start end', 'start start'],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 200, damping: 30, mass: 0.5 });
  const y = useTransform(
    smooth,
    [0, 1],
    both
      ? [`${SPLIT_SVH}svh`, `-${SPLIT_SVH}svh`]
      : up
        ? ['0svh', `-${SPLIT_SVH}svh`]
        : [`${SPLIT_SVH}svh`, '0svh']
  );

  return (
    <motion.div ref={ref} style={{ y, willChange: 'transform' }}>
      {children}
    </motion.div>
  );
}
