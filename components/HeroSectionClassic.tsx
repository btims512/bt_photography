'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, useScroll } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import MobileMenu from './MobileMenu';
import { useLayoutMode } from '@/lib/layout-mode';
import { useCssScrollTimelineSupport } from '@/lib/use-css-scroll-support';

type NavItem = {
  label: string;
  href: string;
};

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
 * That number is the scroll position, 1:1, at every screen size: the
 * browser's own scroll timeline drives it where it can (header-shrink-kf in
 * globals.css), and this component writes the raw scroll value where it
 * can't. No spring, anywhere.
 *
 * Desktop used to feed it through a damped spring (stiffness 400, damping
 * 40), on the theory that wheel input is indirect and a smoothed catch-up
 * would read better than a 1:1 mapping. Measured, it read as exactly the
 * lag it is: at an ordinary scroll speed the header trailed the page by 62%
 * of its whole collapse, 97% on a fast one, and then went on shrinking for
 * a further 26-38 frames (about half a second) after the scroll had
 * stopped. The header is in normal flow, so that run-on was not confined to
 * the header either - the height it was still giving up pulled the content
 * below it along, with nothing being scrolled. Mobile had already been moved
 * off the spring for the same reason, and measured zero lag and zero
 * run-on; desktop now matches it.
 *
 * The case for damping did not survive contact with real input, either.
 * Every current browser smooth-scrolls a mouse wheel by itself, animating
 * each notch over a hundred-odd milliseconds, so a 1:1 header follows that
 * curve rather than jumping; a trackpad is continuous to begin with. And the
 * desktop logo/nav merge (see .header-shrink-frame and .header-nav-slot) is
 * sequenced in --header-shrink units, so it plays out in the same order on
 * a linear mapping as on a sprung one - it just happens where the scroll
 * is, instead of half a second behind it.
 */
export default function HeroSectionClassic() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { markHeaderReady } = useLayoutMode();

  // Whether globals.css is driving --header-shrink itself rather than this
  // component feeding it - which it does wherever the browser supports
  // scroll-driven animations, at every breakpoint. Defaults to false so the
  // first render (which has to match the server, and where scroll-timeline
  // support is still unknown) takes the JS value, the same one an
  // unsupporting browser stays on.
  const cssScroll = useCssScrollTimelineSupport();

  // The raw scroll position, for browsers without scroll-driven animations:
  // written to the header as a bare number (--header-scroll-y), from which
  // .header-shrink-frame derives --header-shrink over the range defined in
  // globals.css. No range, breakpoint or easing lives here - only the one
  // number the browser can't give the CSS itself - so the two paths cannot
  // disagree about where the collapse starts or ends.
  //
  // A frame behind the paint, as anything read from a scroll event is, and
  // that is all: no spring (see the component doc comment), and nothing
  // below the header depends on it, since the header keeps its footprint in
  // the page constant however far it has shrunk.
  const { scrollY } = useScroll();

  // Framer writes --header-scroll-y inline until cssScroll turns on, then
  // stops - leaving its last value sitting on the element. The timeline
  // outranks the declaration that reads it, so the leftover changes nothing,
  // but it reads as a live number in devtools while the header is visibly
  // somewhere else. Clear it rather than leave a misleading one behind.
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (cssScroll) headerRef.current?.style.removeProperty('--header-scroll-y');
  }, [cssScroll]);

  const headerStyle: CSSProperties = {
    zIndex: 30,
    backgroundColor: 'var(--bg)',
    ...(cssScroll ? null : ({ '--header-scroll-y': scrollY } as CSSProperties)),
  };

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
