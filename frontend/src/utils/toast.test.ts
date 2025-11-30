/**
 * Toast utility tests
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  showToast,
  showErrorToast,
  showWarningToast,
  showSuccessToast,
  showInfoToast,
} from './toast';

describe('Toast Utility', () => {
  beforeEach(() => {
    // Clean up any existing toast containers
    const container = document.getElementById('toast-container');
    if (container) {
      document.body.removeChild(container);
    }
  });

  afterEach(() => {
    // Clean up after each test
    const container = document.getElementById('toast-container');
    if (container) {
      document.body.removeChild(container);
    }
  });

  describe('showToast', () => {
    it('should create a toast container if it does not exist', () => {
      showToast('Test message');
      const container = document.getElementById('toast-container');
      expect(container).not.toBeNull();
    });

    it('should add a toast element to the container', () => {
      showToast('Test message');
      const container = document.getElementById('toast-container');
      expect(container?.children.length).toBe(1);
    });

    it('should set the correct message text', () => {
      const message = 'Test message';
      showToast(message);
      const container = document.getElementById('toast-container');
      const toast = container?.children[0];
      expect(toast?.textContent).toBe(message);
    });

    it('should apply info styling by default', () => {
      showToast('Test message');
      const container = document.getElementById('toast-container');
      const toast = container?.children[0];
      expect(toast?.className).toContain('alert-info');
    });

    it('should apply correct styling for different types', () => {
      showToast('Error', { type: 'error' });
      let container = document.getElementById('toast-container');
      let toast = container?.children[0];
      expect(toast?.className).toContain('alert-error');

      // Clean up
      if (container) document.body.removeChild(container);

      showToast('Warning', { type: 'warning' });
      container = document.getElementById('toast-container');
      toast = container?.children[0];
      expect(toast?.className).toContain('alert-warning');

      // Clean up
      if (container) document.body.removeChild(container);

      showToast('Success', { type: 'success' });
      container = document.getElementById('toast-container');
      toast = container?.children[0];
      expect(toast?.className).toContain('alert-success');
    });

    it('should set role="alert" for accessibility', () => {
      showToast('Test message');
      const container = document.getElementById('toast-container');
      const toast = container?.children[0];
      expect(toast?.getAttribute('role')).toBe('alert');
    });

    it('should reuse existing container for multiple toasts', () => {
      showToast('First message');
      showToast('Second message');
      const containers = document.querySelectorAll('#toast-container');
      expect(containers.length).toBe(1);
      expect(containers[0].children.length).toBe(2);
    });
  });

  describe('Convenience functions', () => {
    it('showErrorToast should create error toast', () => {
      showErrorToast('Error message');
      const container = document.getElementById('toast-container');
      const toast = container?.children[0];
      expect(toast?.className).toContain('alert-error');
      expect(toast?.textContent).toBe('Error message');
    });

    it('showWarningToast should create warning toast', () => {
      showWarningToast('Warning message');
      const container = document.getElementById('toast-container');
      const toast = container?.children[0];
      expect(toast?.className).toContain('alert-warning');
      expect(toast?.textContent).toBe('Warning message');
    });

    it('showSuccessToast should create success toast', () => {
      showSuccessToast('Success message');
      const container = document.getElementById('toast-container');
      const toast = container?.children[0];
      expect(toast?.className).toContain('alert-success');
      expect(toast?.textContent).toBe('Success message');
    });

    it('showInfoToast should create info toast', () => {
      showInfoToast('Info message');
      const container = document.getElementById('toast-container');
      const toast = container?.children[0];
      expect(toast?.className).toContain('alert-info');
      expect(toast?.textContent).toBe('Info message');
    });
  });

  describe('Auto-removal', () => {
    it('should remove toast after duration', async () => {
      vi.useFakeTimers();
      
      showToast('Test message', { duration: 1000 });
      const container = document.getElementById('toast-container');
      expect(container?.children.length).toBe(1);

      // Fast-forward time
      vi.advanceTimersByTime(1000);
      
      // Wait for fade out animation
      vi.advanceTimersByTime(300);
      
      expect(container?.children.length).toBe(0);
      
      vi.useRealTimers();
    });

    it('should remove container when last toast is removed', async () => {
      vi.useFakeTimers();
      
      showToast('Test message', { duration: 1000 });
      
      // Fast-forward time
      vi.advanceTimersByTime(1000);
      vi.advanceTimersByTime(300);
      
      const container = document.getElementById('toast-container');
      expect(container).toBeNull();
      
      vi.useRealTimers();
    });
  });
});
