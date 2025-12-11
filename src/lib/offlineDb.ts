import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  currency: string;
  billing_cycle: string;
  next_billing_date: string;
  category: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface PendingChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  subscriptionId: string;
  data: Partial<Subscription>;
  timestamp: number;
}

interface OfflineDBSchema extends DBSchema {
  subscriptions: {
    key: string;
    value: Subscription;
    indexes: { 'by-user': string; 'by-updated': string };
  };
  pendingChanges: {
    key: string;
    value: PendingChange;
    indexes: { 'by-timestamp': number; 'by-type': string };
  };
  metadata: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'subscription-tracker-offline';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<OfflineDBSchema> | null = null;

export async function getDb(): Promise<IDBPDatabase<OfflineDBSchema>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<OfflineDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Subscriptions store
      if (!db.objectStoreNames.contains('subscriptions')) {
        const subscriptionStore = db.createObjectStore('subscriptions', { keyPath: 'id' });
        subscriptionStore.createIndex('by-user', 'user_id');
        subscriptionStore.createIndex('by-updated', 'updated_at');
      }

      // Pending changes store
      if (!db.objectStoreNames.contains('pendingChanges')) {
        const pendingStore = db.createObjectStore('pendingChanges', { keyPath: 'id' });
        pendingStore.createIndex('by-timestamp', 'timestamp');
        pendingStore.createIndex('by-type', 'type');
      }

      // Metadata store
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata');
      }
    },
  });

  return dbInstance;
}

export async function closeDb(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
