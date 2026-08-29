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

export default function HeroSectionClassic() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.header
      className="relative px-6 pb-[20px] pt-[18px] text-center md:px-[50px] md:pb-[24px] md:pt-[22px]"
      style={{ zIndex: 10 }}
    >
      {/* Logo */}
      <Link href="/" className="inline-block">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
        >
          <div
            className="text-[13px] font-400 md:text-[16px]"
            style={{ color: 'var(--ink)', letterSpacing: '0.32em' }}
          >
            THE
          </div>
          <Image
            src="/bt-mark.svg"
            alt="BT Photography"
            width={545}
            height={273}
            priority
            className="mx-auto h-[95px] w-auto translate-x-[21px] md:h-[160px] md:translate-x-[36px]"
          />
          <div
            className="mt-1 text-[19px] font-400 md:mt-1 md:text-[34px]"
            style={{ color: 'var(--ink)', letterSpacing: '0.6em' }}
          >
            PHOTOGRAPHY
          </div>
          <div
            className="mx-auto mt-2 w-[150px] md:mt-2 md:w-[280px]"
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
        className="absolute right-6 top-[22px] md:hidden"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={{ color: 'var(--ink)' }}>
          <line x1="3" y1="7" x2="21" y2="7" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="17" x2="21" y2="17" />
        </svg>
      </button>

      {/* Desktop Navigation */}
      <motion.nav
        className="mt-[15px] hidden md:block"
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
                transition={{ duration: 0.75, delay: idx * 0.1, ease: 'easeOut' }}
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
