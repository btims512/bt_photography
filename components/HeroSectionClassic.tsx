'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useState } from 'react';
import MobileMenu from './MobileMenu';
import { useLayoutMode } from '@/lib/layout-mode';
import { useCssScrollFunctionSupport } from '@/lib/use-css-scroll-support';

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
 * need to be read by the same element they're declared on. That property
 * is driven by native CSS scroll-timeline (scroll(), not view() - this is
 * about the page's own scroll position, not any one element's passage
 * through the viewport) wherever supported (compositor thread, same
 * reasoning as the breakout/rail elsewhere in this app), with a Framer
 * Motion equivalent (headerShrinkJS below) setting the same custom
 * property by hand where it isn't.
 *
 * cssScrollFnSupported checks `scroll()` specifically
 * (useCssScrollFunctionSupport), not the `view()` check the rest of the
 * app uses (useCssScrollTimelineSupport) - same overall spec, but a
 * different value, so this checks the one actually used here.
 */
export default function HeroSectionClassic() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { markHeaderReady } = useLayoutMode();
  const cssScrollFnSupported = useCssScrollFunctionSupport();

  // Whole-page scroll position, clamped to the same 0-220px range the CSS
  // side's animation-range covers, and remapped to a plain 0-1 number -
  // the exact same shape as --header-shrink, so every consuming CSS rule
  // (all in globals.css) works identically regardless of which path set it.
  const { scrollY } = useScroll();
  const headerShrinkJS = useTransform(scrollY, [0, 220], [0, 1], { clamp: true });

  const headerStyle: CSSProperties = {
    zIndex: 30,
    backgroundColor: 'var(--bg)',
    ...(cssScrollFnSupported ? {} : ({ '--header-shrink': headerShrinkJS } as CSSProperties)),
  };

  return (
    <motion.header
      className={`sticky top-0 header-shrink-frame text-center ${cssScrollFnSupported ? 'header-shrink-timeline' : ''}`}
      style={headerStyle}
    >
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

      {/* Mobile hamburger toggle - two bars that rotate into an X, rather
          than the usual three-bar icon with a fading middle bar. z-[60]
          (above MobileMenu's z-50 drawer panel) keeps this the one control
          for both opening and closing - without it, the drawer would cover
          this button once open, so tapping the same spot wouldn't do
          anything (the drawer used to carry its own separate close button
          for exactly that reason; removed now that this one reaches
          through and handles both directions). top-1/2 (vertical
          centering, as the header's own height shrinks) is handled via
          `animate`'s y rather than the usual -translate-y-1/2 utility,
          since that sets `transform` via a class - x below needs to set
          transform too, via Framer's inline style, which would silently
          win and drop the class-based y centering if they were on two
          different mechanisms. Combining both into the same animate call
          keeps them as one transform. The x slide (duration/ease matching
          MobileMenu's own drawer transition, so they move together)
          follows the drawer's leading edge open, landing just inside it,
          and returns to 0 shut - "slides out with the drawer" rather than
          staying pinned to the screen edge while everything else moves. */}
      <motion.button
        type="button"
        onClick={() => setMobileOpen((open) => !open)}
        aria-expanded={mobileOpen}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        className="absolute right-6 top-1/2 z-[60] md:hidden"
        animate={{ x: mobileOpen ? 'calc(-1 * min(78vw, 340px) + 68px)' : '0px', y: '-50%' }}
        transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <span className="relative flex h-6 w-6 items-center justify-center">
          <motion.span
            className="absolute h-[2.2px] w-6 rounded-full"
            style={{ backgroundColor: 'var(--ink)' }}
            animate={mobileOpen ? { rotate: 45, y: 0 } : { rotate: 0, y: -5 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.span
            className="absolute h-[2.2px] w-6 rounded-full"
            style={{ backgroundColor: 'var(--ink)' }}
            animate={mobileOpen ? { rotate: -45, y: 0 } : { rotate: 0, y: 5 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          />
        </span>
      </motion.button>

      {/* Desktop Navigation */}
      <motion.nav
        className="header-nav-shrink hidden md:block"
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

      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} nav={NAV} pathname={pathname} />
    </motion.header>
  );
}
