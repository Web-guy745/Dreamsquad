export type ToastType = 'success' | 'error';

type ToastListener = (message: string, type: ToastType) => void;

const listeners = new Set<ToastListener>();

/**
 * Minimal pub/sub toast system — no library, no context provider wiring
 * required. ToastHost (mounted once in App.tsx) subscribes; any module can
 * call showToast() to surface a brief status message.
 */
export function showToast(message: string, type: ToastType = 'success'): void {
  listeners.forEach((listener) => listener(message, type));
}

export function subscribeToToasts(listener: ToastListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
