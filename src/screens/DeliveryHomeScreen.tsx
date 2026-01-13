/**
 * DeliveryHomeScreen - React Native (Uber-style)
 * Migrated from web DeliveryHomePage with React Native components
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  RefreshControl,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootState } from '../store/store';
import { useGetDriverPerformanceQuery, useUpdateDriverLocationMutation } from '../store/api/driverApi';
import { websocketService } from '../services/websocketService';
import { locationService, Location } from '../services/locationService';
import { notificationService } from '../services/notificationService';
import { backgroundLocationService } from '../services/backgroundLocationService';
import { offlineQueueService, QueueActionType } from '../services/offlineQueueService';
import { MetricCard, ActionButton } from '../components/shared';
import { LocationMapModal } from '../components/LocationMapModal';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/driverDesignTokens';

interface DeliveryHomeScreenProps {
  isOnline: boolean;
  setIsOnline: (value: boolean) => void;
  setActiveDeliveries: (value: number) => void;
}

export const DeliveryHomeScreen: React.FC<DeliveryHomeScreenProps> = ({
  isOnline,
  setIsOnline,
  setActiveDeliveries,
}) => {
  const { user } = useSelector((state: RootState) => state.auth);

  const [location, setLocation] = useState<Location | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [locationError, setLocationError] = useState<string>('');
  const [locationMode, setLocationMode] = useState<'auto' | 'manual'>('auto');
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [refreshing, setRefreshing] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Fetch real driver performance data
  const today = new Date().toISOString().split('T')[0];
  const { data: performanceData, isLoading: isLoadingPerformance, refetch } = useGetDriverPerformanceQuery(
    {
      driverId: user?.id || '',
      startDate: today,
      endDate: today,
    },
    {
      skip: !user?.id,
      pollingInterval: 30000,
    }
  );

  // RTK Query mutation for updating location
  const [updateDriverLocation] = useUpdateDriverLocationMutation();

  // Calculate today's stats
  const todayStats = useMemo(() => ({
    deliveries: performanceData?.totalDeliveries || 0,
    earnings: performanceData?.totalEarnings || 0,
    distance: performanceData?.totalDistanceCovered || 0,
    avgDeliveryTime: Math.round(performanceData?.averageDeliveryTime || 0),
  }), [performanceData]);

  const getDefaultLocation = async (): Promise<Location> => {
    if (user?.id) {
      const saved = await locationService.getDefaultLocation(user.id);
      if (saved) return saved;
    }
    return { latitude: 12.9716, longitude: 77.5946 }; // Bangalore default
  };

  const getCurrentLocation = async (): Promise<void> => {
    if (locationMode === 'manual') {
      const manualCoords = await getDefaultLocation();
      setLocation(manualCoords);
      setIsUsingFallback(true);
      setLocationError('Using manual location. Toggle Auto GPS to enable tracking.');
      return;
    }

    // Use real GPS service
    setIsLoadingLocation(true);
    setLocationError('');

    try {
      const currentLoc = await locationService.getCurrentLocation();
      setLocation(currentLoc);
      setIsUsingFallback(false);
      setLocationError('');

      // Save as default location
      if (user?.id) {
        await locationService.saveDefaultLocation(user.id, currentLoc);
      }

      // Update backend with current location
      if (user?.id) {
        const locationUpdate = locationService.formatForApi(user.id, currentLoc);
        await updateDriverLocation(locationUpdate);
      }

      setIsLoadingLocation(false);
    } catch (error: any) {
      console.error('Failed to get GPS location:', error);
      setIsLoadingLocation(false);

      // Fall back to saved/default location
      const fallbackCoords = await getDefaultLocation();
      setLocation(fallbackCoords);
      setIsUsingFallback(true);
      setLocationError(error.message || 'GPS unavailable. Using last known location.');
    }
  };

  // Update elapsed time
  useEffect(() => {
    if (!sessionStartTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - sessionStartTime.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setElapsedTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // WebSocket connection and real-time GPS tracking
  useEffect(() => {
    if (!isOnline || !user?.id) return;

    const connectWebSocket = async () => {
      if (websocketService.isConnected()) return;
      try {
        await websocketService.connect();
        console.log('WebSocket connected');
      } catch (error) {
        console.warn('WebSocket connection failed:', error);
      }
    };

    const startLocationTracking = async () => {
      if (locationMode === 'manual') return;

      try {
        // Start foreground GPS tracking with automatic location updates
        await locationService.startTracking(
          async (newLocation) => {
            setLocation(newLocation);
            setIsUsingFallback(false);

            // Send location update via WebSocket
            if (websocketService.isConnected()) {
              websocketService.sendLocationUpdate(user.id, {
                latitude: newLocation.latitude,
                longitude: newLocation.longitude,
                timestamp: new Date(newLocation.timestamp || Date.now()).toISOString(),
              });
            } else {
              // Queue for offline sync if WebSocket not connected
              await offlineQueueService.enqueue(
                QueueActionType.LOCATION_UPDATE,
                {
                  driverId: user.id,
                  location: {
                    latitude: newLocation.latitude,
                    longitude: newLocation.longitude,
                    timestamp: new Date(newLocation.timestamp || Date.now()).toISOString(),
                  },
                }
              );
            }

            // Also update via REST API every ~30 seconds
            if (newLocation.timestamp && Date.now() - newLocation.timestamp < 31000) {
              const locationUpdate = locationService.formatForApi(user.id, newLocation);
              await updateDriverLocation(locationUpdate).catch(console.error);
            }
          },
          {
            distanceFilter: 10, // Update every 10 meters
            interval: 5000, // Check every 5 seconds
          }
        );
        console.log('Foreground GPS tracking started');

        // PHASE 4: Start background GPS tracking (works when app is minimized)
        if (backgroundLocationService.isSupported()) {
          try {
            await backgroundLocationService.startTracking(user.id);
            console.log('✓ Background GPS tracking started (works in background)');

            // Subscribe to background location updates
            backgroundLocationService.onLocationUpdate((bgLocation) => {
              console.log('Background location update:', bgLocation.latitude, bgLocation.longitude);

              // Update UI state
              setLocation({
                latitude: bgLocation.latitude,
                longitude: bgLocation.longitude,
                accuracy: bgLocation.accuracy,
                altitude: bgLocation.altitude,
                speed: bgLocation.speed,
                heading: bgLocation.bearing,
                timestamp: bgLocation.timestamp,
              });

              // Send via WebSocket
              if (websocketService.isConnected()) {
                websocketService.sendLocationUpdate(user.id, {
                  latitude: bgLocation.latitude,
                  longitude: bgLocation.longitude,
                  timestamp: new Date(bgLocation.timestamp).toISOString(),
                });
              } else {
                // Queue for offline sync
                offlineQueueService.enqueue(
                  QueueActionType.LOCATION_UPDATE,
                  {
                    driverId: user.id,
                    location: {
                      latitude: bgLocation.latitude,
                      longitude: bgLocation.longitude,
                      timestamp: new Date(bgLocation.timestamp).toISOString(),
                    },
                  }
                );
              }
            });

            // Subscribe to background location errors
            backgroundLocationService.onLocationError((error) => {
              console.error('Background GPS error:', error.error);
              setLocationError(`Background GPS: ${error.error}`);
            });
          } catch (bgError) {
            console.warn('Background GPS not available:', bgError);
            // Continue with foreground tracking only
          }
        }
      } catch (error) {
        console.error('Failed to start GPS tracking:', error);
        setLocationError('GPS tracking failed. Check app permissions.');
      }
    };

    connectWebSocket();
    startLocationTracking();

    // Subscribe to new order assignments with notifications
    const unsubscribeOrders = websocketService.subscribeToDriverOrders(
      user.id,
      (newOrder) => {
        console.log('New order received:', newOrder.orderNumber);
        // Optionally refresh active deliveries count
        setActiveDeliveries(prev => prev + 1);
      }
    );

    return () => {
      locationService.stopTracking();

      // Stop background GPS tracking
      if (backgroundLocationService.isSupported()) {
        backgroundLocationService.stopTracking().catch(console.error);
        backgroundLocationService.removeAllListeners();
      }

      unsubscribeOrders();
      if (!isOnline) {
        websocketService.disconnect();
      }
    };
  }, [isOnline, user?.id, locationMode]);

  // Initialize location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Only refetch if user is logged in and query is not skipped
      if (user?.id) {
        await refetch();
      }
      await getCurrentLocation();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenMap = () => {
    if (location) {
      setShowLocationModal(true);
    } else {
      Alert.alert('Location Unavailable', 'Please enable GPS tracking first.');
    }
  };

  const handleSupport = () => {
    Alert.alert(
      'Support Contact',
      'Phone: 1-800-MASOVA\nEmail: support@masova.com\n\nFor urgent issues during delivery, call the number above.',
      [
        { text: 'Call', onPress: () => Linking.openURL('tel:1800627682') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary.green} />
      }
      bounces={false}
      showsVerticalScrollIndicator={false}
    >
      {/* GPS Status Section */}
      <View style={styles.gpsSection}>
        <View style={styles.gpsSectionHeader}>
          <Text style={styles.gpsSectionTitle}>GPS Location</Text>
          <View style={styles.gpsToggle}>
            <Text style={styles.gpsToggleLabel}>{locationMode === 'auto' ? 'Auto GPS' : 'Manual'}</Text>
            <Switch
              value={locationMode === 'auto'}
              onValueChange={(value) => {
                const newMode = value ? 'auto' : 'manual';
                setLocationMode(newMode);
                if (newMode === 'auto') {
                  getCurrentLocation();
                }
              }}
              trackColor={{ false: colors.surface.border, true: colors.primary.green }}
              thumbColor={locationMode === 'auto' ? colors.primary.green : colors.surface.backgroundAlt}
            />
          </View>
        </View>

        {isOnline && location && (
          <View style={styles.gpsContent}>
            <View style={styles.gpsStatusRow}>
              <Icon
                name="place"
                size={20}
                color={isUsingFallback ? colors.semantic.warning : colors.semantic.success}
              />
              <Text
                style={[
                  styles.gpsStatusText,
                  { color: isUsingFallback ? colors.semantic.warning : colors.semantic.success },
                ]}
              >
                {isUsingFallback ? 'Using Fallback Location' : 'GPS Active - Accurate Location'}
              </Text>
            </View>

            <View style={styles.gpsStatusRow}>
              <Icon name="timer" size={20} color={colors.text.secondary} />
              <Text style={styles.elapsedTime}>{elapsedTime}</Text>
              <Text style={styles.elapsedTimeLabel}>Session Time</Text>
            </View>
          </View>
        )}

        {!isOnline && (
          <View style={styles.gpsStatusRow}>
            <Icon name="place" size={20} color={colors.text.secondary} />
            <Text style={styles.gpsOfflineText}>GPS tracking will start when manager clocks you in</Text>
          </View>
        )}

        {/* Location Error Alert */}
        {locationError && (
          <View style={[styles.alert, isUsingFallback ? styles.alertWarning : styles.alertError]}>
            <Text style={styles.alertText}>{locationError}</Text>
            {isLoadingLocation && <ActivityIndicator size="small" color={colors.primary.green} />}
            {!isLoadingLocation && (
              <TouchableOpacity onPress={getCurrentLocation}>
                <Icon name="refresh" size={20} color={colors.text.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsRow}>
        <View style={styles.actionButton}>
          <ActionButton
            title="My Location"
            variant="secondary"
            onPress={handleOpenMap}
            icon={<Icon name="navigation" size={20} color={colors.primary.green} />}
          />
        </View>

        <View style={styles.actionButton}>
          <ActionButton
            title="Support"
            variant="secondary"
            onPress={handleSupport}
            icon={<Icon name="phone" size={20} color={colors.primary.green} />}
          />
        </View>
      </View>

      {/* Today's Stats */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Today's Performance</Text>
        <View style={styles.statsGrid}>
          <View style={styles.metricWrapper}>
            <MetricCard label="Deliveries" value={todayStats.deliveries} trend="up" />
          </View>
          <View style={styles.metricWrapper}>
            <MetricCard label="Earnings" value={`₹${todayStats.earnings}`} trend="up" />
          </View>
          <View style={styles.metricWrapper}>
            <MetricCard label="Distance" value={`${todayStats.distance.toFixed(1)} km`} />
          </View>
          <View style={styles.metricWrapper}>
            <MetricCard label="Avg Time" value={`${todayStats.avgDeliveryTime} min`} />
          </View>
        </View>
      </View>

      {/* Instructions - How It Works */}
      <View style={styles.instructionsSection}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.instructionsScroll}
          decelerationRate="fast"
          snapToInterval={168}
        >
          {[
            { icon: 'check-circle', title: '1. Go Online', desc: 'Get clocked in' },
            { icon: 'local-shipping', title: '2. Accept', desc: 'View orders' },
            { icon: 'navigation', title: '3. Navigate', desc: 'Use map' },
            { icon: 'check-circle-outline', title: '4. Complete', desc: 'Mark done' },
          ].map((step, index) => (
            <View key={index} style={styles.instructionCard}>
              <View style={styles.instructionIconContainer}>
                <Icon name={step.icon} size={22} color={colors.primary.white} />
              </View>
              <Text style={styles.instructionTitle}>{step.title}</Text>
              <Text style={styles.instructionDesc}>{step.desc}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Location Map Modal */}
      <LocationMapModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        location={location}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.background,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: 0,
  },
  gpsSection: {
    backgroundColor: colors.surface.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.subtle,
  },
  gpsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  gpsSectionTitle: {
    fontSize: typography.fontSize.h2,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  gpsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  gpsToggleLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
  },
  gpsContent: {
    gap: spacing.sm,
  },
  gpsStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  gpsStatusText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium as any,
  },
  elapsedTime: {
    fontSize: typography.fontSize.h2,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  elapsedTimeLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
  },
  gpsOfflineText: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    borderRadius: borderRadius.sm,
    marginTop: spacing.base,
  },
  alertWarning: {
    backgroundColor: `${colors.semantic.warning}20`,
    borderLeftWidth: 3,
    borderLeftColor: colors.semantic.warning,
  },
  alertError: {
    backgroundColor: `${colors.semantic.error}20`,
    borderLeftWidth: 3,
    borderLeftColor: colors.semantic.error,
  },
  alertText: {
    flex: 1,
    fontSize: typography.fontSize.caption,
    color: colors.text.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  statsSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.h2,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.base,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.sm / 2,
  },
  metricWrapper: {
    width: '50%',
    paddingHorizontal: spacing.sm / 2,
    marginBottom: spacing.md,
  },
  instructionsSection: {
    marginBottom: 0,
  },
  instructionsScroll: {
    paddingRight: spacing.lg,
  },
  instructionCard: {
    width: 160,
    padding: spacing.base,
    backgroundColor: colors.surface.background,
    borderRadius: borderRadius.md,
    ...shadows.subtle,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary.green,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  instructionTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
    textAlign: 'center',
  },
  instructionDesc: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    lineHeight: 16,
    textAlign: 'center',
  },
});

export default DeliveryHomeScreen;
