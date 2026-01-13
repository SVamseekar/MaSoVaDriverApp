/**
 * Notification Service - React Native
 * Handles local notifications for delivery updates
 */

import notifee, {
  AndroidImportance,
  AndroidVisibility,
  EventType,
  Event,
} from '@notifee/react-native';
import { Platform, PermissionsAndroid } from 'react-native';

export interface NotificationData {
  orderId?: string;
  customerId?: string;
  action?: string;
}

class NotificationService {
  private channelId = 'masova-driver-channel';
  private isInitialized = false;

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Request notification permission
    await this.requestPermission();

    // Create notification channel (Android)
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: this.channelId,
        name: 'Delivery Updates',
        description: 'Notifications for new deliveries and updates',
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        sound: 'default',
        vibration: true,
        vibrationPattern: [300, 500],
      });
    }

    // Handle foreground events
    notifee.onForegroundEvent(async ({ type, detail }: Event) => {
      switch (type) {
        case EventType.DISMISSED:
          console.log('User dismissed notification', detail.notification);
          break;
        case EventType.PRESS:
          console.log('User pressed notification', detail.notification);
          // Handle navigation based on notification data
          if (detail.notification?.data?.orderId) {
            // Navigate to order details
            console.log('Navigate to order:', detail.notification.data.orderId);
          }
          break;
      }
    });

    // Handle background events
    notifee.onBackgroundEvent(async ({ type, detail }: Event) => {
      if (type === EventType.PRESS) {
        console.log('Background notification pressed', detail.notification);
      }
    });

    this.isInitialized = true;
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true; // Android < 13 doesn't require runtime permission
    }

    // iOS
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus >= 1; // 1 = authorized
  }

  /**
   * Show a local notification
   */
  async showNotification(
    title: string,
    body: string,
    data?: NotificationData
  ): Promise<string> {
    await this.initialize();

    const notificationId = await notifee.displayNotification({
      title,
      body,
      data: data as any,
      android: {
        channelId: this.channelId,
        importance: AndroidImportance.HIGH,
        pressAction: {
          id: 'default',
        },
        sound: 'default',
        vibrationPattern: [300, 500],
        smallIcon: 'ic_notification',
        color: '#4CAF50',
      },
      ios: {
        sound: 'default',
        criticalVolume: 1.0,
      },
    });

    return notificationId;
  }

  /**
   * Show notification for new delivery assignment
   */
  async notifyNewDelivery(
    orderNumber: string,
    customerName: string,
    address: string,
    orderId: string
  ): Promise<void> {
    await this.showNotification(
      'New Delivery Assignment',
      `Order #${orderNumber} for ${customerName}\n📍 ${address}`,
      { orderId, action: 'new_delivery' }
    );

    // Play sound and vibrate
    if (Platform.OS === 'android') {
      await notifee.displayNotification({
        title: '🚗 New Delivery Assignment',
        body: `Order #${orderNumber} for ${customerName}`,
        android: {
          channelId: this.channelId,
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [300, 500, 300, 500],
          actions: [
            {
              title: 'View Details',
              pressAction: { id: 'view_details' },
            },
            {
              title: 'Navigate',
              pressAction: { id: 'navigate' },
            },
          ],
        },
      });
    }
  }

  /**
   * Show notification for delivery status update
   */
  async notifyDeliveryUpdate(
    orderNumber: string,
    status: string,
    orderId: string
  ): Promise<void> {
    const statusMessages: { [key: string]: string } = {
      PICKED_UP: '✅ Order picked up',
      IN_TRANSIT: '🚗 On the way to customer',
      DELIVERED: '🎉 Delivery completed',
      CANCELLED: '❌ Delivery cancelled',
    };

    await this.showNotification(
      'Delivery Update',
      `Order #${orderNumber}: ${statusMessages[status] || status}`,
      { orderId, action: 'status_update' }
    );
  }

  /**
   * Show notification for customer message
   */
  async notifyCustomerMessage(
    orderNumber: string,
    customerName: string,
    message: string,
    orderId: string
  ): Promise<void> {
    await this.showNotification(
      `Message from ${customerName}`,
      `Order #${orderNumber}: ${message}`,
      { orderId, action: 'customer_message' }
    );
  }

  /**
   * Cancel a notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await notifee.cancelNotification(notificationId);
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await notifee.cancelAllNotifications();
  }

  /**
   * Get delivered notifications
   */
  async getDeliveredNotifications(): Promise<any[]> {
    return await notifee.getDisplayedNotifications();
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    const settings = await notifee.getNotificationSettings();
    return settings.authorizationStatus >= 1;
  }
}

export const notificationService = new NotificationService();
