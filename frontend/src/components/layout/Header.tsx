'use client';

import { useCallback, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
import { UserAvatar } from '@/components/auth/UserAvatar';

interface HeaderProps {
  showNav?: boolean;
}

type Theme = 'schedule-light' | 'schedule-dark';

// Theme store using useSyncExternalStore pattern
const themeStore = {
  listeners: new Set<() => void>(),
  
  getSnapshot(): Theme {
    if (typeof window === 'undefined') return 'schedule-light';
    return (localStorage.getItem('theme') as Theme) || 'schedule-light';
  },
  
  getServerSnapshot(): Theme {
    return 'schedule-light';
  },
  
  subscribe(listener: () => void) {
    themeStore.listeners.add(listener);
    return () => themeStore.listeners.delete(listener);
  },
  
  setTheme(newTheme: Theme) {
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    themeStore.listeners.forEach(listener => listener());
  }
};

// Custom hook to manage theme with localStorage
function useTheme() {
  const theme = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getSnapshot,
    themeStore.getServerSnapshot
  );

  const setTheme = useCallback((newTheme: Theme) => {
    themeStore.setTheme(newTheme);
  }, []);

  return { theme, setTheme };
}

// Custom hook to safely check if we're mounted (client-side)
function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function Header({ showNav = true }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const mounted = useIsMounted();
  const { isAuthenticated, user, isLoading, logout } = useAuth();

  const toggleTheme = () => {
    const newTheme = theme === 'schedule-light' ? 'schedule-dark' : 'schedule-light';
    setTheme(newTheme);
  };

  return (
    <header className="navbar bg-base-100 border-b border-base-300">
      <div className="navbar-start">
        <Link href="/" className="btn btn-ghost text-xl font-bold text-primary">
          UP Schedule
        </Link>
      </div>

      {showNav && (
        <div className="navbar-center hidden md:flex">
          <ul className="menu menu-horizontal px-1 gap-2">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/upload">Upload</Link></li>
          </ul>
        </div>
      )}

      <div className="navbar-end gap-2">
        {/* Auth UI - Show login button or user avatar based on auth state */}
        {mounted && !isLoading && (
          <>
            {isAuthenticated && user ? (
              <UserAvatar user={user} onLogout={logout} />
            ) : (
              <GoogleLoginButton className="btn-sm" />
            )}
          </>
        )}

        {/* Theme toggle */}
        {mounted && (
          <label className="swap swap-rotate btn btn-ghost btn-circle">
            <input
              type="checkbox"
              checked={theme === 'schedule-dark'}
              onChange={toggleTheme}
              aria-label="Toggle theme"
            />

            {/* Sun icon */}
            <svg
              className="swap-off h-6 w-6 fill-current"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
            </svg>

            {/* Moon icon */}
            <svg
              className="swap-on h-6 w-6 fill-current"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
            </svg>
          </label>
        )}
      </div>
    </header>
  );
}
