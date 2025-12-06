/**
 * useAuth Hook - Provides authentication state and actions
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 8.1
 */
'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';

/**
 * Hook for managing authentication state and actions
 * @returns Authentication state and functions
 */
export function useAuth() {
  const { isAuthenticated, user, isLoading, error, checkStatus, logout, setError } =
    useAuthStore();
  const hasChecked = useRef(false);

  // Check auth status on mount (only once)
  useEffect(() => {
    if (!hasChecked.current) {
      hasChecked.current = true;
      checkStatus();
    }
  }, [checkStatus]);

  /**
   * Redirect to Google OAuth login
   * @param returnUrl - Optional URL to redirect back to after authentication (defaults to current page)
   */
  const login = (returnUrl?: string) => {
    const url = returnUrl || window.location.pathname;
    window.location.href = authService.getLoginUrl(url);
  };

  return {
    isAuthenticated,
    user,
    isLoading,
    error,
    login,
    logout,
    setError,
  };
}
