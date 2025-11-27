import axios, { AxiosInstance, AxiosError } from 'axios';

/**
 * API Error interface for typed error handling
 */
export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

/**
 * Parse error response from API or network error
 */
export function parseApiError(error: AxiosError<ApiError>): string {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An error occurred';
}

/**
 * Axios instance configured for backend API communication
 * - Uses session-based authentication with credentials
 * - Includes response interceptor for error handling
 */
export const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const message = parseApiError(error);
    throw new Error(message);
  }
);
