/**
 * Storage utility error handling tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isStorageAvailable,
  getStorageAdapter,
  createInMemoryStorage,
  StorageQuotaExceededError,
  StorageUnavailableError,
} from './storage';

// Mock toast functions
vi.mock('./toast', () => ({
  showWarningToast: vi.fn(),
  showErrorToast: vi.fn(),
}));

describe('Storage Utility', () => {
  beforeEach(() => {
    // Clear storage before each test
    sessionStorage.clear();
    localStorage.clear();
  });

  describe('isStorageAvailable', () => {
    it('should return true for available sessionStorage', () => {
      expect(isStorageAvailable('sessionStorage')).toBe(true);
    });

    it('should return true for available localStorage', () => {
      expect(isStorageAvailable('localStorage')).toBe(true);
    });

    it('should return false when storage throws error', () => {
      // Mock window.sessionStorage to throw
      const originalSessionStorage = Object.getOwnPropertyDescriptor(window, 'sessionStorage');
      
      Object.defineProperty(window, 'sessionStorage', {
        get: () => {
          throw new Error('Storage disabled');
        },
        configurable: true,
      });

      expect(isStorageAvailable('sessionStorage')).toBe(false);

      // Restore original
      if (originalSessionStorage) {
        Object.defineProperty(window, 'sessionStorage', originalSessionStorage);
      }
    });
  });

  describe('createInMemoryStorage', () => {
    it('should create a working in-memory storage adapter', () => {
      const storage = createInMemoryStorage();
      
      storage.setItem('key', 'value');
      expect(storage.getItem('key')).toBe('value');
      
      storage.removeItem('key');
      expect(storage.getItem('key')).toBeNull();
    });

    it('should support clear operation', () => {
      const storage = createInMemoryStorage();
      
      storage.setItem('key1', 'value1');
      storage.setItem('key2', 'value2');
      
      storage.clear();
      
      expect(storage.getItem('key1')).toBeNull();
      expect(storage.getItem('key2')).toBeNull();
    });

    it('should return null for non-existent keys', () => {
      const storage = createInMemoryStorage();
      expect(storage.getItem('nonexistent')).toBeNull();
    });
  });

  describe('getStorageAdapter', () => {
    it('should return native storage when available', () => {
      const adapter = getStorageAdapter('sessionStorage');
      adapter.setItem('test', 'value');
      expect(sessionStorage.getItem('test')).toBe('value');
    });

    it('should return in-memory storage when native storage unavailable', () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = () => {
        throw new Error('Storage disabled');
      };

      const adapter = getStorageAdapter('sessionStorage');
      
      // Should not throw
      adapter.setItem('test', 'value');
      expect(adapter.getItem('test')).toBe('value');
      
      // Should not affect native storage
      expect(() => sessionStorage.getItem('test')).not.toThrow();

      Storage.prototype.setItem = originalSetItem;
    });
  });

  describe('Safe storage adapter error handling', () => {
    it('should handle getItem errors gracefully', () => {
      const adapter = getStorageAdapter('sessionStorage');
      
      // Mock getItem to throw
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = () => {
        throw new Error('Read error');
      };

      const result = adapter.getItem('test');
      expect(result).toBeNull();

      Storage.prototype.getItem = originalGetItem;
    });

    it('should handle removeItem errors gracefully', () => {
      const adapter = getStorageAdapter('sessionStorage');
      
      // Mock removeItem to throw
      const originalRemoveItem = Storage.prototype.removeItem;
      Storage.prototype.removeItem = () => {
        throw new Error('Remove error');
      };

      // Should not throw
      expect(() => adapter.removeItem('test')).not.toThrow();

      Storage.prototype.removeItem = originalRemoveItem;
    });

    it('should handle clear errors gracefully', () => {
      const adapter = getStorageAdapter('sessionStorage');
      
      // Mock clear to throw
      const originalClear = Storage.prototype.clear;
      Storage.prototype.clear = () => {
        throw new Error('Clear error');
      };

      // Should not throw
      expect(() => adapter.clear()).not.toThrow();

      Storage.prototype.clear = originalClear;
    });
  });

  describe('Custom error types', () => {
    it('should create StorageQuotaExceededError', () => {
      const error = new StorageQuotaExceededError('Quota exceeded');
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('StorageQuotaExceededError');
      expect(error.message).toBe('Quota exceeded');
    });

    it('should create StorageUnavailableError', () => {
      const error = new StorageUnavailableError('Storage unavailable');
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('StorageUnavailableError');
      expect(error.message).toBe('Storage unavailable');
    });
  });
});
