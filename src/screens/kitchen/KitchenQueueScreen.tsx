// src/screens/kitchen/KitchenQueueScreen.tsx
// Mobile KDS — live order queue with one-tap bump
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { RootState } from '../../store/store';
import { colors } from '../../styles/driverDesignTokens';

const STATUS_ORDER = ['RECEIVED', 'PREPARING', 'OVEN', 'BAKED', 'DISPATCHED'];
const STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'New',
  PREPARING: 'Preparing',
  OVEN: 'In Oven',
  BAKED: 'Ready',
  DISPATCHED: 'Dispatched',
};
const STATUS_COLORS: Record<string, string> = {
  RECEIVED: '#3b82f6',
  PREPARING: '#f59e0b',
  OVEN: '#ef4444',
  BAKED: '#10b981',
  DISPATCHED: '#6b7280',
};

interface OrderItem { name: string; quantity: number; }
interface Order { id: string; orderNumber: string; status: string; items: OrderItem[]; orderType: string; createdAt: string; }

import { API_CONFIG } from '../../config/api.config';
const API_BASE = API_CONFIG.API_GATEWAY_URL.replace('/api', '');

const KitchenQueueScreen = () => {
  const user = useSelector(selectCurrentUser);
  const token = useSelector((state: RootState) => state.auth.accessToken);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const storeId = user?.storeId ?? '';

  const fetchOrders = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders/kitchen/queue?storeId=${storeId}`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setFetchError(`Failed to load queue (${res.status})`);
      } else {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : data.content ?? []);
        setFetchError(null);
      }
    } catch (e) {
      setFetchError('Network error — check connection');
      console.warn('KDS fetch failed:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(), 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [storeId]);

  const bumpOrder = async (orderId: string, currentStatus: string) => {
    const idx = STATUS_ORDER.indexOf(currentStatus);
    if (idx < 0 || idx >= STATUS_ORDER.length - 1) return;
    const nextStatus = STATUS_ORDER[idx + 1];
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
    } catch (e) {
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const activeOrders = orders.filter(
    o => !['DELIVERED', 'CANCELLED', 'SERVED', 'COMPLETED'].includes(o.status)
  );

  const renderOrder = ({ item }: { item: Order }) => {
    const nextIdx = STATUS_ORDER.indexOf(item.status) + 1;
    const nextStatus = STATUS_ORDER[nextIdx];
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.75}
        onPress={() => {/* future: expand card detail */}}
      >
        <View style={[styles.statusBar, { backgroundColor: STATUS_COLORS[item.status] ?? '#ccc' }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
            <Text style={[styles.statusBadge, { color: STATUS_COLORS[item.status] ?? '#666' }]}>
              {STATUS_LABELS[item.status] ?? item.status}
            </Text>
          </View>
          <Text style={styles.orderType}>{item.orderType?.replace('_', ' ')}</Text>
          {item.items?.map((it, i) => (
            <Text key={i} style={styles.itemText}>• {it.quantity}× {it.name}</Text>
          ))}
          {nextStatus && (
            <TouchableOpacity
              style={[styles.bumpButton, { backgroundColor: STATUS_COLORS[nextStatus] ?? '#ccc' }]}
              onPress={() => bumpOrder(item.id, item.status)}
              activeOpacity={0.8}
            >
              <Text style={styles.bumpText}>
                Move to {STATUS_LABELS[nextStatus] ?? nextStatus}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.roles.kitchen} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {fetchError && (
        <View style={styles.errorBar}>
          <Text style={styles.errorBarText}>{fetchError}</Text>
        </View>
      )}
      <View style={styles.headerBar}>
        <Text style={styles.headerText}>
          {activeOrders.length} active order{activeOrders.length !== 1 ? 's' : ''}
        </Text>
      </View>
      {activeOrders.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>All clear</Text>
          <Text style={styles.emptySubtitle}>No active orders right now. Pull down to refresh.</Text>
        </View>
      ) : (
        <FlatList
          data={activeOrders}
          keyExtractor={o => o.id}
          renderItem={renderOrder}
          contentContainerStyle={{ padding: 12 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchOrders(true)}
              tintColor={colors.roles.kitchen}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.backgroundAlt },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorBar: { backgroundColor: colors.semantic.errorBg, padding: 10, alignItems: 'center' },
  errorBarText: { color: colors.semantic.error, fontSize: 13, fontWeight: '600' },
  headerBar: {
    padding: 16,
    backgroundColor: colors.surface.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  headerText: { fontSize: 14, fontWeight: '600', color: colors.text.secondary },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text.primary, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: colors.text.secondary, textAlign: 'center' },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface.background,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  statusBar: { width: 6 },
  cardContent: { flex: 1, padding: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  orderNumber: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
  statusBadge: { fontSize: 13, fontWeight: '600' },
  orderType: { fontSize: 12, color: colors.text.secondary, marginBottom: 6, textTransform: 'uppercase' },
  itemText: { fontSize: 14, color: colors.text.primary, marginBottom: 2 },
  bumpButton: { marginTop: 10, padding: 10, borderRadius: 8, alignItems: 'center' },
  bumpText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

export default KitchenQueueScreen;
