import React from 'react';
import Link from 'next/link';

interface FooterProps {
  minimal?: boolean;
}

export function Footer({ minimal = false }: FooterProps) {
  const currentYear = new Date().getFullYear();

  if (minimal) {
    return (
      <footer className="footer footer-center p-4 bg-base-200 text-base-content border-t border-base-300">
        <aside>
          <p>© {currentYear} Tuks Schedule Generator</p>
        </aside>
      </footer>
    );
  }

  return (
    <footer className="footer footer-center p-6 bg-base-200 text-base-content border-t border-base-300">
      <aside className="text-center">
        <p className="font-semibold">Tuks Schedule Generator</p>
        <p>Convert your Tuks PDF schedule to calendar events</p>

        <nav className="flex gap-4 mt-3 text-sm">
          <Link href="/about" className="link link-hover opacity-70 hover:opacity-100">
            About
          </Link>
          <span className="opacity-50">•</span>
          <Link href="/privacy" className="link link-hover opacity-70 hover:opacity-100">
            Privacy Policy
          </Link>
          <span className="opacity-50">•</span>
          <Link href="/terms" className="link link-hover opacity-70 hover:opacity-100">
            Terms of Service
          </Link>
        </nav>

        <p className="text-sm opacity-70 mt-2">© {currentYear} All rights reserved</p>
      </aside>
    </footer>
  );
}
