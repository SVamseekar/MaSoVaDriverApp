/**
 * Background Location Service
 *
 * Provides interface to native background GPS tracking.
 * Works even when app is minimized or screen is locked.
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { BackgroundLocationModule } = NativeModules;

export interface BackgroundLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number;
  speed: number;
  bearing: number;
  timestamp: number;
}

export interface LocationError {
  error: string;
}

type LocationCallback = (location: BackgroundLocation) => void;
type ErrorCallback = (error: LocationError) => void;

class BackgroundLocationService {
  private eventEmitter: NativeEventEmitter | null = null;
  private locationListener: any = null;
  private errorListener: any = null;
  private isInitialized: boolean = false;

  constructor() {
    if (Platform.OS === 'android' && BackgroundLocationModule) {
      this.eventEmitter = new NativeEventEmitter(BackgroundLocationModule);
      this.isInitialized = true;
    }
  }

  /**
   * Start background location tracking
   * @param driverId - Unique driver identifier
   * @returns Promise with success status
   */
  async startTracking(driverId: string): Promise<{ success: boolean; message: string }> {
    if (!this.isInitialized) {
      throw new Error('Background location not available on this platform');
    }

    try {
      const result = await BackgroundLocationModule.startTracking(driverId);
      console.log('Background location tracking started:', result);
      return result;
    } catch (error) {
      console.error('Failed to start background tracking:', error);
      throw error;
    }
  }

  /**
   * Stop background location tracking
   * @returns Promise with success status
   */
  async stopTracking(): Promise<{ success: boolean; message: string }> {
    if (!this.isInitialized) {
      throw new Error('Background location not available on this platform');
    }

    try {
      const result = await BackgroundLocationModule.stopTracking();
      console.log('Background location tracking stopped:', result);
      return result;
    } catch (error) {
      console.error('Failed to stop background tracking:', error);
      throw error;
    }
  }

  /**
   * Check if background tracking is active
   * @returns Promise with tracking status
   */
  async isTracking(): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      return await BackgroundLocationModule.isTracking();
    } catch (error) {
      console.error('Failed to check tracking status:', error);
      return false;
    }
  }

  /**
   * Subscribe to location updates
   * @param callback - Function called on each location update
   * @returns Subscription object with remove() method
   */
  onLocationUpdate(callback: LocationCallback): { remove: () => void } {
    if (!this.isInitialized || !this.eventEmitter) {
      return { remove: () => {} };
    }

    this.locationListener = this.eventEmitter.addListener(
      'onLocationUpdate',
      (location: BackgroundLocation) => {
        callback(location);
      }
    );

    return {
      remove: () => {
        if (this.locationListener) {
          this.locationListener.remove();
          this.locationListener = null;
        }
      },
    };
  }

  /**
   * Subscribe to location errors
   * @param callback - Function called on location error
   * @returns Subscription object with remove() method
   */
  onLocationError(callback: ErrorCallback): { remove: () => void } {
    if (!this.isInitialized || !this.eventEmitter) {
      return { remove: () => {} };
    }

    this.errorListener = this.eventEmitter.addListener(
      'onLocationError',
      (error: LocationError) => {
        callback(error);
      }
    );

    return {
      remove: () => {
        if (this.errorListener) {
          this.errorListener.remove();
          this.errorListener = null;
        }
      },
    };
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    if (this.locationListener) {
      this.locationListener.remove();
      this.locationListener = null;
    }

    if (this.errorListener) {
      this.errorListener.remove();
      this.errorListener = null;
    }
  }

  /**
   * Format location for API (GeoJSON Point)
   */
  formatForAPI(location: BackgroundLocation): {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  } {
    return {
      type: 'Point',
      coordinates: [location.longitude, location.latitude],
    };
  }

  /**
   * Check if background location is supported
   */
  isSupported(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const backgroundLocationService = new BackgroundLocationService();
