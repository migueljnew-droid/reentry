const PLAN_CACHE_KEY = 'reentry-plan-cache';

interface CachedPlan {
  id: string;
  data: Record<string, unknown>;
  cachedAt: string;
}

export function cachePlan(planId: string, planData: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;

  try {
    const cached: Record<string, CachedPlan> = JSON.parse(
      localStorage.getItem(PLAN_CACHE_KEY) || '{}'
    );

    cached[planId] = {
      id: planId,
      data: planData,
      cachedAt: new Date().toISOString(),
    };

    localStorage.setItem(PLAN_CACHE_KEY, JSON.stringify(cached));
  } catch {
    // localStorage may be full or unavailable
    console.warn('Failed to cache plan offline');
  }
}

export function getCachedPlan(planId: string): CachedPlan | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached: Record<string, CachedPlan> = JSON.parse(
      localStorage.getItem(PLAN_CACHE_KEY) || '{}'
    );

    return cached[planId] || null;
  } catch {
    return null;
  }
}

export function getCachedPlans(): CachedPlan[] {
  if (typeof window === 'undefined') return [];

  try {
    const cached: Record<string, CachedPlan> = JSON.parse(
      localStorage.getItem(PLAN_CACHE_KEY) || '{}'
    );

    return Object.values(cached);
  } catch {
    return [];
  }
}

export function isOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

export function onOnlineStatusChange(callback: (online: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
