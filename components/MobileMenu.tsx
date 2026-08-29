'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

type NavItem = { label: string; href: string };

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  nav: NavItem[];
  pathname: string;
}

export default function MobileMenu({ isOpen, onClose, nav, pathname }: MobileMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 md:hidden"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 40 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 right-0 bottom-0 md:hidden"
            style={{
              width: '78%',
              maxWidth: '340px',
              backgroundColor: 'var(--bg)',
              zIndex: 50,
              boxShadow: '-8px 0 30px rgba(0,0,0,0.15)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="absolute top-6 right-6"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ color: 'var(--ink)' }}>
                <line x1="5" y1="5" x2="19" y2="19" />
                <line x1="19" y1="5" x2="5" y2="19" />
              </svg>
            </button>
            <ul className="flex flex-col items-center gap-7 px-8 pt-28 text-center">
              {nav.map((item, idx) => {
                const isActive = pathname === item.href;
                return (
                  <motion.li
                    key={item.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 + idx * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={onClose}
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
      )}
    </AnimatePresence>
  );
}
