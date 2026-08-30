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
 *
 * The close X is a *child of the drawer panel* rather than the header's
 * own hamburger button sliding left to follow the drawer (what this used
 * to do). That approach could never actually stay pinned to the drawer's
 * corner: the button starts at the header's right edge and has to end up
 * inside the drawer, so it travels a different distance than the drawer
 * itself does over the same duration - the gap between the two therefore
 * changes continuously throughout the animation instead of holding at a
 * constant offset, which is what read as "not synchronized" no matter how
 * the durations/easings were matched (and, if the travel distance is
 * tuned slightly too far, ends with the button sitting outside the drawer
 * entirely). As a child, the X inherits the drawer's own transform, so
 * it's stuck to that corner at every frame by construction, with no
 * distance/easing matching involved at all - the standard way drawers do
 * this. The header keeps a separate hamburger that simply cross-fades out
 * as this one fades in (see HeroSectionClassic.tsx).
 *
 * The X's `top` tracks --header-shrink so it sits at exactly the same
 * height as the header hamburger it replaces, at any scroll position:
 * the header's mobile height is paddingTop + logo frame + paddingBottom =
 * (18 + 156 + 20) - shrink * (4 + 112 + 6) = 194 - shrink * 122 (nav is
 * desktop-only), and the hamburger is centered in that, so half of it is
 * 97 - shrink * 61. This works despite the drawer being position: fixed
 * because custom properties inherit down the DOM tree (MobileMenu renders
 * inside the header element), independently of the containing block.
 *
 * initial={false} on both elements below: without it, a plain `animate`
 * prop with no `initial` still plays an enter animation on first mount,
 * running FROM each element's untransformed CSS default (opacity: 1, x: 0
 * - i.e. fully visible, on-screen) TO whatever `animate` resolves to on
 * that first render. Since `isOpen` starts false, that first render's
 * `animate` target is already the closed state - but the mount animation
 * still played the visible-to-closed transition once, which is exactly
 * the "loads with the drawer open, then closes itself" bug. initial={false}
 * skips that: the element just renders directly at the closed state with
 * no transition on mount, and all later opens/closes still animate
 * normally since only the very first render is affected.
 */
export default function MobileMenu({ isOpen, onClose, nav, pathname }: MobileMenuProps) {
  return (
    <>
      <motion.div
        initial={false}
        animate={{ opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.45 }}
        className="fixed inset-0 md:hidden"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 40, pointerEvents: isOpen ? 'auto' : 'none' }}
        onClick={onClose}
        aria-hidden={!isOpen}
      />
      <motion.div
        initial={false}
        animate={{ x: isOpen ? 0 : '100%' }}
        transition={{ duration: 0.56, ease: [0.16, 1, 0.3, 1] }}
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
        {/* Close X, pinned to this panel's own top-left corner - see the
            component doc comment for why it lives here rather than being
            the header's hamburger sliding across.

            Deliberately has no opacity animation of its own, in either
            direction. When the panel is closed it sits 24px past the
            viewport's right edge (the panel is translated fully off-screen,
            and this rides along inside it), so it's already invisible
            without needing to be faded - and fading it was actively wrong
            on close: a 0.3s fade against the panel's 0.56s slide meant the
            X evaporated off the panel's corner while the panel still had
            260ms of travel left, which is precisely the "off when closing"
            asymmetry (opening hid it, since there the fade finished early
            against a panel still arriving). With no fade at all, the X is
            simply part of the panel at every frame in both directions. */}
        <motion.button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          tabIndex={isOpen ? undefined : -1}
          className="absolute left-6"
          style={{
            top: 'calc(97px - var(--header-shrink, 0) * 61px)',
            y: '-50%',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            pointerEvents: isOpen ? 'auto' : 'none',
          }}
        >
          <span className="relative flex h-6 w-6 items-center justify-center">
            <span
              className="absolute h-[2.2px] w-6 rounded-full"
              style={{ backgroundColor: 'var(--ink)', transform: 'rotate(45deg)' }}
            />
            <span
              className="absolute h-[2.2px] w-6 rounded-full"
              style={{ backgroundColor: 'var(--ink)', transform: 'rotate(-45deg)' }}
            />
          </span>
        </motion.button>

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
