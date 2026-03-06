// src/screens/shared/MyEarningsScreen.tsx
// Weekly earnings + tips summary — backend not yet implemented (Phase 6)
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { colors, typography, spacing, borderRadius, shadows } from '../../styles/driverDesignTokens';

const getRoleColor = (type?: string) => {
  if (type === 'DRIVER') return colors.roles.driver;
  if (type === 'KITCHEN_STAFF' || type === 'STAFF') return colors.roles.kitchen;
  if (type === 'CASHIER' || type === 'KIOSK') return colors.roles.kiosk;
  if (type === 'MANAGER' || type === 'ASSISTANT_MANAGER') return colors.roles.manager;
  return colors.roles.driver;
};

const ComingSoonBadge = ({ label, icon }: { label: string; icon: string }) => (
  <View style={styles.comingSoonCard}>
    <Icon name={icon} size={32} color={colors.text.tertiary} style={{ marginBottom: spacing.sm }} />
    <Text style={styles.comingSoonLabel}>{label}</Text>
    <View style={styles.comingSoonPill}>
      <Text style={styles.comingSoonPillText}>Coming Soon</Text>
    </View>
  </View>
);

const MyEarningsScreen = () => {
  const user = useSelector(selectCurrentUser);
  const roleColor = getRoleColor(user?.type);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <Text style={styles.heading}>My Earnings</Text>
      <Text style={styles.subheading}>
        Salary and tips tracking is being set up.{'\n'}
        Your earnings will appear here soon.
      </Text>

      {/* Coming soon cards */}
      <View style={styles.grid}>
        <ComingSoonBadge label="This Week's Pay" icon="payments" />
        <ComingSoonBadge label="Tips Received" icon="volunteer-activism" />
        <ComingSoonBadge label="Hours Worked" icon="schedule" />
        <ComingSoonBadge label="Monthly Summary" icon="bar-chart" />
      </View>

      {/* Info banner */}
      <View style={[styles.infoBanner, { borderLeftColor: roleColor }]}>
        <Icon name="info" size={20} color={roleColor} />
        <Text style={styles.infoText}>
          Earnings tracking requires your store to configure pay rates.
          Contact your manager to get this set up.
        </Text>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.backgroundAlt },
  content: { padding: spacing.base, paddingBottom: spacing.xxxl },
  heading: {
    fontSize: typography.fontSize.h1, fontWeight: '800',
    color: colors.text.primary, marginBottom: spacing.xs,
  },
  subheading: {
    fontSize: typography.fontSize.body, color: colors.text.secondary,
    marginBottom: spacing.xl, lineHeight: 22,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg,
  },
  comingSoonCard: {
    width: '47%', backgroundColor: colors.surface.background,
    borderRadius: borderRadius.md, padding: spacing.base,
    alignItems: 'center', ...shadows.subtle,
  },
  comingSoonLabel: {
    fontSize: typography.fontSize.caption, fontWeight: '600',
    color: colors.text.secondary, textAlign: 'center', marginBottom: spacing.sm,
  },
  comingSoonPill: {
    backgroundColor: colors.surface.backgroundAlt,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  comingSoonPillText: { fontSize: 10, color: colors.text.tertiary, fontWeight: '600' },
  infoBanner: {
    flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start',
    backgroundColor: colors.surface.background,
    borderRadius: borderRadius.md, padding: spacing.base,
    borderLeftWidth: 3, ...shadows.subtle,
  },
  infoText: {
    flex: 1, fontSize: typography.fontSize.caption,
    color: colors.text.secondary, lineHeight: 20,
  },
});

export default MyEarningsScreen;
