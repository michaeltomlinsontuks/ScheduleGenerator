'use client';

import { useRef, useEffect } from 'react';
import type { AuthUser } from '@/services/authService';

export interface UserAvatarProps {
  user: AuthUser;
  onLogout: () => void;
}

/**
 * User avatar component with dropdown menu
 * Requirements: 3.3, 3.4
 */
export function UserAvatar({ user, onLogout }: UserAvatarProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (detailsRef.current && !detailsRef.current.contains(event.target as Node)) {
        detailsRef.current.open = false;
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
    onLogout();
  };

  return (
    <details ref={detailsRef} className="dropdown dropdown-end">
      <summary className="btn btn-ghost btn-circle avatar m-0">
        <div className="w-10 rounded-full">
          <img
            src={user.picture}
            alt={`${user.firstName} ${user.lastName}`}
            referrerPolicy="no-referrer"
          />
        </div>
      </summary>

      <ul className="dropdown-content z-50 menu p-2 shadow-lg bg-base-100 rounded-box w-64">
        <li className="menu-title px-4 py-2">
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="w-10 rounded-full">
                <img
                  src={user.picture}
                  alt={`${user.firstName} ${user.lastName}`}
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base-content">
                {user.firstName} {user.lastName}
              </span>
              <span className="text-xs text-base-content/70">{user.email}</span>
            </div>
          </div>
        </li>
        <div className="divider my-1" />
        <li>
          <button
            type="button"
            onClick={handleLogout}
            className="text-error hover:bg-error/10"
          >
            <LogoutIcon />
            Sign out
          </button>
        </li>
      </ul>
    </details>
  );
}

function LogoutIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );
}
