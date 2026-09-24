import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { colors } from '../../styles/driverDesignTokens';
import {
  useGetTodayAnalyticsQuery,
  useGetRecentOrdersQuery,
  type RecentOrder,
} from '../../store/api/orderApi';

const ACCENT = colors.roles.manager;

const KPICard = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.kpiCard}>
    <Text style={styles.kpiLabel}>{label}</Text>
    <Text style={[styles.kpiValue, { color: ACCENT }]}>{value}</Text>
  </View>
);

const OrderRow = ({ order }: { order: RecentOrder }) => (
  <View style={styles.orderRow}>
    <View style={styles.orderLeft}>
      <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
      <Text style={styles.orderMeta}>{order.orderType} · {order.customerName}</Text>
    </View>
    <View style={styles.orderRight}>
      <Text style={styles.orderTotal}>₹{order.total}</Text>
      <Text style={[styles.orderStatus, { color: ACCENT }]}>{order.status}</Text>
    </View>
  </View>
);

export const QuickDashboardScreen = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const storeId = user?.storeId ?? '';

  const {
    data: analytics,
    isLoading: loadingAnalytics,
    refetch: refetchAnalytics,
  } = useGetTodayAnalyticsQuery(storeId, { skip: !storeId, pollingInterval: 60000 });

  const {
    data: recentOrders = [],
    isLoading: loadingOrders,
    refetch: refetchOrders,
  } = useGetRecentOrdersQuery(storeId, { skip: !storeId, pollingInterval: 30000 });

  const isLoading = loadingAnalytics || loadingOrders;
  const onRefresh = () => { refetchAnalytics(); refetchOrders(); };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={ACCENT} />
      }
    >
      <Text style={styles.title}>Today's Overview</Text>

      {isLoading && !analytics ? (
        <ActivityIndicator size="large" color={ACCENT} style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.kpiGrid}>
          <KPICard label="Revenue" value={analytics ? `₹${analytics.todayRevenue}` : '--'} />
          <KPICard label="Active Orders" value={analytics ? String(analytics.activeOrders) : '--'} />
          <KPICard label="Avg Prep" value={analytics ? `${analytics.avgPrepTime}m` : '--'} />
          <KPICard label="Staff On Duty" value={analytics ? String(analytics.activeStaff) : '--'} />
        </View>
      )}

      <Text style={styles.sectionTitle}>Recent Orders</Text>
      {recentOrders.length === 0 && !loadingOrders ? (
        <Text style={styles.emptyText}>No orders yet today</Text>
      ) : (
        recentOrders.map(order => <OrderRow key={order.id} order={order} />)
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.backgroundAlt },
  title: { color: colors.text.primary, fontSize: 22, fontWeight: '700', padding: 16, paddingBottom: 8 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  kpiCard: {
    width: '46%', backgroundColor: colors.surface.background,
    margin: '2%', borderRadius: 10, padding: 16,
    borderTopWidth: 3, borderTopColor: ACCENT,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 2, elevation: 1,
  },
  kpiLabel: { color: colors.text.secondary, fontSize: 12, marginBottom: 6 },
  kpiValue: { fontSize: 24, fontWeight: '700' },
  sectionTitle: {
    color: colors.text.tertiary, fontSize: 12,
    textTransform: 'uppercase', letterSpacing: 1,
    padding: 16, paddingBottom: 8,
  },
  emptyText: { color: colors.text.tertiary, textAlign: 'center', padding: 24 },
  orderRow: {
    backgroundColor: colors.surface.background,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 8, marginBottom: 4, padding: 14, borderRadius: 10,
  },
  orderLeft: { flex: 1 },
  orderNumber: { color: colors.text.primary, fontWeight: '600', fontSize: 15 },
  orderMeta: { color: colors.text.secondary, fontSize: 12, marginTop: 2 },
  orderRight: { alignItems: 'flex-end' },
  orderTotal: { color: colors.text.primary, fontWeight: '700', fontSize: 16 },
  orderStatus: { fontSize: 11, textTransform: 'uppercase', marginTop: 2 },
});

export default QuickDashboardScreen;
