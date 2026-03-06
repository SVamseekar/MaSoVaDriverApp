// src/screens/shared/MyProfileScreen.tsx
// Personal profile for all staff roles — name, role badge, store, contact, logout
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Switch,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { logout } from '../../store/slices/authSlice';
import { colors, typography, spacing, borderRadius, shadows } from '../../styles/driverDesignTokens';
import type { RootState } from '../../store/store';

const ROLE_LABELS: Record<string, string> = {
  DRIVER: 'Driver',
  KITCHEN_STAFF: 'Kitchen Staff',
  STAFF: 'Kitchen Staff',
  CASHIER: 'Cashier',
  KIOSK: 'Cashier',
  MANAGER: 'Manager',
  ASSISTANT_MANAGER: 'Asst. Manager',
};

const ROLE_ICONS: Record<string, string> = {
  DRIVER: 'local-shipping',
  KITCHEN_STAFF: 'restaurant',
  STAFF: 'restaurant',
  CASHIER: 'point-of-sale',
  KIOSK: 'point-of-sale',
  MANAGER: 'manage-accounts',
  ASSISTANT_MANAGER: 'manage-accounts',
};

const MyProfileScreen = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const getRoleColor = (type?: string) => {
    if (type === 'DRIVER') return colors.roles.driver;
    if (type === 'KITCHEN_STAFF' || type === 'STAFF') return colors.roles.kitchen;
    if (type === 'CASHIER' || type === 'KIOSK') return colors.roles.kiosk;
    if (type === 'MANAGER' || type === 'ASSISTANT_MANAGER') return colors.roles.manager;
    return colors.roles.driver;
  };
  const roleColor = getRoleColor(user?.type);
  const roleLabel = ROLE_LABELS[user?.type ?? ''] ?? user?.type ?? 'Staff';
  const roleIcon = ROLE_ICONS[user?.type ?? ''] ?? 'person';

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => dispatch(logout()),
      },
    ]);
  };

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Avatar + Name */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: roleColor + '22', borderColor: roleColor }]}>
          <Text style={[styles.initials, { color: roleColor }]}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user?.name ?? 'Staff Member'}</Text>
        <View style={[styles.rolePill, { backgroundColor: roleColor + '22' }]}>
          <Icon name={roleIcon} size={14} color={roleColor} />
          <Text style={[styles.roleText, { color: roleColor }]}>{roleLabel}</Text>
        </View>
        <Text style={styles.store}>
          {user?.storeId ? `Store: ${user.storeId}` : 'No store assigned'}
        </Text>
      </View>

      {/* Info Card */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>MY DETAILS</Text>
        <InfoRow icon="email" label="Email" value={user?.email ?? '—'} />
        <InfoRow icon="phone" label="Phone" value={user?.phone ?? '—'} />
        <InfoRow icon="badge" label="Employee ID" value={user?.id?.slice(0, 8).toUpperCase() ?? '—'} />
        <InfoRow icon="store" label="Store" value={user?.storeId ?? '—'} last />
      </View>

      {/* Settings Card */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>SETTINGS</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Icon name="notifications" size={20} color={colors.text.secondary} />
            <Text style={styles.settingLabel}>Push Notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ true: roleColor, false: colors.surface.border }}
            thumbColor={colors.surface.background}
          />
        </View>
      </View>

      {/* App Info */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>APP</Text>
        <InfoRow icon="info" label="Version" value="1.0.0" />
        <InfoRow icon="security" label="Role" value={roleLabel} last />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Icon name="logout" size={20} color={colors.semantic.error} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

    </ScrollView>
  );
};

const InfoRow = ({ icon, label, value, last = false }: {
  icon: string; label: string; value: string; last?: boolean;
}) => (
  <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
    <Icon name={icon} size={18} color={colors.text.secondary} style={styles.infoIcon} />
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.backgroundAlt },
  content: { padding: spacing.base, paddingBottom: spacing.xxxl },
  header: { alignItems: 'center', paddingVertical: spacing.xl },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, marginBottom: spacing.base,
  },
  initials: { fontSize: 32, fontWeight: '800' },
  name: { fontSize: typography.fontSize.h1, fontWeight: '800', color: colors.text.primary, marginBottom: spacing.sm },
  rolePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.base, paddingVertical: spacing.xs,
    borderRadius: borderRadius.full, marginBottom: spacing.sm,
  },
  roleText: { fontSize: typography.fontSize.caption, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  store: { fontSize: typography.fontSize.caption, color: colors.text.secondary },
  card: {
    backgroundColor: colors.surface.background,
    borderRadius: borderRadius.md, marginBottom: spacing.base,
    ...shadows.subtle,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.text.tertiary,
    letterSpacing: 1, padding: spacing.base, paddingBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.base, paddingVertical: 14,
  },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.surface.border },
  infoIcon: { marginRight: spacing.sm },
  infoLabel: { flex: 1, fontSize: typography.fontSize.body, color: colors.text.secondary },
  infoValue: { fontSize: typography.fontSize.body, color: colors.text.primary, fontWeight: '500', maxWidth: '55%' },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingVertical: 12,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  settingLabel: { fontSize: typography.fontSize.body, color: colors.text.primary },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.semantic.errorBg,
    padding: spacing.base, borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  logoutText: { color: colors.semantic.error, fontWeight: '700', fontSize: typography.fontSize.body },
});

export default MyProfileScreen;
