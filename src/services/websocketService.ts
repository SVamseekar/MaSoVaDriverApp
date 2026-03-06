import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Platform } from 'react-native';
import API_CONFIG from '../config/api.config';
import { notificationService } from './notificationService';

export interface DriverLocation {
  driverId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

export interface OrderTrackingUpdate {
  orderId: string;
  orderNumber: string;
  status: string;
  driverName?: string;
  driverPhone?: string;
  driverLocation?: {
    latitude: number;
    longitude: number;
  };
  estimatedDeliveryTime?: string;
  timestamp: string;
}

export interface NewOrderAssignment {
  orderId: string;
  orderNumber: string;
  customerName: string;
  deliveryAddress: string;
  totalAmount: number;
  items: Array<{ name: string; quantity: number }>;
  timestamp: string;
}

type LocationCallback = (location: DriverLocation) => void;
type OrderTrackingCallback = (update: OrderTrackingUpdate) => void;
type NewOrderCallback = (order: NewOrderAssignment) => void;

class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, any> = new Map();
  private locationCallbacks: Map<string, LocationCallback[]> = new Map();
  private orderTrackingCallbacks: Map<string, OrderTrackingCallback[]> = new Map();
  private newOrderCallbacks: Map<string, NewOrderCallback[]> = new Map();

  // Connection monitoring
  private disconnectTime: number | null = null;
  private disconnectWarningTimer: ReturnType<typeof setTimeout> | null = null;
  private disconnectLogoutTimer: ReturnType<typeof setTimeout> | null = null;
  private onConnectionLost?: () => void;
  private onAutoLogout?: () => void;

  /**
   * Set callbacks for connection loss events
   */
  setConnectionLostCallbacks(
    onConnectionLost?: () => void,
    onAutoLogout?: () => void
  ): void {
    this.onConnectionLost = onConnectionLost;
    this.onAutoLogout = onAutoLogout;
  }

  /**
   * Handle WebSocket disconnection
   */
  private handleDisconnect(): void {
    console.warn('[WebSocket] Connection lost');

    this.disconnectTime = Date.now();
    this.clearDisconnectTimers();

    // Show warning after 30 seconds of disconnection
    this.disconnectWarningTimer = setTimeout(() => {
      console.warn('[WebSocket] Prolonged disconnection detected (30s)');
      if (this.onConnectionLost) {
        this.onConnectionLost();
      }
    }, 30000);

    // Auto-logout after 60 seconds of disconnection
    this.disconnectLogoutTimer = setTimeout(() => {
      console.error('[WebSocket] Connection lost for 60s - initiating auto-logout');
      if (this.onAutoLogout) {
        this.onAutoLogout();
      }
    }, 60000);
  }

  /**
   * Handle WebSocket reconnection
   */
  private handleReconnect(): void {
    console.log('[WebSocket] Connection restored');
    this.clearDisconnectTimers();
    this.disconnectTime = null;
  }

  /**
   * Clear disconnect timers
   */
  private clearDisconnectTimers(): void {
    if (this.disconnectWarningTimer) {
      clearTimeout(this.disconnectWarningTimer);
      this.disconnectWarningTimer = null;
    }

    if (this.disconnectLogoutTimer) {
      clearTimeout(this.disconnectLogoutTimer);
      this.disconnectLogoutTimer = null;
    }
  }

  /**
   * Get WebSocket URL based on platform
   */
  private getWebSocketUrl(): string {
    // Use the WS_URL from config (already handles dev/prod)
    return API_CONFIG.WS_URL;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = this.getWebSocketUrl();
        const socket = new SockJS(`${wsUrl}/delivery`);

        this.client = new Client({
          webSocketFactory: () => socket as any,
          debug: (str) => {
            if (__DEV__) {
              console.log('STOMP Debug:', str);
            }
          },
          reconnectDelay: 5000,
          forceBinaryWSFrames: false,
          splitLargeFrames: true,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
          onConnect: () => {
            console.log('WebSocket Connected');
            this.handleReconnect();
            resolve();
          },
          onStompError: (frame) => {
            console.error('STOMP Error:', frame);
            reject(new Error('WebSocket connection failed'));
          },
          onDisconnect: () => {
            this.handleDisconnect();
          },
        });

        this.client.activate();
      } catch (error) {
        console.error('WebSocket Connection Error:', error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.clearDisconnectTimers();

    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this.subscriptions.clear();
    this.locationCallbacks.clear();
    this.orderTrackingCallbacks.clear();
    this.newOrderCallbacks.clear();
  }

  subscribeToDriverLocation(driverId: string, callback: LocationCallback): () => void {
    if (!this.client || !this.client.connected) {
      console.error('WebSocket not connected');
      return () => {};
    }

    const topic = `/topic/driver/${driverId}/location`;

    // Add callback to list
    if (!this.locationCallbacks.has(driverId)) {
      this.locationCallbacks.set(driverId, []);
    }
    this.locationCallbacks.get(driverId)!.push(callback);

    // Subscribe if not already subscribed
    if (!this.subscriptions.has(topic)) {
      const subscription = this.client.subscribe(topic, (message) => {
        try {
          const location: DriverLocation = JSON.parse(message.body);
          const callbacks = this.locationCallbacks.get(driverId) || [];
          callbacks.forEach(cb => cb(location));
        } catch (error) {
          console.error('Error parsing location update:', error);
        }
      });
      this.subscriptions.set(topic, subscription);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.locationCallbacks.get(driverId) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }

      if (callbacks.length === 0) {
        const subscription = this.subscriptions.get(topic);
        if (subscription) {
          subscription.unsubscribe();
          this.subscriptions.delete(topic);
        }
        this.locationCallbacks.delete(driverId);
      }
    };
  }

