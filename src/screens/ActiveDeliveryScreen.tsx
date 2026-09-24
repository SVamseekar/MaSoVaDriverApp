/**
 * ActiveDeliveryScreen - React Native (Uber-style)
 * Clean delivery cards with modern layout and actions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { useGetOrdersByStatusQuery, useUpdateOrderStatusMutation } from '../store/api/orderApi';
import { cameraService } from '../services/cameraService';
import { notificationService } from '../services/notificationService';
import { photoUploadService } from '../services/photoUploadService';
import { offlineQueueService, QueueActionType } from '../services/offlineQueueService';
import { DeliveryCard } from '../components/shared';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/driverDesignTokens';

type ViewMode = 'list' | 'map';

export const ActiveDeliveryScreen: React.FC = () => {
  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [refreshing, setRefreshing] = useState(false);
  const [, setUploadingPhoto] = useState(false);
  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  // Fetch orders assigned to this driver with status DISPATCHED
  const { data: activeOrders, isLoading, refetch } = useGetOrdersByStatusQuery('DISPATCHED', {
    pollingInterval: 30000,
  });

  // Filter orders assigned to current driver (backend uses assignedDriverId)
  const myDeliveries = activeOrders?.filter((order: any) =>
    order.assignedDriverId === user?.id
  ) || [];

  const handleMarkDelivered = async (orderId: string, orderNumber: string) => {
    Alert.alert(
      'Mark as Delivered',
      'Would you like to take a photo as proof of delivery?',
      [
        {
          text: 'Skip Photo',
          style: 'cancel',
          onPress: async () => {
            // Mark delivered without photo
            try {
              await updateOrderStatus({
                orderId,
                status: 'DELIVERED',
              }).unwrap();

              await notificationService.notifyDeliveryUpdate(orderNumber, 'DELIVERED', orderId);
              Alert.alert('Success', 'Delivery marked as complete');
              refetch();
            } catch (error) {
              console.error('Failed to mark as delivered:', error);
              Alert.alert('Error', 'Failed to update delivery status');
            }
          },
        },
        {
          text: 'Take Photo',
          onPress: async () => {
            try {
              // Capture delivery proof photo
              const photo = await cameraService.takePhoto({
                quality: 0.8,
                maxWidth: 1920,
                maxHeight: 1080,
              });

              if (!photo) {
                Alert.alert('Photo Required', 'Please take a photo or choose "Skip Photo"');
                return;
              }

              // Validate photo size
              if (!cameraService.isValidSize(photo, 5)) {
                Alert.alert('Photo Too Large', 'Please take another photo. Maximum size: 5MB');
                return;
              }

              setUploadingPhoto(true);

              // PHASE 4: Upload photo to backend
              try {
                if (accessToken) {
                  const uploadResult = await photoUploadService.uploadProofOfDelivery(
                    orderId,
                    photo,
                    accessToken
                  );

                  if (uploadResult.success) {
                    console.log('✓ Photo uploaded:', uploadResult.photoUrl);
                  } else {
                    console.warn('Photo upload queued:', uploadResult.message);
                    // Photo is queued for retry via offline queue service
                  }
                } else {
                  console.warn('No auth token, queueing photo for upload');
                  // Queue photo for upload when token is available
                  await offlineQueueService.enqueue(
                    QueueActionType.PHOTO_UPLOAD,
                    {
                      orderId,
                      photo: {
                        uri: photo.uri,
                        type: photo.type,
                        fileName: photo.fileName,
                      },
                    }
                  );
                }
              } catch (uploadError) {
                console.error('Photo upload error:', uploadError);
                // Continue with delivery completion even if photo upload fails
              }

              setUploadingPhoto(false);

              // Mark as delivered
              await updateOrderStatus({
                orderId,
                status: 'DELIVERED',
              }).unwrap();

              await notificationService.notifyDeliveryUpdate(orderNumber, 'DELIVERED', orderId);
              Alert.alert('Success', '✅ Delivery completed with photo proof');
              refetch();
            } catch (error) {
              console.error('Failed to complete delivery:', error);
              Alert.alert('Error', 'Failed to complete delivery');
            }
          },
        },
      ]
    );
  };

  const formatAddress = (rawAddress: any): string => {
    if (typeof rawAddress === 'string') {
      return rawAddress;
    } else if (rawAddress && typeof rawAddress === 'object') {
      const parts = [
        rawAddress.street,
        rawAddress.landmark,
        rawAddress.city,
        rawAddress.state,
        rawAddress.pincode,
      ].filter(Boolean);
      return parts.join(', ') || 'Address not provided';
    }
    return 'Address not provided';
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Loading state
  if (isLoading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary.green} />
        <Text style={styles.loadingText}>Loading deliveries...</Text>
      </View>
    );
  }

  // Empty state
  if (myDeliveries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🎯</Text>
        <Text style={styles.emptyTitle}>No Active Deliveries</Text>
        <Text style={styles.emptySubtitle}>
          You're all caught up! Go online to receive new delivery assignments.
        </Text>
        <View style={styles.emptyTip}>
          <Text style={styles.emptyTipIcon}>💡</Text>
          <Text style={styles.emptyTipText}>New orders will appear here automatically</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Active Deliveries</Text>
          <Text style={styles.headerSubtitle}>
            {myDeliveries.length} {myDeliveries.length === 1 ? 'order' : 'orders'} in queue
          </Text>
        </View>

        {/* View Toggle */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.viewToggle, viewMode === 'list' && styles.viewToggleActive]}
            onPress={() => setViewMode('list')}
          >
            <Icon
              name="view-list"
              size={20}
              color={viewMode === 'list' ? colors.text.inverse : colors.text.secondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.viewToggle, viewMode === 'map' && styles.viewToggleActive]}
            onPress={() => setViewMode('map')}
          >
            <Icon
              name="map"
              size={20}
              color={viewMode === 'map' ? colors.text.inverse : colors.text.secondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Delivery List */}
      {viewMode === 'list' ? (
        <FlatList
          data={myDeliveries}
          keyExtractor={(item) => item.id || item._id}
          renderItem={({ item: order }) => {
            const rawAddress = order.deliveryAddress;
            const customerAddress = formatAddress(rawAddress);
            // Customer data is flat on order object, not nested
            const customerPhone = order.customerPhone || 'Phone not provided';
            const customerName = order.customerName || 'Customer';
            const orderNumber = order.orderNumber || (order.id || order._id).slice(-6).toUpperCase();

            // Format delivery object for DeliveryCard
            const delivery = {
              id: order.id || order._id,
              orderNumber: orderNumber,
              customerName: customerName,
              customerAddress: customerAddress,
              customerPhone: customerPhone,
              estimatedDeliveryTime: order.estimatedDeliveryTime
                ? new Date(order.estimatedDeliveryTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                : 'Not set',
              status: 'assigned' as const,
              orderTotal: order.total || order.totalAmount || 0,
            };

            return (
              <DeliveryCard
                delivery={delivery}
                onPress={() => handleMarkDelivered(order.id || order._id, orderNumber)}
                showActions={true}
              />
            );
          }}
          contentContainerStyle={styles.listContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary.green} />
          }
        />
      ) : (
        /* Map View Placeholder */
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderTitle}>Map View</Text>
          <Text style={styles.mapPlaceholderSubtitle}>
            Interactive map with delivery routes coming soon
          </Text>
          <TouchableOpacity style={styles.mapBackButton} onPress={() => setViewMode('list')}>
            <Icon name="view-list" size={24} color={colors.text.inverse} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.backgroundAlt,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface.background,
  },
  loadingText: {
    marginTop: spacing.base,
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface.background,
    padding: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: spacing.lg,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: typography.fontSize.h1,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.primary.greenLight,
    borderRadius: borderRadius.full,
  },
  emptyTipIcon: {
    fontSize: 16,
  },
  emptyTipText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.primary.green,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize.h1,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    lineHeight: 32,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  viewToggle: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.background,
  },
  viewToggleActive: {
    backgroundColor: colors.primary.green,
    borderColor: colors.primary.green,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface.background,
    padding: spacing.xxl,
  },
  mapPlaceholderTitle: {
    fontSize: typography.fontSize.h2,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  mapPlaceholderSubtitle: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  mapBackButton: {
    backgroundColor: colors.primary.green,
    padding: spacing.base,
    borderRadius: borderRadius.full,
    ...shadows.card,
  },
});

export default ActiveDeliveryScreen;
