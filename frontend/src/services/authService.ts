import { api } from './api';

/**
 * Authenticated user information from Google OAuth
 */
export interface AuthUser {
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
}

/**
 * Authentication status response from backend
 */
export interface AuthStatus {
  authenticated: boolean;
  user?: AuthUser;
}

/**
 * Auth service for Google OAuth operations
 */
export const authService = {
  /**
   * Get the Google OAuth login URL
   */
  getLoginUrl: (): string => `${api.defaults.baseURL}/api/auth/google`,

  /**
   * Check current authentication status
   */
  getStatus: () => api.get<AuthStatus>('/api/auth/status'),

  /**
   * Logout the current user
   */
  logout: () => api.post('/api/auth/logout'),
};
