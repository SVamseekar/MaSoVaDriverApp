/**
 * DriverProfileScreen - React Native (Uber-style)
 * Visual profile header with stats and shift management
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootState } from '../store/store';
import { useGetDriverPerformanceQuery } from '../store/api/driverApi';
import { logout } from '../store/slices/authSlice';
import { MetricCard, ActionButton } from '../components/shared';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/driverDesignTokens';

export const DriverProfileScreen: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [sessionDuration, setSessionDuration] = useState('00:00:00');
  const [sessionProgress, setSessionProgress] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch driver performance data
  const { data: performance, isLoading, refetch } = useGetDriverPerformanceQuery(
    { driverId: user?.id || '' },
    { skip: !user?.id }
  );

  // Calculate session duration (mock - will be real in Phase 3)
  useEffect(() => {
    const interval = setInterval(() => {
      // This will be replaced with real session data from backend
      const mockDuration = '00:00:00';
      setSessionDuration(mockDuration);
      setSessionProgress(0);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?\n\nMake sure you have clocked out before logging out.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            // Clear driver session data
            if (user?.id) {
              await AsyncStorage.removeItem(`driver_online_${user.id}`);
              await AsyncStorage.removeItem(`driver_session_start_${user.id}`);
              await AsyncStorage.removeItem(`driver_default_location_${user.id}`);
            }
            // Dispatch logout action
            dispatch(logout());
          },
        },
      ]
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Use backend data or defaults
  const driverStats = performance
    ? {
        totalDeliveries: performance.totalDeliveries,
        rating: performance.averageRating,
        onTimePercentage: performance.onTimeDeliveryPercentage,
        totalDistance: performance.totalDistanceCovered,
        avgDeliveryTime: performance.averageDeliveryTime,
        earnings: {
          today: performance.todayEarnings || 0,
          week: performance.weekEarnings || 0,
          month: performance.monthEarnings || 0,
        },
      }
    : {
        totalDeliveries: 0,
        rating: 0,
        onTimePercentage: 0,
        totalDistance: 0,
        avgDeliveryTime: 0,
        earnings: { today: 0, week: 0, month: 0 },
      };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary.green} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

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
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Icon name="person" size={48} color={colors.primary.green} />
          </View>
          <View style={styles.ratingBadge}>
            <Icon name="star" size={16} color={colors.semantic.warning} />
            <Text style={styles.ratingText}>{driverStats.rating.toFixed(1)}</Text>
          </View>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name || 'Driver'}</Text>
          <View style={styles.profileDetails}>
            <Icon name="email" size={16} color={colors.text.secondary} />
            <Text style={styles.profileDetailText}>{user?.email || 'No email'}</Text>
          </View>
          <View style={styles.profileDetails}>
            <Icon name="phone" size={16} color={colors.text.secondary} />
            <Text style={styles.profileDetailText}>{user?.phone || 'No phone'}</Text>
          </View>
          <View style={styles.profileDetails}>
            <Icon name="badge" size={16} color={colors.text.secondary} />
            <Text style={styles.profileDetailText}>Driver ID: {user?.id?.slice(-6).toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Performance Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.metricWrapper}>
            <MetricCard label="Total Deliveries" value={driverStats.totalDeliveries} trend="neutral" />
          </View>
          <View style={styles.metricWrapper}>
            <MetricCard label="Rating" value={`${driverStats.rating.toFixed(1)}★`} trend="up" />
          </View>
          <View style={styles.metricWrapper}>
            <MetricCard label="On-Time" value={`${driverStats.onTimePercentage.toFixed(0)}%`} trend="up" />
          </View>
          <View style={styles.metricWrapper}>
            <MetricCard label="Avg Time" value={`${driverStats.avgDeliveryTime.toFixed(0)} min`} trend="neutral" />
          </View>
        </View>
      </View>

      {/* Earnings Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Earnings Summary</Text>
        <View style={styles.earningsCard}>
          <View style={styles.earningRow}>
            <Text style={styles.earningLabel}>Today</Text>
            <Text style={styles.earningValue}>₹{driverStats.earnings.today.toFixed(0)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.earningRow}>
            <Text style={styles.earningLabel}>This Week</Text>
            <Text style={styles.earningValue}>₹{driverStats.earnings.week.toFixed(0)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.earningRow}>
            <Text style={styles.earningLabel}>This Month</Text>
            <Text style={styles.earningValue}>₹{driverStats.earnings.month.toFixed(0)}</Text>
          </View>
        </View>
      </View>

      {/* Distance & Time */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity</Text>
        <View style={styles.activityCard}>
          <View style={styles.activityRow}>
            <Icon name="location-on" size={24} color={colors.primary.green} />
            <View style={styles.activityInfo}>
              <Text style={styles.activityLabel}>Total Distance</Text>
              <Text style={styles.activityValue}>{driverStats.totalDistance.toFixed(1)} km</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.activityRow}>
            <Icon name="access-time" size={24} color={colors.primary.green} />
            <View style={styles.activityInfo}>
              <Text style={styles.activityLabel}>Average Delivery Time</Text>
              <Text style={styles.activityValue}>{driverStats.avgDeliveryTime.toFixed(0)} minutes</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.actionsList}>
          <TouchableOpacity style={styles.actionItem} onPress={() => Alert.alert('Coming Soon', 'Edit profile feature will be available soon')}>
            <Icon name="edit" size={20} color={colors.text.secondary} />
            <Text style={styles.actionText}>Edit Profile</Text>
            <Icon name="chevron-right" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => Alert.alert('Coming Soon', 'Settings feature will be available soon')}>
            <Icon name="settings" size={20} color={colors.text.secondary} />
            <Text style={styles.actionText}>Settings</Text>
            <Icon name="chevron-right" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => Alert.alert('Coming Soon', 'Help & Support feature will be available soon')}>
            <Icon name="help" size={20} color={colors.text.secondary} />
            <Text style={styles.actionText}>Help & Support</Text>
            <Icon name="chevron-right" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout Button */}
      <View style={styles.logoutSection}>
        <ActionButton
          title="Logout"
          variant="danger"
          onPress={handleLogout}
          icon={<Icon name="logout" size={20} color={colors.text.inverse} />}
          fullWidth
        />
      </View>

      {/* Version Info */}
      <Text style={styles.versionText}>MaSoVa Driver App v2.1.0</Text>
    </ScrollView>
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
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  profileHeader: {
    backgroundColor: colors.surface.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.medium,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.semantic.warningLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  ratingText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.semantic.warning,
    marginLeft: spacing.xs / 2,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: typography.fontSize.h1,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  profileDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  profileDetailText: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
  },
  section: {
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
  earningsCard: {
    backgroundColor: colors.surface.background,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    ...shadows.subtle,
  },
  earningRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  earningLabel: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
  },
  earningValue: {
    fontSize: typography.fontSize.h2,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.semantic.success,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surface.border,
    marginVertical: spacing.xs,
  },
  activityCard: {
    backgroundColor: colors.surface.background,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    ...shadows.subtle,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    paddingVertical: spacing.sm,
  },
  activityInfo: {
    flex: 1,
  },
  activityLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs / 2,
  },
  activityValue: {
    fontSize: typography.fontSize.h2,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  actionsList: {
    backgroundColor: colors.surface.background,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.subtle,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  actionText: {
    flex: 1,
    fontSize: typography.fontSize.body,
    color: colors.text.primary,
  },
  logoutSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.base,
  },
  logoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  logoutButtonText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.inverse,
  },
  versionText: {
    fontSize: typography.fontSize.small,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.base,
  },
});

export default DriverProfileScreen;
