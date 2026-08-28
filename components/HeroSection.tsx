'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';

type NavItem = {
  label: string;
  href: string;
};

const NAV: NavItem[] = [
  { label: 'HOME', href: '#home' },
  { label: 'COMEDY', href: '#comedy' },
  { label: 'PORTRAITS', href: '#portrait' },
  { label: 'THE MUSIC', href: '#music' },
  { label: 'ABOUT', href: '#' },
];

export default function HeroSection({ pathname = '#home' }: { pathname?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="px-6 pb-[50px] pt-[30px] text-center md:px-[50px]"
    >
      {/* Wordmark */}
      <Link href="#home" className="inline-block">
        <span className="block font-display text-[20px] font-400 leading-none tracking-tight text-ink md:text-[24px]">
          The
        </span>
        <span className="mt-1 block font-display text-[40px] font-800 leading-[1.05] tracking-tight text-ink md:text-[56px]">
          BT PHOTOGRAPHY
        </span>
      </Link>

      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        aria-expanded={mobileOpen}
        aria-label="Menu"
        className="mt-6 text-[14px] font-bold uppercase tracking-wide text-accent md:hidden"
      >
        {mobileOpen ? 'CLOSE' : 'MENU'}
      </button>

      {/* Navigation */}
      <nav
        className={`${mobileOpen ? 'block' : 'hidden'} mt-[15px] md:block`}
        aria-label="Primary"
      >
        <ul className="md:inline-block">
          {NAV.map((item) => {
            const isActive = item.href === pathname;
            return (
              <li
                key={item.label}
                className="relative block py-2 md:inline-block md:px-[20px] md:pb-[10px] md:pt-0"
              >
                <Link
                  href={item.href}
                  className={`text-[14px] font-600 uppercase tracking-[0.08em] transition-colors hover:opacity-60 ${
                    isActive ? 'text-accent border-b border-accent pb-[2px]' : 'text-ink'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </motion.header>
  );
}
