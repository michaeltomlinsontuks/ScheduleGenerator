import '@testing-library/jest-dom';
import { beforeEach, vi } from 'vitest';

// Mock storage for tests
const createStorageMock = () => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

// Setup storage mocks
Object.defineProperty(window, 'sessionStorage', {
  value: createStorageMock(),
});

Object.defineProperty(window, 'localStorage', {
  value: createStorageMock(),
});

// Clear storage before each test
beforeEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
});
