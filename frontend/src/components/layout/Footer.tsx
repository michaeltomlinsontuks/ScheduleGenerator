import React from 'react';

interface FooterProps {
  minimal?: boolean;
}

export function Footer({ minimal = false }: FooterProps) {
  const currentYear = new Date().getFullYear();

  if (minimal) {
    return (
      <footer className="footer footer-center p-4 bg-base-200 text-base-content border-t border-base-300">
        <aside>
          <p>© {currentYear} UP Schedule Generator</p>
        </aside>
      </footer>
    );
  }

  return (
    <footer className="footer footer-center p-6 bg-base-200 text-base-content border-t border-base-300">
      <aside>
        <p className="font-semibold">UP Schedule Generator</p>
        <p>Convert your UP PDF schedule to calendar events</p>
        <p className="text-sm opacity-70">© {currentYear} All rights reserved</p>
      </aside>
      <nav>
        <div className="grid grid-flow-col gap-4">
          <a href="https://github.com" className="link link-hover" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a href="/upload" className="link link-hover">
            Get Started
          </a>
        </div>
      </nav>
    </footer>
  );
}
