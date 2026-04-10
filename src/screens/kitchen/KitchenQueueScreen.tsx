import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { colors } from '../../styles/driverDesignTokens';
import { useGetKitchenOrdersQuery, useAdvanceOrderStageMutation, type KitchenOrder } from '../../store/api/orderApi';
import { AllergenType, ALLERGEN_SHORT } from '../../constants/allergens';

const ACCENT = colors.roles.kitchen;

const getUrgencyColor = (createdAt: string): string => {
  const minutes = (Date.now() - new Date(createdAt).getTime()) / 60000;
  if (minutes > 10) return colors.semantic.error;
  if (minutes > 5) return colors.semantic.warning;
  return colors.semantic.success;
};

const getUrgencyLabel = (createdAt: string): string => {
  const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  return `${minutes}m ago`;
};

export const KitchenQueueScreen = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: orders = [], isLoading, isError, refetch } = useGetKitchenOrdersQuery(
    user?.storeId ?? '',
    { pollingInterval: 15000, skip: !user?.storeId },
  );
  const [advanceStage] = useAdvanceOrderStageMutation();
  const [advancing, setAdvancing] = useState<string | null>(null);

  const handleBump = useCallback(async (orderId: string, orderNumber: string) => {
    setAdvancing(orderId);
    try {
      await advanceStage(orderId).unwrap();
    } catch {
      Alert.alert('Error', `Could not advance order #${orderNumber}`);
    } finally {
      setAdvancing(null);
    }
  }, [advanceStage]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load orders</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderOrder = ({ item }: { item: KitchenOrder }) => (
    <View style={[styles.card, { borderLeftColor: getUrgencyColor(item.createdAt) }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
        <Text style={styles.urgency}>{getUrgencyLabel(item.createdAt)}</Text>
      </View>

      <Text style={[styles.status, { color: ACCENT }]}>{item.status}</Text>

      {item.orderType === 'DINE_IN' && item.tableNumber != null && (
        <Text style={styles.tableTag}>Table {item.tableNumber}</Text>
      )}

      {item.items.map((lineItem, idx) => (
        <View key={idx} style={styles.lineItem}>
          <Text style={styles.lineItemText}>{lineItem.quantity}× {lineItem.name}</Text>
          {lineItem.customizations ? (
            <Text style={styles.customizations}>{lineItem.customizations}</Text>
          ) : null}
          {lineItem.allergens && lineItem.allergens.length > 0 && (
            <View style={styles.allergenRow}>
              {(lineItem.allergens as AllergenType[]).map((a) => (
                <View key={a} style={styles.allergenBadge}>
                  <Text style={styles.allergenBadgeText}>{ALLERGEN_SHORT[a] ?? a}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}

      {item.specialInstructions ? (
        <Text style={styles.notes}>📝 {item.specialInstructions}</Text>
      ) : null}

      <TouchableOpacity
        style={[styles.bumpBtn, advancing === item.id && styles.bumpBtnDisabled]}
        onPress={() => handleBump(item.id, item.orderNumber)}
        disabled={advancing === item.id}
        activeOpacity={0.8}
      >
        {advancing === item.id
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={styles.bumpText}>▶  Advance Status</Text>
        }
      </TouchableOpacity>
    </View>
  );

  return (
    <FlatList
      style={styles.list}
      data={orders}
      keyExtractor={item => item.id}
      onRefresh={refetch}
      refreshing={false}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No active orders</Text>
        </View>
      }
      renderItem={renderOrder}
    />
  );
};

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.surface.backgroundAlt },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  errorText: { color: colors.semantic.error, fontSize: 16, marginBottom: 12 },
  retryBtn: { backgroundColor: ACCENT, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '700' },
  emptyText: { color: colors.text.tertiary, fontSize: 16 },
  card: {
    backgroundColor: colors.surface.background,
    borderRadius: 10, margin: 8, padding: 16,
    borderLeftWidth: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  orderNumber: { color: colors.text.primary, fontSize: 18, fontWeight: '700' },
  urgency: { color: colors.text.tertiary, fontSize: 12 },
  status: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: 8 },
  tableTag: { color: colors.semantic.warning, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  lineItem: { marginVertical: 2 },
  lineItemText: { color: colors.text.primary, fontSize: 15 },
  customizations: { color: colors.text.secondary, fontSize: 12, marginLeft: 8 },
  allergenRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  allergenBadge: { backgroundColor: '#fff3e0', borderWidth: 1, borderColor: '#ff9800', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  allergenBadgeText: { color: '#e65100', fontSize: 10, fontWeight: '700' },
  notes: { color: colors.text.secondary, fontSize: 13, marginTop: 6, fontStyle: 'italic' },
  bumpBtn: {
    backgroundColor: ACCENT, marginTop: 14,
    padding: 14, borderRadius: 8, alignItems: 'center', minHeight: 48,
  },
  bumpBtnDisabled: { opacity: 0.5 },
  bumpText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default KitchenQueueScreen;
