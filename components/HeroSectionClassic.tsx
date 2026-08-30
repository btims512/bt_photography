'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useState } from 'react';
import MobileMenu from './MobileMenu';
import { useLayoutMode } from '@/lib/layout-mode';

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
  { label: 'connect', href: '/connect' },
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
 * Deliberately always Framer Motion (headerShrinkSpring below), not native
 * CSS scroll-timeline the way the breakout/rail elsewhere in this app
 * prefer wherever supported - a raw scroll-timeline is an *undamped*,
 * 1:1 mapping from scroll position to progress by design (that's what
 * makes it compositor-only), so on a fast scroll or flick the header
 * shrinks/grows exactly as fast as the scroll itself, however abrupt that
 * is - no way to soften that in pure CSS, since a `transition` doesn't
 * apply to a value already being driven by an active `animation`. The
 * spring here is what makes a fast scroll feel like a smooth catch-up
 * instead of a snap, at the cost of the header no longer being
 * compositor-only - an acceptable trade since every property it drives is
 * transform-based already (see the .header-logo-shrink comment for why
 * that specifically matters), so the spring is the only added main-thread
 * cost, not a layout one. stiffness: 400 / damping: 40 (mass: 1) is a
 * critically damped spring (damping ratio exactly 1 at these values) - the
 * fastest a spring can settle without overshooting/oscillating. A softer
 * spring here (previously 100/22) reads as smooth on a slow scroll, but on
 * a quick flick - especially scrolling back up - it visibly lags behind
 * before catching up to the real scroll position, since it takes longer to
 * close the gap once one opens. Critically damped keeps the "doesn't jump
 * instantly" smoothing while closing that gap as fast as physically
 * possible without introducing a bounce of its own.
 */
export default function HeroSectionClassic() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { markHeaderReady } = useLayoutMode();

  // Whole-page scroll position, clamped to the same 0-220px range and
  // remapped to a plain 0-1 number, then damped through a spring - see the
  // component doc comment for why this needs to be a spring rather than
  // the raw scroll-linked value CSS scroll-timeline would give.
  const { scrollY } = useScroll();
  const headerShrinkRaw = useTransform(scrollY, [0, 220], [0, 1], { clamp: true });
  const headerShrinkSpring = useSpring(headerShrinkRaw, { stiffness: 400, damping: 40, mass: 1 });

  const headerStyle: CSSProperties = {
    zIndex: 30,
    backgroundColor: 'var(--bg)',
    ...({ '--header-shrink': headerShrinkSpring } as CSSProperties),
  };

  return (
    <motion.header className="sticky top-0 header-shrink-frame text-center" style={headerStyle}>
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
              <motion.div
                className="mx-auto mt-2 w-[150px] md:mt-2 md:w-[280px]"
                style={{ borderTop: '1px solid var(--ink)' }}
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
        className="absolute right-6 top-1/2 z-[45] md:hidden"
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
        // Closing is the same beat in reverse: the button fades back in
        // still showing an X while the panel is leaving, and only then do
        // the bars unfold - which is why their morph carries a delay on
        // the close side. Without it the bars reverted while the button
        // was still transparent, so the X never visibly became lines.
        transition={{
          duration: mobileOpen ? 0.22 : 0.2,
          delay: mobileOpen ? 0.36 : 0.32,
          ease: 'easeOut',
        }}
        style={{
          y: '-50%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
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
              y: { duration: 0.34, delay: mobileOpen ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] },
              rotate: { duration: 0.34, delay: mobileOpen ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] },
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
              y: { duration: 0.34, delay: mobileOpen ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] },
              rotate: { duration: 0.34, delay: mobileOpen ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] },
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
        <ul className="md:flex md:justify-center md:gap-x-[100px] lg:gap-x-[130px]">
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
                  className={`text-[14px] font-800 uppercase transition-colors focus:outline-none pb-1 ${
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
