'use client';

import { useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'bt-theme';

// The theme lives on <html>, put there before first paint by the script in
// app/layout.tsx - so this just watches that attribute rather than keeping a
// copy of it that could drift.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}
const read = (): Theme => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

/**
 * Sun/moon button. In the header's top-right corner on desktop; in the menu
 * drawer's top-right on a phone, mirroring its close button. The server cannot know the theme, so it renders null there and the
 * client takes over - one icon on the server and another on the client would
 * be a hydration mismatch.
 */
export default function ThemeToggle({ variant = 'header' }: { variant?: 'header' | 'drawer' }) {
  const theme = useSyncExternalStore<Theme | null>(subscribe, read, () => null);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  };

  const dark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={
        variant === 'header'
          ? 'absolute right-[39px] z-10 hidden h-11 w-11 items-center justify-center md:inline-flex'
          : 'absolute right-3 inline-flex h-11 w-11 items-center justify-center'
      }
      tabIndex={undefined}
      style={{
        // Both ride the header's collapse so they stay level with the header's
        // own row: the drawer's with the hamburger, the header's with the logo
        // (centred at 40px at rest, 51px once compact).
        top:
          variant === 'drawer'
            ? 'calc(97px - var(--header-shrink, 0) * 61px)'
            : 'calc(40px + var(--header-shrink, 0) * 11px)',
        transform: 'translateY(-50%)',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        color: 'var(--faint)',
        opacity: 0.8,
        transition: 'opacity 0.3s ease, color 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '1';
        e.currentTarget.style.color = 'var(--ink)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '0.8';
        e.currentTarget.style.color = 'var(--faint)';
      }}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {dark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
          </>
        ) : (
          <path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a6.8 6.8 0 0 0 10.7 10.7Z" />
        )}
      </svg>
    </button>
  );
}
