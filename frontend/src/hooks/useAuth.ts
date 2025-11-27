/**
 * useAuth Hook - Provides authentication state and actions
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 8.1
 */
'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';

/**
 * Hook for managing authentication state and actions
 * @returns Authentication state and functions
 */
export function useAuth() {
  const { isAuthenticated, user, isLoading, error, checkStatus, logout, setError } =
    useAuthStore();

  // Check auth status on mount
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  /**
   * Redirect to Google OAuth login
   */
  const login = () => {
    window.location.href = authService.getLoginUrl();
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
