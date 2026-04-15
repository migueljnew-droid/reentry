/**
 * Offline-First Module
 *
 * Re-exports the full public API for offline action plan storage,
 * service worker registration, and connectivity detection.
 */

export type { ActionPlan, ActionPlanStep, SyncOp, SyncOpKind } from './plan-store';
export {
  saveActionPlan,
  loadActionPlan,
  listCachedPlans,
  clearExpired,
  getSyncQueue,
  enqueueSync,
  drainSyncQueue,
} from './plan-store';

export type { SwStatus } from './service-worker-registration';
export {
  registerServiceWorker,
  unregisterServiceWorker,
} from './service-worker-registration';

export type { ConnectivityCallback } from './connectivity';
export { isOnline, subscribeConnectivity, waitForOnline } from './connectivity';