  sendLocationUpdate(driverId: string, location: Omit<DriverLocation, 'driverId'>): void {
    if (!this.client || !this.client.connected) {
      console.error('WebSocket not connected');
      return;
    }

    this.client.publish({
      destination: '/app/location-update',
      body: JSON.stringify({
        driverId,
        ...location,
      }),
    });
  }

  subscribeToOrderTracking(orderId: string, callback: OrderTrackingCallback): () => void {
    if (!this.client || !this.client.connected) {
      console.error('WebSocket not connected');
      return () => {};
    }

    const topic = `/topic/order/${orderId}/tracking`;

    // Add callback to list
    if (!this.orderTrackingCallbacks.has(orderId)) {
      this.orderTrackingCallbacks.set(orderId, []);
    }
    this.orderTrackingCallbacks.get(orderId)!.push(callback);

    // Subscribe if not already subscribed
    if (!this.subscriptions.has(topic)) {
      const subscription = this.client.subscribe(topic, (message) => {
        try {
          const update: OrderTrackingUpdate = JSON.parse(message.body);
          console.log('Order tracking update received:', update.orderNumber, update.status);
          const callbacks = this.orderTrackingCallbacks.get(orderId) || [];
          callbacks.forEach(cb => cb(update));
        } catch (error) {
          console.error('Error parsing order tracking update:', error);
        }
      });
      this.subscriptions.set(topic, subscription);
      console.log(`Subscribed to order tracking: ${topic}`);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.orderTrackingCallbacks.get(orderId) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }

      if (callbacks.length === 0) {
        const subscription = this.subscriptions.get(topic);
        if (subscription) {
          subscription.unsubscribe();
          this.subscriptions.delete(topic);
        }
        this.orderTrackingCallbacks.delete(orderId);
        console.log(`Unsubscribed from order tracking: ${topic}`);
      }
    };
  }

  isConnected(): boolean {
    return this.client?.connected || false;
  }

  /**
   * Subscribe to new order assignments for a specific driver
   * Automatically shows push notifications when new orders are assigned
   */
  subscribeToDriverOrders(driverId: string, callback: NewOrderCallback): () => void {
    if (!this.client || !this.client.connected) {
      console.error('WebSocket not connected');
      return () => {};
    }

    const topic = `/topic/driver/${driverId}/orders`;

    // Add callback to list
    if (!this.newOrderCallbacks.has(driverId)) {
      this.newOrderCallbacks.set(driverId, []);
    }
    this.newOrderCallbacks.get(driverId)!.push(callback);

    // Subscribe if not already subscribed
    if (!this.subscriptions.has(topic)) {
      const subscription = this.client.subscribe(topic, async (message) => {
        try {
          const newOrder: NewOrderAssignment = JSON.parse(message.body);
          console.log('New order assignment received:', newOrder.orderNumber);

          // Show push notification
          await notificationService.notifyNewDelivery(
            newOrder.orderNumber,
            newOrder.customerName,
            newOrder.deliveryAddress,
            newOrder.orderId
          );

          // Trigger callbacks
          const callbacks = this.newOrderCallbacks.get(driverId) || [];
          callbacks.forEach(cb => cb(newOrder));
        } catch (error) {
          console.error('Error parsing new order assignment:', error);
        }
      });
      this.subscriptions.set(topic, subscription);
      console.log(`Subscribed to driver orders: ${topic}`);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.newOrderCallbacks.get(driverId) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }

      if (callbacks.length === 0) {
        const subscription = this.subscriptions.get(topic);
        if (subscription) {
          subscription.unsubscribe();
          this.subscriptions.delete(topic);
        }
        this.newOrderCallbacks.delete(driverId);
        console.log(`Unsubscribed from driver orders: ${topic}`);
      }
    };
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
