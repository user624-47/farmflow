import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Crop, CropForm } from '@/types/crop';

interface FarmFlowDB extends DBSchema {
  crops: {
    key: string;
    value: Crop & { syncStatus: 'synced' | 'pending' | 'failed' };
    indexes: { 'by-syncStatus': 'synced' | 'pending' | 'failed' };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      action: 'create' | 'update' | 'delete';
      data: CropForm | string; // string for delete (id)
      timestamp: number;
      retryCount: number;
    };
  };
}

class OfflineService {
  private dbPromise: Promise<IDBPDatabase<FarmFlowDB>>;

  constructor() {
    this.dbPromise = this.initDB();
    this.setupSync();
  }

  private async initDB() {
    return openDB<FarmFlowDB>('farmflow-offline', 1, {
      upgrade(db) {
        // Create crops store
        const cropStore = db.createObjectStore('crops', {
          keyPath: 'id',
        });
        cropStore.createIndex('by-syncStatus', 'syncStatus');

        // Create sync queue
        db.createObjectStore('syncQueue', {
          keyPath: 'id',
        });
      },
    });
  }

  // Add crop to local DB and sync queue
  async createCrop(cropData: CropForm): Promise<string> {
    const db = await this.dbPromise;
    const id = crypto.randomUUID();
    const timestamp = Date.now();
    
    const crop: Crop & { syncStatus: 'pending' } = {
      ...cropData,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      syncStatus: 'pending',
    };

    const tx = db.transaction(['crops', 'syncQueue'], 'readwrite');
    await Promise.all([
      tx.objectStore('crops').put(crop),
      tx.objectStore('syncQueue').add({
        id: `create-${timestamp}-${id}`,
        action: 'create',
        data: cropData,
        timestamp,
        retryCount: 0,
      }),
      tx.done,
    ]);

    return id;
  }

  // Update crop in local DB and add to sync queue
  async updateCrop(id: string, updates: Partial<CropForm>): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(['crops', 'syncQueue'], 'readwrite');
    const crop = await tx.objectStore('crops').get(id);
    
    if (!crop) {
      throw new Error('Crop not found');
    }

    const updatedCrop = {
      ...crop,
      ...updates,
      updated_at: new Date().toISOString(),
      syncStatus: 'pending' as const,
    };

    await Promise.all([
      tx.objectStore('crops').put(updatedCrop),
      tx.objectStore('syncQueue').add({
        id: `update-${Date.now()}-${id}`,
        action: 'update',
        data: updates,
        timestamp: Date.now(),
        retryCount: 0,
      }),
      tx.done,
    ]);
  }

  // Delete crop from local DB and add to sync queue
  async deleteCrop(id: string): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(['crops', 'syncQueue'], 'readwrite');
    
    await Promise.all([
      tx.objectStore('crops').delete(id),
      tx.objectStore('syncQueue').add({
        id: `delete-${Date.now()}-${id}`,
        action: 'delete',
        data: id,
        timestamp: Date.now(),
        retryCount: 0,
      }),
      tx.done,
    ]);
  }

  // Get all crops from local DB
  async getCrops(): Promise<Crop[]> {
    const db = await this.dbPromise;
    const crops = await db.getAll('crops');
    return crops.map(({ syncStatus, ...crop }) => crop);
  }

  // Get a single crop from local DB
  async getCrop(id: string): Promise<Crop | undefined> {
    const db = await this.dbPromise;
    const crop = await db.get('crops', id);
    if (!crop) return undefined;
    
    const { syncStatus, ...rest } = crop;
    return rest;
  }

  // Process sync queue when online
  private async setupSync() {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const registration = await navigator.serviceWorker.registration;
      
      // Listen for online event
      window.addEventListener('online', async () => {
        try {
          await this.syncWithServer();
        } catch (error) {
          console.error('Sync failed:', error);
        }
      });

      // Register sync event in service worker
      registration.sync.register('sync-crops');
    }
  }

  // Sync local changes with server
  private async syncWithServer(): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction('syncQueue', 'readwrite');
    const queue = await tx.objectStore('syncQueue').getAll();
    
    for (const item of queue) {
      try {
        // TODO: Implement actual API calls to sync with server
        // This is a placeholder for the actual implementation
        console.log(`Syncing ${item.action} for crop`, item.data);
        
        // If sync is successful, remove from queue
        await tx.objectStore('syncQueue').delete(item.id);
      } catch (error) {
        console.error(`Failed to sync ${item.action} for crop:`, error);
        
        // Update retry count and back off
        item.retryCount += 1;
        if (item.retryCount < 3) {
          // Exponential backoff: 5s, 25s, 2m5s
          const delay = Math.min(5 * Math.pow(5, item.retryCount - 1), 300) * 1000;
          setTimeout(() => this.syncWithServer(), delay);
        } else {
          // Mark as failed after max retries
          await tx.objectStore('crops').put({
            ...(await tx.objectStore('crops').get(item.id)),
            syncStatus: 'failed',
          });
          await tx.objectStore('syncQueue').delete(item.id);
        }
      }
    }
  }
}

export const offlineService = new OfflineService();

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful');
      })
      .catch(error => {
        console.error('ServiceWorker registration failed:', error);
      });
  });
}
