import { getDb, Subscription, PendingChange } from './offlineDb';

const LAST_SYNC_KEY = 'lastSyncTimestamp';

// Cache subscriptions to IndexedDB
export async function cacheSubscriptions(subscriptions: Subscription[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('subscriptions', 'readwrite');
  
  // Clear existing subscriptions and add new ones
  await tx.store.clear();
  
  for (const subscription of subscriptions) {
    await tx.store.put(subscription);
  }
  
  await tx.done;
  await setLastSyncTimestamp(Date.now());
}

// Get cached subscriptions from IndexedDB
export async function getCachedSubscriptions(): Promise<Subscription[] | null> {
  try {
    const db = await getDb();
    const subscriptions = await db.getAll('subscriptions');
    return subscriptions.length > 0 ? subscriptions : null;
  } catch (error) {
    console.error('Error getting cached subscriptions:', error);
    return null;
  }
}

// Get last sync timestamp
export async function getLastSyncTimestamp(): Promise<number | null> {
  try {
    const db = await getDb();
    const timestamp = await db.get('metadata', LAST_SYNC_KEY);
    return timestamp ?? null;
  } catch (error) {
    console.error('Error getting last sync timestamp:', error);
    return null;
  }
}

// Set last sync timestamp
export async function setLastSyncTimestamp(timestamp: number): Promise<void> {
  const db = await getDb();
  await db.put('metadata', timestamp, LAST_SYNC_KEY);
}

// Add a pending change
export async function addPendingChange(change: Omit<PendingChange, 'id' | 'timestamp'>): Promise<void> {
  const db = await getDb();
  const pendingChange: PendingChange = {
    ...change,
    id: `${change.type}-${change.subscriptionId}-${Date.now()}`,
    timestamp: Date.now(),
  };
  await db.put('pendingChanges', pendingChange);
}

// Get all pending changes
export async function getPendingChanges(): Promise<PendingChange[]> {
  const db = await getDb();
  return db.getAllFromIndex('pendingChanges', 'by-timestamp');
}

// Check if there are pending changes
export async function hasPendingChanges(): Promise<boolean> {
  const changes = await getPendingChanges();
  return changes.length > 0;
}

// Clear all pending changes
export async function clearPendingChanges(): Promise<void> {
  const db = await getDb();
  await db.clear('pendingChanges');
}

// Clear a specific pending change
export async function clearPendingChange(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('pendingChanges', id);
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: Error[];
}

// Sync pending changes with the server
export async function syncPendingChanges(
  syncFn: (change: PendingChange) => Promise<boolean>
): Promise<SyncResult> {
  const changes = await getPendingChanges();
  const result: SyncResult = {
    success: true,
    synced: 0,
    failed: 0,
    errors: [],
  };

  for (const change of changes) {
    try {
      const success = await syncFn(change);
      if (success) {
        await clearPendingChange(change.id);
        result.synced++;
      } else {
        result.failed++;
        result.success = false;
      }
    } catch (error) {
      result.failed++;
      result.success = false;
      result.errors.push(error instanceof Error ? error : new Error(String(error)));
    }
  }

  return result;
}

// Format last sync time for display
export function formatLastSync(timestamp: number | null): string {
  if (!timestamp) return 'Never synced';
  
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
  
  return new Date(timestamp).toLocaleDateString();
}
