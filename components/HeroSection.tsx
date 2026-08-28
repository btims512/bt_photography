'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';

type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

const NAV: NavItem[] = [
  { label: 'HOME', href: '#home' },
  {
    label: 'PORTFOLIO',
    href: '#',
    children: [
      { label: 'COMEDY', href: '#comedy' },
      { label: 'PORTRAIT', href: '#portrait' },
      { label: 'MUSIC', href: '#music' },
    ],
  },
  { label: 'ABOUT', href: '#' },
  { label: 'INSTAGRAM', href: '#' },
  { label: 'CONNECT', href: '#contact' },
];

export default function HeroSection({ pathname = '#home' }: { pathname?: string }) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
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
        <span className="block font-display text-[20px] leading-none tracking-tight text-ink md:text-[24px]">
          Photography by
        </span>
        <span className="mt-1 block font-display text-[40px] leading-[1.05] tracking-tight text-ink md:text-[56px]">
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
                onMouseEnter={() => setOpenMenu(item.label)}
                onMouseLeave={() => setOpenMenu(null)}
                className="relative block py-2 md:inline-block md:px-[20px] md:pb-[10px] md:pt-0"
              >
                <Link
                  href={item.href}
                  className={`text-[14px] font-bold uppercase tracking-wide text-accent transition-opacity hover:opacity-60 ${
                    isActive ? 'border-b border-accent pb-[2px]' : ''
                  }`}
                >
                  {item.label}
                </Link>

                {item.children && (
                  <ul
                    className={`${
                      openMenu === item.label ? 'md:block' : 'md:hidden'
                    } mt-2 md:absolute md:left-1/2 md:top-full md:z-10 md:mt-0 md:-translate-x-1/2 md:whitespace-nowrap md:bg-white md:py-3 md:shadow-sm`}
                  >
                    {item.children.map((child) => (
                      <li key={child.label} className="md:px-5 md:py-1.5">
                        <Link
                          href={child.href}
                          className="text-[13px] font-bold uppercase tracking-wide text-accent transition-opacity hover:opacity-60"
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </motion.header>
  );
}
