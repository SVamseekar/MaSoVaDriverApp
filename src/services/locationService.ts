/**
 * Location Service - React Native
 * Handles GPS tracking, location updates, and background tracking
 */

import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid, Platform, Alert } from 'react-native';

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export interface LocationUpdate {
  driverId: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  timestamp: string;
}

class LocationService {
  private watchId: number | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private currentLocation: Location | null = null;
  private onLocationUpdate: ((location: Location) => void) | null = null;

  /**
   * Request location permissions (Android)
   */
  async requestLocationPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true; // iOS handles permissions differently
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'MaSoVa Driver needs access to your location for delivery tracking',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        // Also request background location for Android 10+
        if (Platform.Version >= 29) {
          const backgroundGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
            {
              title: 'Background Location Permission',
              message: 'Allow MaSoVa Driver to access location in the background for continuous tracking',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          return backgroundGranted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
      }

      return false;
    } catch (err) {
      console.warn('Location permission error:', err);
      return false;
    }
  }

  /**
   * Get current location once
   */
  async getCurrentLocation(): Promise<Location> {
    const hasPermission = await this.requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          this.currentLocation = location;
          resolve(location);
        },
        (error) => {
          console.error('Error getting location:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  }

  /**
   * Start watching location changes
   */
  async startTracking(
    onUpdate: (location: Location) => void,
    options?: {
      distanceFilter?: number;
      interval?: number;
    }
  ): Promise<void> {
    const hasPermission = await this.requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    this.onLocationUpdate = onUpdate;

    // Watch position changes
    this.watchId = Geolocation.watchPosition(
      (position) => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        this.currentLocation = location;

        if (this.onLocationUpdate) {
          this.onLocationUpdate(location);
        }
      },
      (error) => {
        console.error('Error watching location:', error);
        Alert.alert('Location Error', 'Failed to track location. Please check your GPS settings.');
      },
      {
        enableHighAccuracy: true,
        distanceFilter: options?.distanceFilter || 10, // Update every 10 meters
        interval: options?.interval || 5000, // Check every 5 seconds
        fastestInterval: 3000,
      }
    );
  }

  /**
   * Stop watching location changes
   */
  stopTracking(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.onLocationUpdate = null;
  }

  /**
   * Get last known location
   */
  getLastKnownLocation(): Location | null {
    return this.currentLocation;
  }

  /**
   * Save default location for fallback
   */
  async saveDefaultLocation(userId: string, location: Location): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `driver_default_location_${userId}`,
        JSON.stringify(location)
      );
    } catch (error) {
      console.error('Failed to save default location:', error);
    }
  }

  /**
   * Get saved default location
   */
  async getDefaultLocation(userId: string): Promise<Location | null> {
    try {
      const saved = await AsyncStorage.getItem(`driver_default_location_${userId}`);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Failed to get default location:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two points (in km)
   */
  calculateDistance(loc1: Location, loc2: Location): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(loc2.latitude - loc1.latitude);
    const dLon = this.toRad(loc2.longitude - loc1.longitude);
    const lat1 = this.toRad(loc1.latitude);
    const lat2 = this.toRad(loc2.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Format location for API (GeoJSON Point format)
   */
  formatForApi(driverId: string, location: Location): LocationUpdate {
    return {
      driverId,
      location: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
      },
      timestamp: new Date(location.timestamp || Date.now()).toISOString(),
    };
  }
}

export const locationService = new LocationService();
