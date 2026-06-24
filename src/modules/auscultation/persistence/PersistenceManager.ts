import { supabaseClient } from '@/services/supabase';
import { AuscultationSession } from '../types';

// Tipo extendido para los registros almacenados en IndexedDB.
// Los campos synced, supabaseId y localId son metadatos de persistencia local,
// no parte del esquema de Supabase.
type IndexedDBRecord = AuscultationSession & {
  localId?: number;
  synced: boolean;
  supabaseId?: string;
};

const DB_NAME = 'AuscultationDB';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';

// Helper to open IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB is only available in the browser.'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'localId', autoIncrement: true });
        store.createIndex('synced', 'synced', { unique: false });
      }
    };
  });
}

export class PersistenceManager {
  private static isSyncing = false;

  /**
   * Saves a session to the hybrid persistence layer.
   * Attempts to write to Supabase. On success, stores locally as synced.
   * On failure (network/offline), stores locally as unsynced for later sync.
   */
  static async saveSession(session: Omit<AuscultationSession, 'id'>): Promise<void> {
    const localSession = {
      ...session,
      created_at: new Date().toISOString(),
      synced: false,
    };

    let supabaseSuccess = false;
    let syncedSessionId: string | undefined;

    // 1. Try to save to Supabase if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        // Obtenemos el usuario autenticado actual si está logueado
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        const { data, error } = await supabaseClient
          .from('auscultation_sessions')
          .insert({
            user_id: user?.id || null,
            focus_id: session.focus_id,
            layer: session.layer,
            diagnosis: session.diagnosis,
            is_correct: session.is_correct,
            score: session.score,
            metadata: session.metadata || {},
          })
          .select('id')
          .single();

        if (!error && data) {
          supabaseSuccess = true;
          syncedSessionId = data.id;
          console.log('[PersistenceManager] Session synced to Supabase successfully:', syncedSessionId);
        } else {
          console.warn('[PersistenceManager] Supabase error (table may not exist yet):', error);
        }
      } catch (err) {
        console.error('[PersistenceManager] Failed to insert to Supabase:', err);
      }
    }

    // 2. Save locally to IndexedDB
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const record = {
        ...localSession,
        synced: supabaseSuccess,
        supabaseId: syncedSessionId,
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.add(record);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      console.log('[PersistenceManager] Session saved locally in IndexedDB. Synced =', supabaseSuccess);
    } catch (dbErr) {
      console.error('[PersistenceManager] Failed to write to IndexedDB, falling back to localStorage:', dbErr);
      // Fallback extreme: LocalStorage
      try {
        const key = 'auscultation_sessions_fallback';
        const raw = localStorage.getItem(key) || '[]';
        const list = JSON.parse(raw);
        list.push({ ...localSession, synced: supabaseSuccess });
        localStorage.setItem(key, JSON.stringify(list));
      } catch (lsErr) {
        console.error('[PersistenceManager] LocalStorage fallback also failed:', lsErr);
      }
    }
  }

  /**
   * Syncs all unsynced sessions to Supabase.
   */
  static async syncOfflineSessions(): Promise<void> {
    if (this.isSyncing) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    this.isSyncing = true;
    console.log('[PersistenceManager] Starting offline sync...');

    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // Get all unsynced sessions
      const unsynced: IndexedDBRecord[] = [];
      await new Promise<void>((resolve, reject) => {
        const request = store.openCursor();
        request.onsuccess = (event: Event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            if (!cursor.value.synced) {
              unsynced.push(cursor.value as IndexedDBRecord);
            }
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });

      if (unsynced.length === 0) {
        console.log('[PersistenceManager] No unsynced sessions found.');
        this.isSyncing = false;
        return;
      }

      console.log(`[PersistenceManager] Found ${unsynced.length} unsynced sessions. Syncing...`);
      const { data: { user } } = await supabaseClient.auth.getUser();

      const syncedRecords: IndexedDBRecord[] = [];

      for (const record of unsynced) {
        try {
          const { data, error } = await supabaseClient
            .from('auscultation_sessions')
            .insert({
              user_id: user?.id || null,
              focus_id: record.focus_id,
              layer: record.layer,
              diagnosis: record.diagnosis,
              is_correct: record.is_correct,
              score: record.score,
              metadata: record.metadata || {},
              created_at: record.created_at,
            })
            .select('id')
            .single();

          if (!error && data) {
            record.synced = true;
            record.supabaseId = data.id;
            syncedRecords.push(record);
          } else if (error) {
            console.warn('[PersistenceManager] Individual record sync error:', error);
          }
        } catch (syncErr) {
          console.error('[PersistenceManager] Error syncing individual record:', syncErr);
        }
      }

      if (syncedRecords.length > 0) {
        const updateTransaction = db.transaction(STORE_NAME, 'readwrite');
        const updateStore = updateTransaction.objectStore(STORE_NAME);

        await Promise.all(
          syncedRecords.map((record) => {
            return new Promise<void>((resolve, reject) => {
              const req = updateStore.put(record);
              req.onsuccess = () => resolve();
              req.onerror = () => reject(req.error);
            });
          })
        );
        console.log(`[PersistenceManager] Successfully batch-updated ${syncedRecords.length} records to synced in IndexedDB.`);
      }

    } catch (err) {
      console.error('[PersistenceManager] Global sync process failed:', err);
    } finally {
      this.isSyncing = false;
      console.log('[PersistenceManager] Offline sync ended.');
    }
  }

  /**
   * Registers automatic sync listeners.
   */
  static registerSyncListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      console.log('[PersistenceManager] Network connection restored. Triggering sync.');
      this.syncOfflineSessions();
    });

    // Run a sync on start
    setTimeout(() => this.syncOfflineSessions(), 3000);
  }
}
