/**
 * Offline-First Action Plan Store
 *
 * Persists action plans to IndexedDB (via idb-keyval) so reentry clients
 * can access their roadmap with zero internet connectivity.
 *
 * Falls back to an in-memory Map when IndexedDB is unavailable (SSR, tests,
 * older devices) — the API surface is identical in both cases.
 *
 * Sync queue: operations performed offline are queued here and drained
 * automatically when connectivity is restored.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActionPlanStep {
  id: string;
  title: string;
  description: string;
  dueDate?: string; // ISO-8601
  completed: boolean;
  category: 'id' | 'housing' | 'employment' | 'benefits' | 'legal' | 'health' | 'other';
}

export interface ActionPlan {
  id: string;
  userId: string;
  releaseState: string;
  releaseDate: string; // ISO-8601
  steps: ActionPlanStep[];
  createdAt: string;  // ISO-8601
  updatedAt: string;  // ISO-8601
  version: number;
}

export type SyncOpKind = 'create' | 'update' | 'complete_step';

export interface SyncOp {
  id: string;          // uuid for the op itself
  op: SyncOpKind;
  payload: unknown;
  createdAt: string;   // ISO-8601
}

// ---------------------------------------------------------------------------
// Storage backend abstraction
// ---------------------------------------------------------------------------

interface KVStore {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  del(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

/** In-memory Map backend — used in tests and SSR */
class MapStore implements KVStore {
  private store = new Map<string, unknown>();

  async get(key: string): Promise<unknown> {
    return this.store.get(key) ?? undefined;
  }

  async set(key: string, value: unknown): Promise<void> {
    this.store.set(key, value);
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async keys(): Promise<string[]> {
    return Array.from(this.store.keys());
  }

  /** Test helper — wipe all data between tests */
  clear(): void {
    this.store.clear();
  }
}

/** idb-keyval backend — used in browser production */
class IdbStore implements KVStore {
  private idb: typeof import('idb-keyval');
  private storeName: string;
  private customStore: ReturnType<typeof import('idb-keyval').createStore>;

  constructor(idb: typeof import('idb-keyval'), storeName: string) {
    this.idb = idb;
    this.storeName = storeName;
    this.customStore = idb.createStore(`reentry-${storeName}`, storeName);
  }

  async get(key: string): Promise<unknown> {
    return this.idb.get(key, this.customStore);
  }

  async set(key: string, value: unknown): Promise<void> {
    await this.idb.set(key, value, this.customStore);
  }

  async del(key: string): Promise<void> {
    await this.idb.del(key, this.customStore);
  }

  async keys(): Promise<string[]> {
    return this.idb.keys(this.customStore) as Promise<string[]>;
  }
}

// ---------------------------------------------------------------------------
// Singleton store instances
// ---------------------------------------------------------------------------

/** Exported for test injection — do not use directly in application code */
export const _testMapStore = new MapStore();
export const _testSyncMapStore = new MapStore();

let _planStore: KVStore | null = null;
let _syncStore: KVStore | null = null;

async function getPlanStore(): Promise<KVStore> {
  if (_planStore) return _planStore;

  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    _planStore = _testMapStore;
    return _planStore;
  }

  try {
    const idb = await import('idb-keyval');
    _planStore = new IdbStore(idb, 'action-plans');
  } catch {
    _planStore = _testMapStore;
  }

  return _planStore;
}

async function getSyncStore(): Promise<KVStore> {
  if (_syncStore) return _syncStore;

  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    _syncStore = _testSyncMapStore;
    return _syncStore;
  }

  try {
    const idb = await import('idb-keyval');
    _syncStore = new IdbStore(idb, 'sync-queue');
  } catch {
    _syncStore = _testSyncMapStore;
  }

  return _syncStore;
}

/** Reset singletons — only for use in tests */
export function _resetStores(): void {
  _planStore = null;
  _syncStore = null;
  _testMapStore.clear();
  _testSyncMapStore.clear();
}

// ---------------------------------------------------------------------------
// Public API — Action Plans
// ---------------------------------------------------------------------------

/**
 * Persist an action plan locally.
 * Overwrites any existing plan with the same id.
 */
