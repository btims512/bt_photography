'use client';

import Link from 'next/link';
import { useLayoutMode } from '@/lib/layout-mode';

export default function Footer() {
  const { toggle } = useLayoutMode();

  const handleToggle = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    toggle();
  };

  return (
    <footer className="relative px-6 pb-[60px] pt-[80px] text-center text-[14px] font-600 leading-[1.2] md:px-[50px]" style={{color: 'var(--faint)', textTransform: 'lowercase'}}>
      <ul className="mb-[30px] mt-[14px] flex justify-center gap-5">
        <li>
          <Link
            href="https://www.instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="inline-block transition-opacity hover:opacity-60"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
              <circle cx="12" cy="12" r="4.5" />
              <circle cx="17.8" cy="6.2" r="1.1" fill="currentColor" stroke="none" />
            </svg>
          </Link>
        </li>
      </ul>

      <p>Copyright © {new Date().getFullYear()} All rights reserved.</p>
      <p>BT is a photographer in Austin, TX</p>

      <button
        type="button"
        onClick={handleToggle}
        aria-label="Toggle layout style"
        className="absolute bottom-4 right-4 md:bottom-6 md:right-6 inline-flex items-center justify-center"
        style={{
          width: '20px',
          height: '20px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          color: 'var(--line)',
          opacity: 0.6,
          transition: 'opacity 0.3s ease, color 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.color = 'var(--accent)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.6';
          e.currentTarget.style.color = 'var(--line)';
        }}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-3 w-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="7" height="18" rx="1" />
          <rect x="14" y="3" width="3.5" height="8" rx="1" />
          <rect x="14" y="13" width="3.5" height="8" rx="1" />
          <rect x="19.5" y="3" width="1.5" height="18" rx="0.75" />
        </svg>
      </button>
    </footer>
  );
}
