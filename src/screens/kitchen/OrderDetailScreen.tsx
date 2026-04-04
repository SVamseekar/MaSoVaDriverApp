import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { colors } from '../../styles/driverDesignTokens';
import type { KitchenOrder } from '../../store/api/orderApi';

type RouteParams = { OrderDetail: { order: KitchenOrder } };

export const OrderDetailScreen = () => {
  const route = useRoute<RouteProp<RouteParams, 'OrderDetail'>>();
  const { order } = route.params;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
      <Text style={[styles.status, { color: colors.roles.kitchen }]}>{order.status}</Text>

      {order.orderType === 'DINE_IN' && order.tableNumber != null && (
        <Text style={styles.tableTag}>Table {order.tableNumber}</Text>
      )}

      {order.items.map((item, i) => (
        <View key={i} style={styles.item}>
          <Text style={styles.itemName}>{item.quantity}× {item.name}</Text>
          {item.customizations ? (
            <Text style={styles.customizations}>{item.customizations}</Text>
          ) : null}
        </View>
      ))}

      {order.specialInstructions ? (
        <View style={styles.notes}>
          <Text style={styles.notesLabel}>Special Instructions</Text>
          <Text style={styles.notesText}>{order.specialInstructions}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.backgroundAlt, padding: 16 },
  orderNumber: { color: colors.text.primary, fontSize: 24, fontWeight: '700', marginBottom: 4 },
  status: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginBottom: 12 },
  tableTag: { color: colors.semantic.warning, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  item: { backgroundColor: colors.surface.background, borderRadius: 8, padding: 12, marginBottom: 8 },
  itemName: { color: colors.text.primary, fontSize: 16, fontWeight: '600' },
  customizations: { color: colors.text.secondary, fontSize: 12, marginTop: 4 },
  notes: { backgroundColor: colors.surface.background, borderRadius: 8, padding: 12, marginTop: 8 },
  notesLabel: { color: colors.roles.kitchen, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  notesText: { color: colors.text.primary, fontSize: 14 },
});

export default OrderDetailScreen;
