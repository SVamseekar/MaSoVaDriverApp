import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  TextInput, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { colors } from '../../styles/driverDesignTokens';
import {
  useGetMenuItemsQuery,
  usePlaceStaffOrderMutation,
  type MenuItem,
} from '../../store/api/orderApi';

const ACCENT = colors.roles.kiosk;

interface CartEntry extends MenuItem { quantity: number; }

export const QuickOrderScreen = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: menu = [], isLoading } = useGetMenuItemsQuery(user?.storeId ?? '', {
    skip: !user?.storeId,
  });
  const [placeStaffOrder, { isLoading: placing }] = usePlaceStaffOrderMutation();

  const [cart, setCart] = useState<CartEntry[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState<'TAKEAWAY' | 'DINE_IN'>('TAKEAWAY');
  const [tableNumber, setTableNumber] = useState('');

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!customerName.trim()) { Alert.alert('Required', 'Enter customer name'); return; }
    if (cart.length === 0) { Alert.alert('Required', 'Add at least one item'); return; }
    if (orderType === 'DINE_IN' && !tableNumber.trim()) {
      Alert.alert('Required', 'Enter table number for dine in');
      return;
    }

    try {
      const result = await placeStaffOrder({
        storeId: user!.storeId,
        customerName: customerName.trim(),
        orderType,
        tableNumber: orderType === 'DINE_IN' ? tableNumber.trim() : undefined,
        paymentMethod: 'CASH',
        createdByStaffId: user!.id,
        items: cart.map(i => ({
          menuItemId: i.id,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
      }).unwrap();

      Alert.alert(
        'Order Placed',
        `#${result.orderNumber} — ₹${cartTotal.toFixed(0)} cash`,
        [{ text: 'New Order', onPress: () => { setCart([]); setCustomerName(''); setTableNumber(''); } }],
      );
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? 'Could not place order';
      Alert.alert('Error', msg);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Customer Name"
        placeholderTextColor={colors.text.tertiary}
        value={customerName}
        onChangeText={setCustomerName}
        autoCapitalize="words"
      />

      <View style={styles.typeRow}>
        {(['TAKEAWAY', 'DINE_IN'] as const).map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.typeBtn, orderType === type && { borderColor: ACCENT }]}
            onPress={() => setOrderType(type)}
          >
            <Text style={[styles.typeBtnText, orderType === type && { color: ACCENT }]}>
              {type === 'TAKEAWAY' ? 'Takeaway' : 'Dine In'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {orderType === 'DINE_IN' && (
        <TextInput
          style={styles.input}
          placeholder="Table Number"
          placeholderTextColor={colors.text.tertiary}
          value={tableNumber}
          onChangeText={setTableNumber}
          keyboardType="numeric"
        />
      )}

      <FlatList
        data={menu}
        numColumns={2}
        keyExtractor={item => item.id}
        style={styles.menuList}
        renderItem={({ item }) => {
          const inCart = cart.find(c => c.id === item.id);
          return (
            <TouchableOpacity style={styles.menuCard} onPress={() => addToCart(item)}>
              <Text style={styles.menuName} numberOfLines={2}>{item.name}</Text>
              <Text style={[styles.menuPrice, { color: ACCENT }]}>₹{item.price}</Text>
              {inCart && (
                <View style={[styles.badge, { backgroundColor: ACCENT }]}>
                  <Text style={styles.badgeText}>{inCart.quantity}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {cart.length > 0 && (
        <View style={styles.cartBar}>
          <Text style={styles.cartSummary}>{cartCount} items · ₹{cartTotal.toFixed(0)}</Text>
          <TouchableOpacity
            style={[styles.placeOrderBtn, placing && styles.disabled]}
            onPress={handlePlaceOrder}
            disabled={placing}
          >
            {placing
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.placeOrderText}>Place Order (Cash)</Text>
            }
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.backgroundAlt },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  input: {
    backgroundColor: colors.surface.background,
    color: colors.text.primary,
    padding: 14, marginHorizontal: 8, marginTop: 8,
    borderRadius: 8, fontSize: 16,
    borderWidth: 1, borderColor: colors.surface.border,
  },
  typeRow: { flexDirection: 'row', margin: 8, gap: 8 },
  typeBtn: {
    flex: 1, padding: 12, borderRadius: 8,
    backgroundColor: colors.surface.background,
    alignItems: 'center', borderWidth: 2, borderColor: colors.surface.border,
  },
  typeBtnText: { color: colors.text.secondary, fontWeight: '600', fontSize: 14 },
  menuList: { flex: 1, marginHorizontal: 4 },
  menuCard: {
    flex: 1, backgroundColor: colors.surface.background,
    margin: 4, borderRadius: 10, padding: 12,
    alignItems: 'center', position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 2, elevation: 1,
  },
  menuName: { color: colors.text.primary, fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 6 },
  menuPrice: { fontSize: 16, fontWeight: '700' },
  badge: {
    position: 'absolute', top: 6, right: 6,
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  cartBar: {
    backgroundColor: colors.surface.background,
    padding: 16, borderTopWidth: 1, borderTopColor: colors.surface.border,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  cartSummary: { color: colors.text.primary, flex: 1, fontSize: 15, fontWeight: '600' },
  placeOrderBtn: {
    backgroundColor: ACCENT, paddingVertical: 12,
    paddingHorizontal: 20, borderRadius: 8, minWidth: 160, alignItems: 'center',
  },
  placeOrderText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  disabled: { opacity: 0.5 },
});

export default QuickOrderScreen;
