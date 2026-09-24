/**
 * DeliveryHistoryScreen - React Native (Timeline Style)
 * Modern timeline view with search/filter
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import { Picker } from '@react-native-picker/picker';
import { RootState } from '../store/store';
import { useGetOrdersByStatusQuery } from '../store/api/orderApi';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/driverDesignTokens';

type TimeFilter = 'today' | 'week' | 'month' | 'all';

export const DeliveryHistoryScreen: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch delivered orders
  const { data: deliveredOrders, isLoading, refetch } = useGetOrdersByStatusQuery('DELIVERED', {
    pollingInterval: 60000,
  });

  // Filter and group deliveries
  const { filteredDeliveries, groupedDeliveries } = useMemo(() => {
    const myDeliveries =
      deliveredOrders?.filter(
        (order: any) => order.assignedDriverId === user?.id
      ) || [];

    // Apply time filter
    const filteredByTime = myDeliveries.filter((order: any) => {
      const orderDate = new Date(order.deliveredAt || order.updatedAt);
      const now = new Date();

      switch (timeFilter) {
        case 'today':
          return orderDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDate >= weekAgo;
        case 'month':
          return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });

    // Apply search filter
    const filtered = filteredByTime.filter((order: any) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const orderNumber = (order.orderNumber || (order.id || order._id).slice(-6)).toLowerCase();
      const customerName = (order.customer?.name || '').toLowerCase();
      return orderNumber.includes(query) || customerName.includes(query);
    });

    // Group by date
    const grouped = filtered.reduce((groups: any, order: any) => {
      const date = new Date(order.deliveredAt || order.updatedAt);
      const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(order);
      return groups;
    }, {});

    return { filteredDeliveries: filtered, groupedDeliveries: grouped };
  }, [deliveredOrders, user?.id, timeFilter, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderOrderItem = ({ item }: { item: any }) => {
    const deliveryTime = new Date(item.deliveredAt || item.updatedAt);
    const earnings = (item.totalAmount * 0.2).toFixed(0);
    const isExpanded = expandedOrder === (item.id || item._id);

    return (
      <View style={styles.orderCard}>
        <TouchableOpacity
          style={styles.orderCardContent}
          onPress={() => setExpandedOrder(isExpanded ? null : item.id || item._id)}
          activeOpacity={0.7}
        >
          {/* Timeline Dot */}
          <View style={styles.timelineDot}>
            <Icon name="check-circle" size={20} color={colors.semantic.success} />
          </View>

          {/* Order Info */}
          <View style={styles.orderInfo}>
            <View style={styles.orderHeader}>
              <View style={styles.orderLeft}>
                <Text style={styles.orderTime}>
                  {deliveryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={styles.orderNumber}>
                  #{item.orderNumber || (item.id || item._id).slice(-6).toUpperCase()} · ₹{item.totalAmount}
                </Text>
              </View>

              <View style={styles.orderRight}>
                <Text style={styles.earnings}>+₹{earnings}</Text>
                <Text style={styles.earningsLabel}>earned</Text>
              </View>
            </View>

            <Text style={styles.orderDetails}>
              {item.customer?.name || 'Customer'} · 5.5 km · 28 min
            </Text>

            {/* Expandable Details */}
            {isExpanded && (
              <View style={styles.expandedDetails}>
                <View style={styles.divider} />
                <Text style={styles.detailLabel}>
                  <Text style={styles.detailBold}>Address: </Text>
                  {item.deliveryAddress || 'N/A'}
                </Text>
                {item.items && item.items.length > 0 && (
                  <View style={styles.itemsList}>
                    <Text style={styles.detailBold}>Items ({item.items.length}):</Text>
                    {item.items.slice(0, 3).map((orderItem: any, idx: number) => (
                      <Text key={idx} style={styles.itemText}>
                        • {orderItem.quantity}x {orderItem.name}
                      </Text>
                    ))}
                    {item.items.length > 3 && (
                      <Text style={styles.itemText}>+{item.items.length - 3} more items</Text>
                    )}
                  </View>
                )}
              </View>
            )}

            <Icon
              name={isExpanded ? 'expand-less' : 'expand-more'}
              size={20}
              color={colors.text.tertiary}
              style={styles.expandIcon}
            />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDateGroup = ({ item }: { item: [string, any[]] }) => {
    const [date, orders] = item;

    return (
      <View style={styles.dateGroup}>
        <View style={styles.dateHeader}>
          <View style={styles.dateDivider} />
          <Text style={styles.dateText}>{date}</Text>
          <View style={styles.dateDivider} />
        </View>
        {orders.map((order) => renderOrderItem({ item: order }))}
      </View>
    );
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary.green} />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  const groupedArray = Object.entries(groupedDeliveries);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Delivery History</Text>
        <Text style={styles.headerSubtitle}>
          {filteredDeliveries.length} {filteredDeliveries.length === 1 ? 'delivery' : 'deliveries'} completed
        </Text>
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color={colors.text.tertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.timeFilterContainer}>
          <Picker
            selectedValue={timeFilter}
            onValueChange={(value) => setTimeFilter(value as TimeFilter)}
            style={styles.picker}
          >
            <Picker.Item label="Today" value="today" />
            <Picker.Item label="This Week" value="week" />
            <Picker.Item label="This Month" value="month" />
            <Picker.Item label="All Time" value="all" />
          </Picker>
        </View>
      </View>

      {/* Timeline List */}
      {filteredDeliveries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="check-circle" size={64} color={colors.text.secondary} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No Deliveries Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery ? 'Try adjusting your search or filters' : 'Complete deliveries will appear here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupedArray}
          keyExtractor={([date]) => date}
          renderItem={renderDateGroup}
          contentContainerStyle={styles.listContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary.green} />
          }
        />
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
  header: {
    padding: spacing.lg,
    backgroundColor: colors.surface.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  headerTitle: {
    fontSize: typography.fontSize.h1,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
  },
  filterBar: {
    flexDirection: 'row',
    padding: spacing.base,
    backgroundColor: colors.surface.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.backgroundAlt,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surface.border,
    marginRight: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.body,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
  },
  timeFilterContainer: {
    width: 130,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surface.border,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface.backgroundAlt,
    overflow: 'hidden',
  },
  picker: {
    height: 45,
    width: '100%',
    color: colors.text.primary,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  dateGroup: {
    marginBottom: spacing.lg,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  dateDivider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.surface.border,
  },
  dateText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: spacing.md,
  },
  orderCard: {
    marginBottom: spacing.md,
  },
  orderCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.base,
  },
  timelineDot: {
    marginTop: spacing.xs,
  },
  orderInfo: {
    flex: 1,
    backgroundColor: colors.surface.background,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    ...shadows.subtle,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  orderLeft: {
    flex: 1,
  },
  orderTime: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
  },
  orderNumber: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  earnings: {
    fontSize: typography.fontSize.h2,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.semantic.success,
  },
  earningsLabel: {
    fontSize: typography.fontSize.small,
    color: colors.text.tertiary,
  },
  orderDetails: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  expandedDetails: {
    marginTop: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surface.border,
    marginVertical: spacing.sm,
  },
  detailLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  detailBold: {
    fontWeight: typography.fontWeight.semibold as any,
  },
  itemsList: {
    marginTop: spacing.xs,
  },
  itemText: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  expandIcon: {
    alignSelf: 'center',
    marginTop: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyIcon: {
    opacity: 0.5,
    marginBottom: spacing.base,
  },
  emptyTitle: {
    fontSize: typography.fontSize.h2,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default DeliveryHistoryScreen;
