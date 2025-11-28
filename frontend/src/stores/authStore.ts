/**
 * Auth Store - Manages authentication state
 * Requirements: 3.2, 3.3, 3.4, 3.5
 */
import { create } from 'zustand';
import { authService, type AuthUser } from '@/services/authService';

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  checkStatus: () => Promise<void>;
  logout: () => Promise<void>;
  setError: (error: string | null) => void;
  reset: () => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: false, // Start as false to show login button immediately
  error: null,
};

export const useAuthStore = create<AuthStore>((set) => ({
  ...initialState,

  checkStatus: async () => {
    // Don't set loading state - keep UI responsive
    set({ error: null });
    
    try {
      const response = await authService.getStatus();
      set({
        isAuthenticated: response.data.authenticated,
        user: response.data.user || null,
      });
    } catch (err) {
      // Silently fail - just show login button
      set({
        isAuthenticated: false,
        user: null,
        error: null, // Don't show error, just assume not authenticated
      });
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await authService.logout();
      set({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to logout',
      });
    }
  },

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
