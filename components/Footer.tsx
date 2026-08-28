import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="px-6 pb-[60px] pt-[80px] text-center text-[14px] leading-[1.2] text-black md:px-[50px]">
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
    </footer>
  );
}
