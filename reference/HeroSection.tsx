"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";

/**
 * Centered wordmark over a centered inline nav.
 *
 * Measured from the reference: 30px top padding, 50px bottom padding, 15px
 * between the logo and the nav, nav items at 20px horizontal padding each
 * (so 40px apart), 10px of padding below the text where the active underline
 * sits. Total header height lands at 226px.
 */

type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

const NAV: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "Portfolio",
    href: "#",
    children: [
      { label: "Music", href: "/music" },
      { label: "Editorial + Fashion", href: "/editorial" },
      { label: "Commercial", href: "/commercial" },
      { label: "Hospitality + Events", href: "/hospitality" },
    ],
  },
  { label: "About", href: "/about" },
  { label: "Instagram", href: "/instagram" },
  { label: "Connect", href: "/contact" },
];

export default function HeroSection({ pathname = "/" }: { pathname?: string }) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="px-6 pb-[50px] pt-[30px] text-center md:px-[50px]"
    >
      {/* Wordmark. The reference uses a 533x100 image; swap in your own SVG or
          set it in type. Keep it centered and around 100px tall. */}
      <Link href="/" className="inline-block">
        <span className="block font-display text-[26px] leading-none tracking-tight text-ink md:text-[32px]">
          Photography by
        </span>
        <span className="mt-1 block font-display text-[44px] leading-[1.05] tracking-tight text-ink md:text-[64px]">
          BT
        </span>
      </Link>

      {/* Mobile toggle — the reference collapses to a hamburger below 768px */}
      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        aria-expanded={mobileOpen}
        aria-label="Menu"
        className="mt-6 text-[14px] font-bold uppercase tracking-wide text-accent md:hidden"
      >
        {mobileOpen ? "Close" : "Menu"}
      </button>

      <nav
        className={`${mobileOpen ? "block" : "hidden"} mt-[15px] md:block`}
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
                    isActive ? "border-b border-accent pb-[2px]" : ""
                  }`}
                >
                  {item.label}
                </Link>

                {item.children && (
                  <ul
                    className={`${
                      openMenu === item.label ? "md:block" : "md:hidden"
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
