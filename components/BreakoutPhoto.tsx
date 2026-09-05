'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useInView, useScroll, useSpring, useTransform } from 'framer-motion';
import { BLUR_DATA_URL } from '@/lib/blur';
import { useLayoutMode } from '@/lib/layout-mode';
import { useCssScrollTimelineSupport } from '@/lib/use-css-scroll-support';
import type { Photo } from '@/lib/photos';

interface BreakoutPhotoProps {
  photo: Photo;
  priority?: boolean;
  onClick: () => void;
  /**
   * Passed in (from the parent's useMediaQuery) rather than derived here on
   * purpose, and the parent keys this component on it so a change remounts
   * rather than re-renders. An internal media query would start at its
   * mobile default on every mount and flip to desktop a render later - and
   * framer's useInView/useScroll only capture ref.current when their effects
   * first run, so that flip left them bound to the unmounted mobile branch's
   * node forever: the desktop frame sat permanently in its hidden
   * pre-entrance state (a blank 100svh gap where the photo belonged). With
   * the prop + keyed remount, the first render is already the right branch
   * and every hook binds to the node that actually stays mounted.
   */
  isDesktop: boolean;
}

/**
 * A photo that breaks up the grid with a scroll-linked effect instead of
 * flashing past like a regular grid photo. Sits within the page's normal
 * side padding, same as the grid photos, rather than stretching full-bleed.
 *
 * Desktop and mobile deliberately differ, not just in sizing:
 *
 * Desktop starts the photo at a normal, modest size (45cqw wide, a fixed
 * 3:2 landscape box - not the source photo's own portrait shape, see
 * .breakout-fullscreen-zoom in globals.css - so it reads as "one more
 * photo" among the grid's landscape ones at rest, not a visually
 * disconnected portrait cutout), then scales it up via transform: scale()
 * while also panning slightly (translateY, -12% to 12%) to cover the
 * entire screen at the midpoint of the scroll-linked dwell, before
 * scaling/panning back to its starting state by the end. The frame itself
 * is statically black (bg-black, no animation) so it's already black as
 * it approaches from below rather than turning black once you scroll into
 * it - see the NOTE ON THE DARK BACKDROP in globals.css for why this
 * deliberately isn't scroll-driven. Pinning to the viewport (sticky) the whole
 * time is what makes "cover the entire screen, then shrink back down"
 * mean anything - without a pin, a fast scroll would just carry the frame
 * away mid-zoom instead of holding it through the full cycle. object-cover
 * on the image itself crops to fill the photo's own box at every size,
 * same as it always has.
 *
 * (Two earlier desktop versions: one filled the frame with object-cover
 * and panned across an oversized crop while zooming subtly - dropped for
 * this bigger, more theatrical full-screen zoom instead. Before that, an
 * object-contain version showed the complete uncropped photo - dropped
 * because a portrait photo, uncropped, inside a wide desktop frame renders
 * tiny with huge empty margins on both sides. The box was portrait-shaped,
 * matching the source photos, before the landscape 3:2 box above.)
 *
 * Mobile shows the complete photo instead (object-contain) with only a
 * gentle zoom pulse - no pan, no crop, no sticky pin, ever - inside a
 * fixed 3:4 box (.breakout-mobile-box in globals.css) centered in the
 * frame, rather than each photo independently filling as much of the
 * frame as its own aspect ratio allows. The catalog's portrait photos
 * range roughly 2:3 to 4:5; letting each fill independently meant a tall,
 * narrow photo rendered visibly smaller on screen than a squarer one - the
 * fixed box gives every photo the same footprint, at the cost of a little
 * extra letterboxing for whichever photos sit further from 3:4. Statically
 * black frame, same as desktop. No pin: iOS 26 Safari has
 * a confirmed, currently-unpatched WebKit bug where position: sticky/fixed
 * elements near full
 * viewport height render incorrectly against its new floating bottom
 * navigation controls (tracked in e.g. mastodon/mastodon#36144 and Apple
 * Developer Forums thread 800798 - no reliable CSS workaround exists as of
 * this writing). That bug, not a sizing issue, was the real cause of a
 * persistent gap after the breakout on mobile in earlier attempts - mobile
 * now uses a single normal-flow panel with no sticky/fixed positioning
 * anywhere, sidestepping it entirely. Desktop is unaffected by this bug.
 *
 * isDesktop (passed down from PortfolioSectionClassic's own useMediaQuery)
 * is a plain min-width: 768px check, same breakpoint Tailwind's own `md:`
 * uses - a phone in landscape is routinely wider than that (e.g. an iPhone
 * in landscape is ~930px), so it gets the desktop branch above, pinned dwell
 * and all, same as it would on an actual desktop browser window at that
 * width. That's intentional, not a gap to special-case around: both
 * branches size themselves in viewport-relative units (cqw, svh, vw) with
 * no assumption baked in that "desktop" means "not a phone", so the same
 * branch that works on a wide desktop window works equally well on a wide
 * (landscape) phone one.
 *
 * The zoom/pan itself runs as native CSS scroll-driven animation wherever
 * the browser supports it (see lib/use-css-scroll-support.ts and the
 * .breakout-* rules in globals.css) instead of a JS scroll listener, since
 * that runs entirely on the compositor thread - immune to both main-thread
 * jank and iOS Safari's separate documented bug where scrollY stops
 * updating consistently during fast/momentum scrolling. Browsers without
 * support (checked via CSS.supports, defaulting to the JS path on the
 * server/first render) fall back to the original Framer Motion
 * useScroll/useSpring implementation.
 *
 * Desktop's pin/frame heights use `svh` (small viewport height - fixed at
 * the browser chrome's fully-expanded size), not `dvh`: `dvh` recalculates
 * live as Safari's address bar collapses/expands mid-scroll, and sticky's
 * release point depends on a stable frame/container height relationship -
 * svh avoids that drift (a separate, real fix, unrelated to the mobile gap
 * above, which svh alone didn't resolve since the cause was the sticky bug
 * itself, not a height calculation). The 320svh outer height (up from an
 * original 220svh) gives the dwell more scroll distance so the effect
 * doesn't finish before you've really registered it.
 */
