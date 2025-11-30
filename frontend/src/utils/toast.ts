/**
 * Toast notification utility for user feedback
 * Uses DaisyUI toast component styling
 */

export type ToastType = 'info' | 'success' | 'warning' | 'error';

interface ToastOptions {
  type?: ToastType;
  duration?: number;
  position?: 'top' | 'bottom' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const DEFAULT_DURATION = 5000; // 5 seconds
const DEFAULT_POSITION = 'top-right';

/**
 * Show a toast notification
 */
export function showToast(message: string, options: ToastOptions = {}): void {
  const {
    type = 'info',
    duration = DEFAULT_DURATION,
    position = DEFAULT_POSITION,
  } = options;

  // Create toast container if it doesn't exist
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = getContainerClass(position);
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = getToastClass(type);
  toast.textContent = message;
  toast.setAttribute('role', 'alert');

  // Add to container
  container.appendChild(toast);

  // Auto-remove after duration
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      container?.removeChild(toast);
      // Remove container if empty
      if (container && container.children.length === 0) {
        document.body.removeChild(container);
      }
    }, 300); // Wait for fade out animation
  }, duration);
}

/**
 * Show an error toast
 */
export function showErrorToast(message: string, duration?: number): void {
  showToast(message, { type: 'error', duration });
}

/**
 * Show a warning toast
 */
export function showWarningToast(message: string, duration?: number): void {
  showToast(message, { type: 'warning', duration });
}

/**
 * Show a success toast
 */
export function showSuccessToast(message: string, duration?: number): void {
  showToast(message, { type: 'success', duration });
}

/**
 * Show an info toast
 */
export function showInfoToast(message: string, duration?: number): void {
  showToast(message, { type: 'info', duration });
}

/**
 * Get container positioning classes
 */
function getContainerClass(position: string): string {
  const baseClasses = 'fixed z-50 flex flex-col gap-2 p-4 pointer-events-none';
  
  const positionClasses: Record<string, string> = {
    'top': 'top-0 left-1/2 -translate-x-1/2',
    'bottom': 'bottom-0 left-1/2 -translate-x-1/2',
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    'bottom-left': 'bottom-0 left-0',
  };

  return `${baseClasses} ${positionClasses[position] || positionClasses['top-right']}`;
}

/**
 * Get toast styling classes based on type
 */
function getToastClass(type: ToastType): string {
  const baseClasses = 'alert shadow-lg pointer-events-auto transition-opacity duration-300 min-w-[300px] max-w-[500px]';
  
  const typeClasses: Record<ToastType, string> = {
    info: 'alert-info',
    success: 'alert-success',
    warning: 'alert-warning',
    error: 'alert-error',
  };

  return `${baseClasses} ${typeClasses[type]}`;
}
