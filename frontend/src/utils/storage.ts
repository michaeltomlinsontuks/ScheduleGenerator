/**
 * Storage utility for handling browser storage operations with error handling
 */

import { showWarningToast, showErrorToast } from './toast';

export type StorageType = 'localStorage' | 'sessionStorage';

export interface StorageAdapter {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
}

/**
 * Storage error types
 */
export class StorageQuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageQuotaExceededError';
  }
}

export class StorageUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageUnavailableError';
  }
}

/**
 * Check if storage is available and working
 */
export function isStorageAvailable(type: StorageType): boolean {
  try {
    const storage = window[type];
    const testKey = '__storage_test__';
    storage.setItem(testKey, 'test');
    storage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get storage adapter with fallback to in-memory storage
 */
export function getStorageAdapter(type: StorageType): StorageAdapter {
  if (isStorageAvailable(type)) {
    return createSafeStorageAdapter(window[type], type);
  }

  // Fallback to in-memory storage
  console.warn(`${type} is not available, using in-memory storage`);
  showWarningToast(
    `Browser storage is unavailable. Your data will not persist after closing this tab.`,
    7000
  );
  return createInMemoryStorage();
}

/**
 * Create a safe storage adapter with error handling
 */
function createSafeStorageAdapter(storage: Storage, type: StorageType): StorageAdapter {
  return {
    getItem: (key: string) => {
      try {
        return storage.getItem(key);
      } catch (error) {
        console.error(`Failed to get item from ${type}:`, error);
        showErrorToast(`Failed to retrieve data from storage. Please refresh the page.`);
        return null;
      }
    },

    setItem: (key: string, value: string) => {
      try {
        storage.setItem(key, value);
      } catch (error) {
        if (isQuotaExceededError(error)) {
          console.error(`Storage quota exceeded for ${type}:`, error);
          handleQuotaExceeded(storage, key, value, type);
        } else {
          console.error(`Failed to set item in ${type}:`, error);
          showErrorToast(`Failed to save data. Your changes may not persist.`);
          throw new StorageUnavailableError(`Failed to set item in ${type}`);
        }
      }
    },

    removeItem: (key: string) => {
      try {
        storage.removeItem(key);
      } catch (error) {
        console.error(`Failed to remove item from ${type}:`, error);
        // Don't show toast for remove errors as they're less critical
      }
    },

    clear: () => {
      try {
        storage.clear();
      } catch (error) {
        console.error(`Failed to clear ${type}:`, error);
        // Don't show toast for clear errors as they're less critical
      }
    },
  };
}

/**
 * Create in-memory storage adapter for fallback
 */
export function createInMemoryStorage(): StorageAdapter {
  const store = new Map<string, string>();

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };
}

/**
 * Clear all workflow-related data from sessionStorage
 */
export function clearWorkflowStorage(): void {
  try {
    const storage = getStorageAdapter('sessionStorage');
    storage.removeItem('schedule-events');
  } catch (error) {
    console.error('Failed to clear workflow storage:', error);
  }
}

/**
 * Check storage quota and available space
 */
export async function checkStorageQuota(): Promise<{
  available: boolean;
  usage?: number;
  quota?: number;
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const available = usage < quota * 0.9; // 90% threshold

      return { available, usage, quota };
    } catch (error) {
      console.error('Failed to check storage quota:', error);
    }
  }

  return { available: true };
}

/**
 * Check if an error is a quota exceeded error
 */
function isQuotaExceededError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    // Check for quota exceeded error codes
    (error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error.code === 22 ||
      error.code === 1014)
  );
}

/**
 * Handle quota exceeded by clearing old data and retrying
 */
function handleQuotaExceeded(
  storage: Storage,
  key: string,
  value: string,
  type: StorageType
): void {
  console.warn(`Storage quota exceeded for ${type}, attempting to clear old data`);
  
  try {
    // Try to clear workflow data if we're in sessionStorage
    if (type === 'sessionStorage') {
      const keysToRemove = ['schedule-events'];
      keysToRemove.forEach((k) => {
        if (k !== key) {
          try {
            storage.removeItem(k);
          } catch (e) {
            console.error(`Failed to remove ${k}:`, e);
          }
        }
      });

      // Retry the operation
      storage.setItem(key, value);
      showWarningToast(
        `Storage space was low. Old data was cleared to make room.`,
        7000
      );
    } else {
      // For localStorage, we can't automatically clear user preferences
      showErrorToast(
        `Storage is full. Please clear some browser data to continue.`,
        10000
      );
      throw new StorageQuotaExceededError(`Storage quota exceeded for ${type}`);
    }
  } catch (retryError) {
    console.error(`Failed to recover from quota exceeded:`, retryError);
    showErrorToast(
      `Storage is full and could not be cleared. Your changes may not be saved.`,
      10000
    );
    throw new StorageQuotaExceededError(`Storage quota exceeded for ${type}`);
  }
}
