/**
 * Service Worker Registration
 *
 * Registers /sw.js in production browser environments.
 * Returns a status object so callers can react to registration state.
 *
 * Skips registration in:
 *  - SSR (no window)
 *  - Development (NODE_ENV !== 'production')
 *  - Browsers without serviceWorker support
 *
 * Does NOT require sw.js to exist at import time — safe in test environments.
 */

export type SwStatus =
  | { status: 'registered'; scope: string }
  | { status: 'dev-skip' }
  | { status: 'unsupported' }
  | { status: 'error'; message: string };

/**
 * Register the service worker.
 *
 * Call once from the root layout or _app equivalent after hydration:
 *
 * ```ts
 * useEffect(() => { registerServiceWorker(); }, []);
 * ```
 */
export async function registerServiceWorker(): Promise<SwStatus> {
  // SSR guard
  if (typeof window === 'undefined') {
    return { status: 'dev-skip' };
  }

  // Development skip — hot-reload and SW don't mix well
  if (process.env.NODE_ENV !== 'production') {
    return { status: 'dev-skip' };
  }

  // Browser support guard
  if (!('serviceWorker' in navigator)) {
    return { status: 'unsupported' };
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    return {
      status: 'registered',
      scope: registration.scope,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { status: 'error', message };
  }
}

/**
 * Unregister all service workers — useful for debugging or forced updates.
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((r) => r.unregister()));
  return registrations.length > 0;
}