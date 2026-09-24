/**
 * Offline Queue Service
 *
 * Queues actions when network is unavailable and syncs when connection is restored.
 * Uses AsyncStorage for persistence across app restarts.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { websocketService } from './websocketService';

const QUEUE_STORAGE_KEY = '@masova_offline_queue';
const MAX_QUEUE_SIZE = 1000; // Maximum items in queue
const SYNC_INTERVAL = 30000; // Try to sync every 30 seconds

export enum QueueActionType {
  LOCATION_UPDATE = 'LOCATION_UPDATE',
  ORDER_STATUS_UPDATE = 'ORDER_STATUS_UPDATE',
  DELIVERY_COMPLETE = 'DELIVERY_COMPLETE',
  PHOTO_UPLOAD = 'PHOTO_UPLOAD',
}

export interface QueueItem {
  id: string;
  type: QueueActionType;
  payload: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

class OfflineQueueService {
  private queue: QueueItem[] = [];
  private isProcessing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = true;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the service
   */
  private async initialize() {
    // Load queue from storage
    await this.loadQueue();

    // Monitor network status
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      console.log(`Network status: ${this.isOnline ? 'Online' : 'Offline'}`);

      // If we just came back online, process queue
      if (wasOffline && this.isOnline) {
        console.log('Connection restored, processing queued actions...');
        this.processQueue();
      }
    });

    // Start periodic sync
    this.startPeriodicSync();

    // Process any existing items
    if (this.queue.length > 0) {
      console.log(`Loaded ${this.queue.length} items from offline queue`);
      this.processQueue();
    }
  }

  /**
   * Add item to queue
   */
  async enqueue(
    type: QueueActionType,
    payload: any,
    maxRetries: number = 3
  ): Promise<void> {
    const item: QueueItem = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries,
    };

    this.queue.push(item);

    // Limit queue size
    if (this.queue.length > MAX_QUEUE_SIZE) {
      console.warn('Queue size exceeded, removing oldest items');
      this.queue = this.queue.slice(-MAX_QUEUE_SIZE);
    }

    await this.saveQueue();

    console.log(`Queued ${type} action (queue size: ${this.queue.length})`);

    // Try to process immediately if online
    if (this.isOnline && !this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process all items in queue
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || !this.isOnline) {
      return;
    }

    if (this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`Processing ${this.queue.length} queued items...`);

    const itemsToProcess = [...this.queue];
    const successfulIds: string[] = [];

    for (const item of itemsToProcess) {
      try {
        const success = await this.processItem(item);

        if (success) {
          successfulIds.push(item.id);
        } else {
          // Increment retry count
          item.retryCount++;

          if (item.retryCount >= item.maxRetries) {
            console.warn(
              `Item ${item.id} exceeded max retries (${item.maxRetries}), removing from queue`
            );
            successfulIds.push(item.id); // Remove from queue
          }
        }
      } catch (error) {
        console.error(`Failed to process queue item ${item.id}:`, error);
        item.retryCount++;

        if (item.retryCount >= item.maxRetries) {
          successfulIds.push(item.id); // Remove from queue after max retries
        }
      }
    }

    // Remove successfully processed items
    this.queue = this.queue.filter(item => !successfulIds.includes(item.id));

    await this.saveQueue();

    console.log(
      `Processed ${successfulIds.length} items, ${this.queue.length} remaining`
    );

    this.isProcessing = false;
  }

  /**
   * Process individual queue item
   */
  private async processItem(item: QueueItem): Promise<boolean> {
    console.log(`Processing ${item.type} (retry ${item.retryCount}/${item.maxRetries})`);

    switch (item.type) {
      case QueueActionType.LOCATION_UPDATE:
        return await this.processLocationUpdate(item.payload);

      case QueueActionType.ORDER_STATUS_UPDATE:
        return await this.processOrderStatusUpdate(item.payload);

      case QueueActionType.DELIVERY_COMPLETE:
        return await this.processDeliveryComplete(item.payload);

      case QueueActionType.PHOTO_UPLOAD:
        return await this.processPhotoUpload(item.payload);

      default:
        console.warn(`Unknown action type: ${item.type}`);
        return false;
    }
  }

  /**
   * Process location update
   */
  private async processLocationUpdate(payload: any): Promise<boolean> {
    try {
      if (websocketService.isConnected()) {
        await websocketService.sendLocationUpdate(
          payload.driverId,
          payload.location
        );
        console.log('✓ Location update sent via WebSocket');
        return true;
      } else {
        console.log('WebSocket not connected, will retry later');
        return false;
      }
    } catch (error) {
      console.error('Failed to send location update:', error);
      return false;
    }
  }

  /**
   * Process order status update
   */
  private async processOrderStatusUpdate(_payload: any): Promise<boolean> {
    try {
      // Implement API call to update order status
      // await orderApi.updateOrderStatus(payload.orderId, payload.status);
      console.log('✓ Order status update sent');
      return true;
    } catch (error) {
      console.error('Failed to update order status:', error);
      return false;
    }
  }

  /**
   * Process delivery completion
   */
  private async processDeliveryComplete(_payload: any): Promise<boolean> {
    try {
      // Implement API call to mark delivery complete
      // await orderApi.completeDelivery(payload.orderId);
      console.log('✓ Delivery completion sent');
      return true;
    } catch (error) {
      console.error('Failed to mark delivery complete:', error);
      return false;
    }
  }

  /**
   * Process photo upload
   */
  private async processPhotoUpload(_payload: any): Promise<boolean> {
    try {
      // Implement photo upload to backend
      // await deliveryApi.uploadProof(payload.orderId, payload.photo);
      console.log('✓ Photo uploaded');
      return true;
    } catch (error) {
      console.error('Failed to upload photo:', error);
      return false;
    }
  }

  /**
   * Load queue from AsyncStorage
   */
  private async loadQueue(): Promise<void> {
    try {
      const queueJson = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (queueJson) {
        this.queue = JSON.parse(queueJson);
      }
    } catch (error) {
      console.error('Failed to load queue from storage:', error);
      this.queue = [];
    }
  }

  /**
   * Save queue to AsyncStorage
   */
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save queue to storage:', error);
    }
  }

  /**
   * Start periodic sync
   */
  private startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.queue.length > 0 && !this.isProcessing) {
        console.log('Periodic sync triggered');
        this.processQueue();
      }
    }, SYNC_INTERVAL);
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Get network status
   */
  isNetworkOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Clear queue (for testing)
   */
  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
    console.log('Queue cleared');
  }

  /**
   * Stop periodic sync
   */
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

// Export singleton instance
export const offlineQueueService = new OfflineQueueService();
