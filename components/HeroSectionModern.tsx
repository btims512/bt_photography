'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useState } from 'react';
import MobileMenu from './MobileMenu';

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

export default function HeroSectionModern() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.header
      className="relative px-6 py-[14px] md:px-[50px] md:py-[16px] flex items-center justify-between"
      style={{ zIndex: 10 }}
    >
      {/* Logo - Left */}
      <Link href="/" className="inline-block flex-shrink-0">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
        >
          <div
            className="text-[6px] font-400 md:text-[8px]"
            style={{ color: 'var(--ink)', letterSpacing: '0.28em' }}
          >
            THE
          </div>
          <Image
            src="/bt-mark.svg"
            alt="BT Photography"
            width={527}
            height={257}
            priority
            className="h-[36px] w-auto md:h-[48px]"
          />
          <div
            className="mt-1 text-[9px] font-400 md:text-[13px]"
            style={{ color: 'var(--ink)', letterSpacing: '0.42em' }}
          >
            PHOTOGRAPHY
          </div>
          <div
            className="mx-auto mt-1 w-[70px] md:w-[95px]"
            style={{ borderTop: '1px solid var(--ink)' }}
          />
        </motion.div>
      </Link>

      {/* Mobile hamburger toggle */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-expanded={mobileOpen}
        aria-label="Open menu"
        className="md:hidden"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={{ color: 'var(--ink)' }}>
          <line x1="3" y1="7" x2="21" y2="7" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="17" x2="21" y2="17" />
        </svg>
      </button>

      {/* Desktop Navigation & Icons */}
      <div className="hidden md:flex items-center gap-10">
        <motion.nav
          className="flex items-center"
          aria-label="Primary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
        >
          <ul className="flex flex-row gap-8">
            {NAV.map((item, idx) => {
              const isActive = pathname === item.href;
              return (
                <motion.li
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.75, delay: idx * 0.08, ease: 'easeOut' }}
                >
                  <Link
                    href={item.href}
                    className={`text-[12px] font-500 uppercase transition-colors`}
                    style={{
                      color: isActive ? 'var(--accent)' : 'var(--ink)',
                      borderBottom: isActive ? '1px solid var(--accent)' : 'none',
                      paddingBottom: isActive ? '2px' : '0px',
                      letterSpacing: '0.04em'
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

        {/* Icons */}
        <div className="flex items-center gap-5">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            style={{ color: 'var(--ink)', transition: 'color 0.3s ease' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--ink)'}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>
          <a
            href="mailto:info@bentims.com"
            aria-label="Email"
            style={{ color: 'var(--ink)', transition: 'color 0.3s ease' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--ink)'}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
          </a>
        </div>
      </div>

      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} nav={NAV} pathname={pathname} />
    </motion.header>
  );
}
