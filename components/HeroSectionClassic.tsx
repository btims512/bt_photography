'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, useMotionValue, useMotionValueEvent, useScroll, useSpring } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import MobileMenu from './MobileMenu';
import { useLayoutMode } from '@/lib/layout-mode';

type NavItem = {
  label: string;
  href: string;
};

/**
 * The bounce back: how the header eases back to full size as the page
 * scrolls up - a spring in scroll pixels, critically damped (damping =
 * 2 * sqrt(stiffness * mass)), so it closes the gap as fast as a spring can
 * without overshooting the header's resting size.
 *
 * Only ever seen on the way back up. On the way down the header follows the
 * scroll exactly, because a spring trailing there leaves the header too tall
 * and the content slides under it - globals.css takes the more collapsed of
 * the spring and the exact position, which is the exact one going down and
 * the spring going up (see the note above header-shrink-now-kf).
 *
 * Natural frequency 30/s (stiffness 900): the header settles about a
 * quarter of a second after the scroll stops - long enough to read as the
 * header easing itself back into place, short enough to be done before
 * you've looked for it. The desktop spring this descends from was 20/s and
 * took half a second, while also lagging on the way down, where it did harm.
 * Higher is snappier, lower is softer.
 */
const HEADER_SPRING = { stiffness: 900, damping: 60, mass: 1, restDelta: 0.5, restSpeed: 10 };

const NAV: NavItem[] = [
  { label: 'home', href: '/' },
  { label: 'comedy', href: '/comedy' },
  { label: 'portraits', href: '/portraits' },
  { label: 'music', href: '/music' },
  { label: 'about', href: '/about' },
  { label: 'book', href: '/book' },
];

/**
 * The header pins to the top of the page (position: sticky) and shrinks -
 * logo scaling down and sliding from centered to flush-left, padding and
 * nav spacing tightening - as you scroll through the first 220px of the
 * page, reversing the same way if you scroll back up to the top. Based on
 * https://scroll-driven-animations.style/demos/shrinking-header-shadow/css/,
 * targeting roughly the compact layout HeroSectionModern.tsx already uses
 * at rest (small logo on the left) as the shrunk end state.
 *
 * Every animated value reads one scroll-position-driven number,
 * --header-shrink (0 to 1) - see the .header-shrink-* rules in globals.css
 * for the full derivation of the logo's translateX/scale math and why the
 * property needs to be `inherits: true` unlike this file's other
 * scroll-driven custom properties (--breakout-zoom etc.), which only ever
 * need to be read by the same element they're declared on.
 *
 * That number follows the scroll position exactly on the way down and
 * eases back on the way up - the bounce back to full size when you return
 * to the top (HEADER_SPRING). This component supplies the scroll position
 * and the sprung one; globals.css takes the more collapsed of the two at
 * every frame (see the note above header-shrink-now-kf), using the
 * browser's own scroll timeline for the exact value wherever there is one.
 *
 * The header has had a spring before, on desktop, and it was taken out
 * because it measured badly: it trailed the page by up to 97% of the
 * collapse, carried on for half a second after the scroll stopped, and
 * dragged the content with it the whole time, because the header sat in the
 * page flow and the content moved whenever it changed height. The drag is
 * gone for good - the header now keeps a constant footprint in the flow
 * (see .header-shrink-frame's margin-bottom), so nothing it does can move
 * anything else. The trailing is confined to the one direction where it is
 * harmless: scrolling up, a lagging header is a smaller header, and the
 * worst that does is widen the gap below it for a moment.
 */
