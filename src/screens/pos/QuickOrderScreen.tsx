// src/screens/pos/QuickOrderScreen.tsx
// Cashier POS — quick order entry for TAKEAWAY and DINE_IN
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { RootState } from '../../store/store';
import { colors, typography, spacing, borderRadius } from '../../styles/driverDesignTokens';
import { API_CONFIG } from '../../config/api.config';

const API_BASE = API_CONFIG.API_GATEWAY_URL.replace('/api', '');

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
}

interface CartItem extends MenuItem {
  quantity: number;
}

const QuickOrderScreen = () => {
  const user = useSelector(selectCurrentUser);
  const token = useSelector((state: RootState) => state.auth.accessToken);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState<'TAKEAWAY' | 'DINE_IN'>('TAKEAWAY');
  const [tableNumber, setTableNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/menu?storeId=${user?.storeId}&available=true`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setMenu(Array.isArray(data) ? data : data.content ?? []);
      }
    } catch (e) {
      console.warn('Menu fetch failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === itemId);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter(c => c.id !== itemId);
      return prev.map(c => c.id === itemId ? { ...c, quantity: c.quantity - 1 } : c);
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!customerName.trim()) {
      Alert.alert('Required', 'Enter customer name');
      return;
    }
    if (cart.length === 0) {
      Alert.alert('Required', 'Add at least one item');
      return;
    }
    if (orderType === 'DINE_IN' && !tableNumber.trim()) {
      Alert.alert('Required', 'Enter table number for dine-in');
      return;
    }

    setPlacing(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          storeId: user?.storeId,
          customerName: customerName.trim(),
          orderType,
          tableNumber: orderType === 'DINE_IN' ? tableNumber.trim() : undefined,
          paymentMethod: 'CASH',
          createdByStaffId: user?.id,
          items: cart.map(i => ({
            menuItemId: i.id,
            name: i.name,
            quantity: i.quantity,
            price: i.price,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Order failed');
      }

      Alert.alert(
        'Order Placed',
        `\u20B9${cartTotal.toFixed(0)} \u2014 collect cash from customer`,
        [{
          text: 'New Order',
          onPress: () => {
            setCart([]);
            setCustomerName('');
            setTableNumber('');
          },
        }]
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not place order';
      Alert.alert('Error', msg);
    } finally {
      setPlacing(false);
    }
  };

  const cartQty = (itemId: string) => cart.find(c => c.id === itemId)?.quantity ?? 0;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.roles.kiosk} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.nameInput}
        placeholder="Customer name"
        placeholderTextColor={colors.text.tertiary}
        value={customerName}
        onChangeText={setCustomerName}
      />

      <View style={styles.typeRow}>
        {(['TAKEAWAY', 'DINE_IN'] as const).map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.typeBtn, orderType === type && { borderColor: colors.roles.kiosk, backgroundColor: '#EBF5FB' }]}
            onPress={() => setOrderType(type)}
          >
            <Text style={[styles.typeBtnText, orderType === type && { color: colors.roles.kiosk }]}>
              {type === 'TAKEAWAY' ? 'Takeaway' : 'Dine In'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {orderType === 'DINE_IN' && (
        <TextInput
          style={styles.nameInput}
          placeholder="Table number"
          placeholderTextColor={colors.text.tertiary}
          value={tableNumber}
          onChangeText={setTableNumber}
          keyboardType="numeric"
        />
      )}

      {menu.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No menu items available</Text>
        </View>
      ) : (
        <FlatList
          data={menu}
          numColumns={2}
          keyExtractor={item => item.id}
          style={styles.menuList}
          renderItem={({ item }) => {
            const qty = cartQty(item.id);
            return (
              <View style={styles.menuItem}>
                <Text style={styles.menuName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.menuPrice}>&#x20B9;{item.price}</Text>
                {qty === 0 ? (
                  <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: colors.roles.kiosk }]}
                    onPress={() => addToCart(item)}
                  >
                    <Text style={styles.addBtnText}>Add</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.qtyRow}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item.id)}>
                      <Text style={styles.qtyBtnText}>{'\u2212'}</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyCount}>{qty}</Text>
                    <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: colors.roles.kiosk }]} onPress={() => addToCart(item)}>
                      <Text style={[styles.qtyBtnText, { color: '#fff' }]}>+</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}

      {cart.length > 0 && (
        <View style={styles.cartBar}>
          <View>
            <Text style={styles.cartCount}>{cartCount} item{cartCount !== 1 ? 's' : ''}</Text>
            <Text style={styles.cartTotal}>&#x20B9;{cartTotal.toFixed(0)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.placeBtn, placing && styles.disabled]}
            onPress={handlePlaceOrder}
            disabled={placing}
          >
            {placing
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.placeBtnText}>Place Order (Cash)</Text>
            }
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.backgroundAlt },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { color: colors.text.secondary, fontSize: typography.fontSize.body },
  nameInput: {
    backgroundColor: colors.surface.background,
    color: colors.text.primary,
    fontSize: typography.fontSize.body,
    padding: spacing.base,
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  typeRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  typeBtn: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  typeBtnText: { color: colors.text.secondary, fontWeight: '600', fontSize: typography.fontSize.body },
  menuList: { flex: 1, marginTop: spacing.sm },
  menuItem: {
    flex: 1,
    backgroundColor: colors.surface.background,
    margin: spacing.xs,
    borderRadius: borderRadius.sm,
    padding: spacing.base,
    alignItems: 'center',
  },
  menuName: {
    color: colors.text.primary,
    fontSize: typography.fontSize.caption,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  menuPrice: {
    color: colors.roles.kiosk,
    fontSize: typography.fontSize.h2,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  addBtn: { paddingVertical: spacing.xs, paddingHorizontal: spacing.base, borderRadius: borderRadius.sm },
  addBtnText: { color: '#fff', fontWeight: '700' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  qtyBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.surface.backgroundAlt,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.surface.border,
  },
  qtyBtnText: { fontSize: 18, fontWeight: '700', color: colors.text.primary },
  qtyCount: { fontSize: typography.fontSize.body, fontWeight: '700', color: colors.text.primary, minWidth: 20, textAlign: 'center' },
  cartBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface.background,
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
  },
  cartCount: { color: colors.text.secondary, fontSize: typography.fontSize.caption },
  cartTotal: { color: colors.text.primary, fontSize: typography.fontSize.h2, fontWeight: '800' },
  placeBtn: {
    backgroundColor: colors.roles.kiosk,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeBtnText: { color: '#fff', fontWeight: '700', fontSize: typography.fontSize.body },
  disabled: { opacity: 0.6 },
});

export default QuickOrderScreen;
