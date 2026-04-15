/**
 * Connectivity Detection
 *
 * Wraps the browser's online/offline events with an SSR-safe API.
 * Used to trigger sync queue draining when connectivity is restored.
 *
 * SSR behaviour: isOnline() returns true (optimistic), subscribeConnectivity
 * returns a noop unsubscribe function.
 *
 * Usage:
 * ```ts
 * const unsub = subscribeConnectivity((online) => {
 *   if (online) drainSyncQueue(serverSync);
 * });
 * // cleanup
 * unsub();
 * ```
 */

export type ConnectivityCallback = (isOnline: boolean) => void;

/**
 * Returns the current online status.
 * SSR-safe: returns true on the server (optimistic default).
 */
export function isOnline(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return true; // SSR optimistic default
  }
  return navigator.onLine;
}

/**
 * Subscribe to online/offline transitions.
 * Returns an unsubscribe function.
 *
 * The callback is called immediately with the current status so callers
 * can initialise their UI without waiting for the first event.
 */
export function subscribeConnectivity(cb: ConnectivityCallback): () => void {
  if (typeof window === 'undefined') {
    // SSR: return noop unsubscribe
    return () => {};
  }

  const onOnline = () => cb(true);
  const onOffline = () => cb(false);

  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  // Emit current state immediately
  cb(navigator.onLine);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

/**
 * Returns a promise that resolves when the browser comes online.
 * Resolves immediately if already online.
 * Useful for one-shot "wait for connectivity" patterns.
 */
export function waitForOnline(): Promise<void> {
  return new Promise((resolve) => {
    if (isOnline()) {
      resolve();
      return;
    }
    const unsub = subscribeConnectivity((online) => {
      if (online) {
        unsub();
        resolve();
      }
    });
  });
}