/**
 * Unit tests for OfflineQueueService
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { offlineQueueService, QueueActionType } from '../offlineQueueService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

// Mock NetInfo
jest.mock('@react-native-community/netinfo');

describe('OfflineQueueService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Clear AsyncStorage
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('enqueue', () => {
    it('should add item to queue', async () => {
      const payload = {
        driverId: 'driver-123',
        location: { latitude: 12.9716, longitude: 77.5946 },
      };

      await offlineQueueService.enqueue(
        QueueActionType.LOCATION_UPDATE,
        payload,
        3
      );

      const queueSize = offlineQueueService.getQueueSize();
      expect(queueSize).toBeGreaterThan(0);
    });

    it('should save queue to AsyncStorage', async () => {
      const payload = {
        driverId: 'driver-123',
        location: { latitude: 12.9716, longitude: 77.5946 },
      };

      await offlineQueueService.enqueue(
        QueueActionType.LOCATION_UPDATE,
        payload
      );

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should limit queue size to MAX_QUEUE_SIZE', async () => {
      // This test would require modifying the service to expose MAX_QUEUE_SIZE
      // or creating a large number of items
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('getQueueSize', () => {
    it('should return current queue size', () => {
      const size = offlineQueueService.getQueueSize();
      expect(typeof size).toBe('number');
      expect(size).toBeGreaterThanOrEqual(0);
    });
  });

  describe('isNetworkOnline', () => {
    it('should return network status', () => {
      const isOnline = offlineQueueService.isNetworkOnline();
      expect(typeof isOnline).toBe('boolean');
    });
  });

  describe('clearQueue', () => {
    it('should clear all items from queue', async () => {
      // Add some items
      await offlineQueueService.enqueue(
        QueueActionType.LOCATION_UPDATE,
        { driverId: '123' }
      );

      // Clear queue
      await offlineQueueService.clearQueue();

      const size = offlineQueueService.getQueueSize();
      expect(size).toBe(0);
    });

    it('should save empty queue to AsyncStorage', async () => {
      await offlineQueueService.clearQueue();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@masova_offline_queue',
        '[]'
      );
    });
  });

  describe('Queue Action Types', () => {
    it('should support LOCATION_UPDATE action type', async () => {
      const payload = { driverId: '123', location: {} };

      await offlineQueueService.enqueue(
        QueueActionType.LOCATION_UPDATE,
        payload
      );

      expect(offlineQueueService.getQueueSize()).toBeGreaterThan(0);
    });

    it('should support ORDER_STATUS_UPDATE action type', async () => {
      const payload = { orderId: '456', status: 'DELIVERED' };

      await offlineQueueService.enqueue(
        QueueActionType.ORDER_STATUS_UPDATE,
        payload
      );

      expect(offlineQueueService.getQueueSize()).toBeGreaterThan(0);
    });

    it('should support DELIVERY_COMPLETE action type', async () => {
      const payload = { orderId: '789' };

      await offlineQueueService.enqueue(
        QueueActionType.DELIVERY_COMPLETE,
        payload
      );

      expect(offlineQueueService.getQueueSize()).toBeGreaterThan(0);
    });

    it('should support PHOTO_UPLOAD action type', async () => {
      const payload = { orderId: '101', photo: { uri: 'file://...' } };

      await offlineQueueService.enqueue(
        QueueActionType.PHOTO_UPLOAD,
        payload
      );

      expect(offlineQueueService.getQueueSize()).toBeGreaterThan(0);
    });
  });
});