export default function HeroSectionClassic() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { markHeaderReady } = useLayoutMode();

  const { scrollY } = useScroll();

  // The scroll position the header should be showing, clamped to the
  // collapse's own range - read from globals.css, the only place it is
  // defined, and re-read when the breakpoint changes it. Clamped before the
  // spring rather than after, so a long jump (End, a link far down the page)
  // springs across the 122-241px the header actually spans, not across the
  // thousands of pixels the page did.
  const rangeRef = useRef(Infinity);
  const target = useMotionValue(0);
  const clampToRange = (y: number) => Math.min(Math.max(y, 0), rangeRef.current);
  useMotionValueEvent(scrollY, 'change', (y) => target.set(clampToRange(y)));
  useEffect(() => {
    const read = () => {
      const range = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-shrink-range'));
      if (range > 0) rangeRef.current = range;
      target.set(clampToRange(scrollY.get()));
    };
    read();
    const query = window.matchMedia('(min-width: 768px)');
    query.addEventListener('change', read);
    return () => query.removeEventListener('change', read);
  }, [scrollY, target]);
  const eased = useSpring(target, HEADER_SPRING);

  const headerRef = useRef<HTMLElement>(null);

  const headerStyle = {
    zIndex: 30,
    backgroundColor: 'var(--bg)',
    // The clamped scroll position itself, for the instant floor - which the
    // scroll timeline in globals.css replaces wherever it runs - and the
    // sprung one the header eases to. See .header-shrink-frame.
    '--header-scroll-y-now': target,
    '--header-scroll-y': eased,
  } as CSSProperties;

  return (
    <motion.header ref={headerRef} className="sticky top-0 header-shrink-frame text-center" style={headerStyle}>
      {/* Logo - two nested wrapper layers, not either combined with each
          other or applied directly to the elements below (see globals.css
          for why the two layers can't be merged into one). Framer sets
          `transform` via inline style on those elements already (each line
          arrives from its own direction on mount), which would silently
          win over a CSS class's `transform` and break the shrink effect
          entirely if the shrink/scale class were on the same elements -
          nesting instead lets both kinds of transform compose normally. */}
      <div className="header-logo-frame">
        <div className="header-logo-shrink">
          <Link href="/" className="inline-block">
            <div>
              <motion.div
                className="text-[13px] font-400 md:text-[16px]"
                style={{ color: 'var(--ink)', letterSpacing: '0.32em' }}
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                THE
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.12, ease: 'easeOut' }}
              >
                <Image
                  src="/bt-mark.svg"
                  alt="BT Photography"
                  width={527}
                  height={257}
                  priority
                  className="mx-auto h-[95px] w-auto md:h-[160px]"
                />
              </motion.div>
              <motion.div
                className="mt-1 text-[19px] font-400 md:mt-1 md:text-[34px]"
                style={{ color: 'var(--ink)', letterSpacing: '0.6em' }}
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.65, delay: 0.28, ease: 'easeOut' }}
              >
                PHOTOGRAPHY
              </motion.div>
              {/* Thickness lives in .header-logo-rule rather than a plain 1px
                  border, because this whole block gets scaled down as the
                  header shrinks and a scaled 1px border lands at a third of a
                  pixel - see globals.css for the counter-scale. */}
              <motion.div
                className="header-logo-rule mx-auto mt-2 w-[150px] md:mt-2 md:w-[280px]"
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.48, ease: 'easeOut' }}
              />
            </div>
          </Link>
        </div>
      </div>

      {/* Mobile hamburger - opens the drawer only. Closing is the X that
          lives inside the drawer panel itself (MobileMenu.tsx), which is
          why this one no longer slides across or morphs into an X: see
          that file's doc comment for why a single button couldn't stay
          pinned to the drawer's corner while also being visible at rest.
          The two cross-fade, so this needs to sit *below* the drawer
          (z-[45] vs the drawer's z-50, both within the header's own
          stacking context, which the header's z-30 + position: sticky
          establishes) rather than the z-[60] it needed back when it had
          to stay tappable through the open drawer. pointer-events goes
          with the fade, since an opacity-0 button is still hit-testable
          and this one sits above MobileMenu's z-40 backdrop.

          Each bar animates in from the right on load, staggered, so the
          icon joins the header's entrance sequence (logo lines, then nav)
          instead of being the one element already sitting there fully
          formed. y is part of each bar's animate rather than a separate
          class/style, since both bars' resting offsets and their entrance
          x are one shared transform - splitting them across two
          mechanisms would let Framer's inline transform silently drop the
          class-based one. Same reason the button's own -50% centering
          rides in its `style` as Framer's `y` rather than a
          -translate-y-1/2 utility. */}
      <motion.button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-expanded={mobileOpen}
        aria-label="Open menu"
        // p-3/-mr-3: a 48x48 target around a 24x24 icon. The padding grows the
        // box and the negative *right* margin pulls it back, so the bars stay
        // 24px in from the screen edge exactly as before. Horizontal only:
        // vertically the box is centred by top-1/2 against its own height (the
        // `y: '-50%'` below), which already keeps the icon's centre on the
        // header's, and a negative top margin would shift it up by half the
        // padding it just added.
        className="absolute right-6 top-1/2 z-[45] p-3 -mr-3 md:hidden"
        initial={false}
        animate={{ opacity: mobileOpen ? 0 : 1 }}
        // Asymmetric on purpose, against the drawer's 0.56s slide. Opening:
        // clear out fast, before the drawer's incoming X sweeps left past
        // this exact spot (the X travels from off-screen right to the
        // drawer's corner, crossing here on the way). Closing: hold off
        // until the drawer has nearly finished leaving, so this doesn't
        // reappear underneath a panel that's still on screen - the other
        // half of the close-side asymmetry described in MobileMenu.tsx.
        // Opening, this holds until the bars have finished becoming an X
        // (0.34s) and only then hands over to the drawer's own X, so the
        // icon change reads as its own beat before the menu moves.
        // Closing no longer morphs here at all: the panel's own X unfolds
        // into lines in plain sight before the panel leaves
        // (MobileMenu.tsx), so these bars just snap back to lines while
        // still transparent and fade in afterwards, already correct. An
        // earlier version played the unfold on these bars instead, which
        // meant it happened underneath the panel sliding over them.
        transition={{
          duration: mobileOpen ? 0.22 : 0.25,
          delay: mobileOpen ? 0.36 : 0.72,
          ease: 'easeOut',
        }}
        style={{
          y: '-50%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          pointerEvents: mobileOpen ? 'none' : 'auto',
        }}
      >
        {/* The bars carry two independent animations at once: their staggered
            entrance on page load (opacity and x), and the morph into an X
            on tap (y and rotate). Per-property transitions keep them
            apart - one shared transition would either delay the morph by
            the entrance's 0.42s or strip the entrance of its stagger. */}
        <span className="relative flex h-6 w-6 items-center justify-center">
          <motion.span
            className="absolute h-[2.2px] w-6 rounded-full"
            style={{ backgroundColor: 'var(--ink)' }}
            initial={{ opacity: 0, x: 40, y: -5, rotate: 0 }}
            animate={{ opacity: 1, x: 0, y: mobileOpen ? 0 : -5, rotate: mobileOpen ? 45 : 0 }}
            transition={{
              opacity: { duration: 0.55, delay: 0.42, ease: 'easeOut' },
              x: { duration: 0.55, delay: 0.42, ease: 'easeOut' },
              y: { duration: mobileOpen ? 0.34 : 0, ease: [0.22, 1, 0.36, 1] },
              rotate: { duration: mobileOpen ? 0.34 : 0, ease: [0.22, 1, 0.36, 1] },
            }}
          />
          <motion.span
            className="absolute h-[2.2px] w-6 rounded-full"
            style={{ backgroundColor: 'var(--ink)' }}
            initial={{ opacity: 0, x: 40, y: 5, rotate: 0 }}
            animate={{ opacity: 1, x: 0, y: mobileOpen ? 0 : 5, rotate: mobileOpen ? -45 : 0 }}
            transition={{
              opacity: { duration: 0.55, delay: 0.52, ease: 'easeOut' },
              x: { duration: 0.55, delay: 0.52, ease: 'easeOut' },
              y: { duration: mobileOpen ? 0.34 : 0, ease: [0.22, 1, 0.36, 1] },
              rotate: { duration: mobileOpen ? 0.34 : 0, ease: [0.22, 1, 0.36, 1] },
            }}
          />
        </span>
      </motion.button>

      {/* Desktop Navigation */}
      {/* The slot reserves the nav's height in flow; the nav inside moves by
          transform. Separating the two is what lets the header actually
          get shorter as it shrinks - see .header-nav-slot in globals.css. */}
      <div className="header-nav-slot hidden md:block">
      <motion.nav
        className="header-nav-shrink"
        aria-label="Primary"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.75, ease: 'easeOut' }}
      >
        {/* Gap by the room there is for it: the labels come to ~274px, so
            five 100px gaps need 774px of content box and a 768px tablet only
            has 668 - the items were being squeezed and the page scrolled 3px
            sideways. 72px fits that width with room to spare; 100px comes
            back as soon as there is space for it, and lg keeps its 130. */}
        <ul className="md:flex md:justify-center md:gap-x-[72px] min-[900px]:gap-x-[100px] lg:gap-x-[130px]">
          {NAV.map((item, idx) => {
            const isActive = pathname === item.href;
            return (
              <motion.li
                key={item.label}
                className="relative block py-2 md:inline-block md:pb-[10px] md:pt-0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.06, ease: 'easeOut' }}
                onAnimationComplete={idx === NAV.length - 1 ? markHeaderReady : undefined}
              >
                <Link
                  href={item.href}
                  // px-3/-mx-3 and pt-2 grow the target around the word - a
                  // 14px line is a thin thing to hit on a tablet, which gets
                  // this nav rather than the drawer. Horizontal padding is paid
                  // back by the margin so the spacing is untouched; vertical
                  // padding needs no repayment (an inline box's own vertical
                  // margins don't affect layout) and is kept above the text so
                  // the active underline below stays exactly where it sits.
                  className={`px-3 -mx-3 pt-3 text-[14px] font-800 uppercase transition-colors focus:outline-none pb-1 ${
                    isActive ? 'border-b-2' : ''
                  }`}
                  style={{
                    color: isActive ? 'var(--accent)' : 'var(--ink)',
                    borderBottomColor: isActive ? 'var(--accent)' : 'transparent',
                    cursor: 'pointer',
                    letterSpacing: '0.04em',
                    textTransform: 'lowercase'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = 'var(--accent)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = 'var(--ink)';
                    }
                  }}
                >
                  {item.label}
                </Link>
              </motion.li>
            );
          })}
        </ul>
      </motion.nav>
      </div>

      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} nav={NAV} pathname={pathname} />
    </motion.header>
  );
}