export default function BreakoutPhoto({ photo, priority, onClick, isDesktop }: BreakoutPhotoProps) {
  const pinRef = useRef<HTMLDivElement>(null);
  const cssSupported = useCssScrollTimelineSupport();

  // Desktop tracks progress across the whole pin container (the sticky
  // frame's sticky/dwell duration); mobile, with no pin, just tracks this
  // single panel's own passage through the viewport - a standard "start
  // entering from below" to "finish exiting above" range.
  const { scrollYProgress } = useScroll({
    target: pinRef,
    offset: isDesktop ? ['start start', 'end end'] : ['start end', 'end start'],
  });
  // Raw scroll progress updates in whatever-sized jumps the browser's
  // scroll events happen to fire in, which reads as jittery on a large,
  // full-bleed element. Springing it smooths that out into a fluid motion
  // rather than a series of little jumps. Only used on the JS fallback
  // path - the CSS path doesn't need it, since a compositor-driven
  // timeline doesn't have discrete "jumps" to smooth in the first place.
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 200, damping: 30, mass: 0.5 });
  // Matches the CSS keyframe's peak/pan - see the component doc comment
  // and .breakout-fullscreen-zoom in globals.css.
  const scale = useTransform(smoothProgress, [0, 0.44, 0.56, 1], [1, 2.8, 2.8, 1]);
  const pan = useTransform(smoothProgress, [0, 0.44, 0.56, 1], ['8%', '-1%', '-1%', '8%']);
  // Smaller peak than desktop's: this scales the whole contained image
  // (including its letterbox margins), not just a crop-filled frame.
  const mobileScale = useTransform(smoothProgress, [0, 0.5, 1], [1, 1.12, 1]);

  // Waits for the header's entrance sequence to finish (the same rule grid
  // photos follow) so this doesn't appear ready before the grid above it
  // has, even though its image bytes may load quickly on their own.
  const isInView = useInView(pinRef, { margin: '200px' });
  const { headerReady } = useLayoutMode();
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (isInView && headerReady) setRevealed(true);
  }, [isInView, headerReady]);

  if (!isDesktop) {
    const mobileImage = (
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes="calc(100vw - 48px)"
        className="photo-protected object-contain"
        draggable={false}
        priority={priority}
        quality={82}
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
      />
    );

    return (
      <motion.div
        ref={pinRef}
        onClick={onClick}
        onContextMenu={(e) => e.preventDefault()}
        className={`relative flex h-[100svh] w-full cursor-pointer items-center justify-center overflow-hidden bg-black ${cssSupported ? 'breakout-timeline-subject' : ''}`}
        initial={{ opacity: 0, y: 40 }}
        animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        {cssSupported ? (
          <div className="breakout-zoom-only-layer breakout-mobile-box relative">{mobileImage}</div>
        ) : (
          <motion.div
            style={{ scale: mobileScale, willChange: 'transform' }}
            className="breakout-mobile-box relative"
          >
            {mobileImage}
          </motion.div>
        )}
      </motion.div>
    );
  }

  const desktopImage = (
    <Image
      src={photo.src}
      alt={photo.alt}
      fill
      sizes="calc(100vw - 100px)"
      className="photo-protected object-cover"
      draggable={false}
      priority={priority}
      quality={82}
      placeholder="blur"
      blurDataURL={BLUR_DATA_URL}
    />
  );

  // Fixed landscape ratio, not the source photo's own (portrait, always -
  // the breakout queue is portrait-only) - matches the grid's own
  // landscape photos' general shape so the breakout reads as "one more
  // photo" at rest rather than a visually disconnected portrait cutout.
  // 45cqw is deliberately independent from the peak scale below (see the
  // .breakout-fullscreen-zoom comment in globals.css for why).
  const startWidthCqw = 45;

  return (
    <div
      ref={pinRef}
      className={`relative h-[320svh] ${cssSupported ? 'breakout-timeline-subject' : ''}`}
    >
      <motion.div
        onClick={onClick}
        onContextMenu={(e) => e.preventDefault()}
        // z-[35]: above the sticky header (z-30, HeroSectionClassic.tsx) -
        // both are position: sticky/top-0 at once during the dwell, and
        // without this the header would sit on top, permanently covering
        // the top of the frame and defeating "covers the full screen" at
        // the zoom's peak. Still well under the Lightbox's z-[100], so
        // opening a photo from elsewhere on the page still comes out on
        // top of everything.
        // items-start/justify-end parks the photo in the frame's top-right
        // corner at rest instead of the middle, with a small inset so it
        // doesn't sit flush against the edges. The zoom then grows it out
        // of that same corner (transform-origin: top right, see
        // .breakout-fullscreen-zoom in globals.css) so it spreads left and
        // down to fill the screen. Anchor and transform-origin have to name
        // the same corner: anchoring here without the matching origin would
        // grow the photo evenly in all directions and immediately push it
        // off the top and right edges.
        className="breakout-frame sticky top-0 z-[35] flex h-[100svh] w-full cursor-pointer items-start justify-end overflow-hidden bg-black"
        initial={{ y: '100%' }}
        animate={{ y: revealed ? '0%' : '100%' }}
        transition={{ duration: 0.85, ease: 'easeOut' }}
      >
        {cssSupported ? (
          <div
            className="breakout-fullscreen-zoom relative"
            style={{ width: `${startWidthCqw}cqw`, aspectRatio: '3 / 2' }}
          >
            {desktopImage}
          </div>
        ) : (
          <motion.div
            style={{
              width: `${startWidthCqw}cqw`,
              aspectRatio: '3 / 2',
              y: pan,
              scale,
              originX: 1,
              originY: 0,
              willChange: 'transform',
            }}
            className="relative"
          >
            {desktopImage}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
