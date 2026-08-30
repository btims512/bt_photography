'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

type NavItem = { label: string; href: string };

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  nav: NavItem[];
  pathname: string;
}

/**
 * Always mounted (off-screen via x: '100%' when closed) rather than
 * AnimatePresence-mounted/unmounted on open - the header's hamburger/X
 * button (HeroSectionClassic.tsx) slides in sync with this drawer via its
 * own plain `animate` toggle on the same `isOpen`/`mobileOpen` boolean,
 * and AnimatePresence's exit animation runs through a different internal
 * scheduling path in Framer Motion than a plain `animate` prop update -
 * close them both with two different mechanisms and they can drift a
 * frame or two out of sync, closing rather than opening (React commits
 * the state change once; each animation system decides independently,
 * and only slightly differently, how soon after that commit to start).
 * Same mechanism on both = guaranteed to move together in both directions.
 * pointer-events toggles alongside opacity on the backdrop specifically
 * because a `fixed inset-0` div is still hit-testable at opacity: 0 -
 * unlike AnimatePresence, nothing removes it from the DOM to stop that.
 */
export default function MobileMenu({ isOpen, onClose, nav, pathname }: MobileMenuProps) {
  return (
    <>
      <motion.div
        animate={{ opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 md:hidden"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 40, pointerEvents: isOpen ? 'auto' : 'none' }}
        onClick={onClose}
        aria-hidden={!isOpen}
      />
      <motion.div
        animate={{ x: isOpen ? 0 : '100%' }}
        transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 right-0 bottom-0 md:hidden"
        style={{
          width: '78%',
          maxWidth: '340px',
          backgroundColor: 'var(--bg)',
          zIndex: 50,
          boxShadow: '-8px 0 30px rgba(0,0,0,0.15)',
        }}
        aria-hidden={!isOpen}
      >
        {/* No close button of its own - the header's hamburger/X toggle
            sits above this drawer (see HeroSectionClassic.tsx's z-index)
            and is the one control for both opening and closing, so
            there's a single animated icon rather than two overlapping
            close affordances in nearly the same corner. */}
        <ul className="flex flex-col items-center gap-7 px-8 pt-28 text-center">
          {nav.map((item, idx) => {
            const isActive = pathname === item.href;
            return (
              <motion.li
                key={item.label}
                animate={
                  isOpen
                    ? { opacity: 1, x: 0, transition: { duration: 0.3, delay: 0.1 + idx * 0.05 } }
                    : { opacity: 0, x: 20, transition: { duration: 0.15 } }
                }
              >
                <Link
                  href={item.href}
                  onClick={onClose}
                  tabIndex={isOpen ? undefined : -1}
                  className="text-[20px] font-700 uppercase"
                  style={{
                    color: isActive ? 'var(--accent)' : 'var(--ink)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {item.label}
                </Link>
              </motion.li>
            );
          })}
        </ul>
      </motion.div>
    </>
  );
}