export async function saveActionPlan(id: string, plan: ActionPlan): Promise<void> {
  if (!id || typeof id !== 'string') throw new Error('saveActionPlan: id is required');
  const store = await getPlanStore();
  // Respect an explicit updatedAt on the incoming plan so tests + back-dated
  // imports behave deterministically; auto-touch only when missing.
  const record: ActionPlan = {
    ...plan,
    updatedAt: plan.updatedAt ?? new Date().toISOString(),
  };
  await store.set(`plan:${id}`, record);
}

/**
 * Variant that always stamps updatedAt to now — for live UI save flows
 * that want the "most recently edited" semantic.
 */
export async function touchAndSaveActionPlan(id: string, plan: ActionPlan): Promise<void> {
  if (!id || typeof id !== 'string') throw new Error('touchAndSaveActionPlan: id is required');
  const store = await getPlanStore();
  await store.set(`plan:${id}`, { ...plan, updatedAt: new Date().toISOString() });
}

/**
 * Load a single action plan by id.
 * Returns undefined if not found.
 */
export async function loadActionPlan(id: string): Promise<ActionPlan | undefined> {
  const store = await getPlanStore();
  const record = await store.get(`plan:${id}`);
  return record as ActionPlan | undefined;
}

/**
 * List all cached action plans (metadata only — full objects returned).
 * Sorted by updatedAt descending (most recent first).
 */
export async function listCachedPlans(): Promise<ActionPlan[]> {
  const store = await getPlanStore();
  const allKeys = await store.keys();
  const planKeys = allKeys.filter((k) => k.startsWith('plan:'));

  const plans = await Promise.all(
    planKeys.map(async (key) => {
      const raw = await store.get(key);
      return raw as ActionPlan;
    })
  );

  return plans
    .filter(Boolean)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/**
 * Remove plans older than maxAgeDays.
 * Pass `now` explicitly for deterministic testing.
 */
export async function clearExpired(
  maxAgeDays = 30,
  now: Date = new Date()
): Promise<number> {
  const store = await getPlanStore();
  const allKeys = await store.keys();
  const planKeys = allKeys.filter((k) => k.startsWith('plan:'));

  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - maxAgeDays);

  let removed = 0;
  await Promise.all(
    planKeys.map(async (key) => {
      const raw = (await store.get(key)) as ActionPlan | undefined;
      if (!raw) return;
      const updated = new Date(raw.updatedAt);
      if (updated < cutoff) {
        await store.del(key);
        removed++;
      }
    })
  );

  return removed;
}

// ---------------------------------------------------------------------------
// Public API — Sync Queue
// ---------------------------------------------------------------------------

const SYNC_QUEUE_KEY = 'sync:queue';

/**
 * Return all pending sync operations.
 */
export async function getSyncQueue(): Promise<SyncOp[]> {
  const store = await getSyncStore();
  const raw = await store.get(SYNC_QUEUE_KEY);
  if (!Array.isArray(raw)) return [];
  return raw as SyncOp[];
}

/**
 * Add an operation to the sync queue.
 * Generates a unique id and timestamps the op.
 */
export async function enqueueSync(
  op: SyncOpKind,
  payload: unknown
): Promise<SyncOp> {
  const store = await getSyncStore();
  const queue = await getSyncQueue();

  const entry: SyncOp = {
    id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    op,
    payload,
    createdAt: new Date().toISOString(),
  };

  queue.push(entry);
  await store.set(SYNC_QUEUE_KEY, queue);
  return entry;
}

/**
 * Drain the sync queue by calling onlineCallback for each op.
 * Ops that succeed are removed; ops that throw remain in the queue.
 * Returns the number of successfully synced ops.
 */
export async function drainSyncQueue(
  onlineCallback: (op: SyncOp) => Promise<void>
): Promise<number> {
  const store = await getSyncStore();
  const queue = await getSyncQueue();

  if (queue.length === 0) return 0;

  const remaining: SyncOp[] = [];
  let synced = 0;

  for (const op of queue) {
    try {
      await onlineCallback(op);
      synced++;
    } catch {
      remaining.push(op);
    }
  }

  await store.set(SYNC_QUEUE_KEY, remaining);
  return synced;
}