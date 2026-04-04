// src/screens/shared/MyEarningsScreen.tsx
import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { colors, typography, spacing, borderRadius, shadows, getRoleColor } from '../../styles/driverDesignTokens';
import { useGetMyWeeklyEarningsQuery } from '../../store/api/crewApi';

const fmt = (n: number) => `₹${n.toFixed(2)}`;
const fmtHours = (n: number) => `${n.toFixed(1)}h`;

const StatCard = ({
  icon, label, value, accent,
}: { icon: string; label: string; value: string; accent: string }) => (
  <View style={[styles.statCard, { borderTopColor: accent }]}>
    <Icon name={icon} size={24} color={accent} style={{ marginBottom: spacing.xs }} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const MyEarningsScreen = () => {
  const user = useSelector(selectCurrentUser);
  const accent = getRoleColor(user?.type);
  const employeeId = user?.id ?? '';

  const {
    data: earnings,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetMyWeeklyEarningsQuery(
    { employeeId },
    { skip: !employeeId, pollingInterval: 300000 }
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={accent} />
      </View>
    );
  }

  const isNotFound = isError && (error as { status?: number })?.status === 404;

  if (isNotFound || (!isLoading && !isError && !earnings)) {
    return (
      <View style={styles.centered}>
        <Icon name="schedule" size={40} color={colors.text.tertiary} />
        <Text style={styles.errorText}>No earnings recorded yet this week.</Text>
        <Text style={styles.retryText} onPress={refetch}>Tap to refresh</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Icon name="error-outline" size={40} color={colors.text.tertiary} />
        <Text style={styles.errorText}>Could not load earnings.</Text>
        <Text style={styles.retryText} onPress={refetch}>Tap to retry</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={accent} />}
    >
      <Text style={styles.heading}>My Earnings</Text>
      <Text style={styles.weekLabel}>
        {new Date(earnings.weekStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        {' – '}
        {new Date(earnings.weekEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
      </Text>

      <View style={styles.grid}>
        <StatCard icon="payments"           label="Total This Week"  value={fmt(earnings.totalInr)}        accent={accent} />
        <StatCard icon="schedule"           label="Hours Worked"     value={fmtHours(earnings.hoursWorked)} accent={accent} />
        <StatCard icon="account-balance"    label="Base Pay"         value={fmt(earnings.basePayInr)}       accent={accent} />
        <StatCard icon="volunteer-activism" label="Tips Received"    value={fmt(earnings.tipsInr)}          accent={accent} />
      </View>

      {earnings.hourlyRateInr == null ? (
        <View style={[styles.infoBanner, { borderLeftColor: accent }]}>
          <Icon name="info" size={20} color={accent} />
          <Text style={styles.infoText}>
            Pay rate not configured. Contact your manager to set up your hourly rate.
          </Text>
        </View>
      ) : (
        <View style={[styles.rateRow, { borderColor: colors.surface.border }]}>
          <Text style={styles.rateLabel}>Hourly Rate</Text>
          <Text style={[styles.rateValue, { color: accent }]}>
            {fmt(earnings.hourlyRateInr)} / hr
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.backgroundAlt },
  content: { padding: spacing.base, paddingBottom: spacing.xxxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  heading: {
    fontSize: typography.fontSize.h1, fontWeight: '800',
    color: colors.text.primary, marginBottom: spacing.xs,
  },
  weekLabel: {
    fontSize: typography.fontSize.body, color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg,
  },
  statCard: {
    width: '47%', backgroundColor: colors.surface.background,
    borderRadius: borderRadius.md, padding: spacing.base,
    alignItems: 'center', borderTopWidth: 3, ...shadows.subtle,
  },
  statValue: {
    fontSize: typography.fontSize.h2, fontWeight: '700',
    color: colors.text.primary, marginBottom: 2,
  },
  statLabel: {
    fontSize: typography.fontSize.caption, color: colors.text.secondary, textAlign: 'center',
  },
  infoBanner: {
    flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start',
    backgroundColor: colors.surface.background,
    borderRadius: borderRadius.md, padding: spacing.base,
    borderLeftWidth: 3, ...shadows.subtle, marginBottom: spacing.base,
  },
  infoText: {
    flex: 1, fontSize: typography.fontSize.caption,
    color: colors.text.secondary, lineHeight: 20,
  },
  rateRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface.background,
    borderRadius: borderRadius.md, padding: spacing.base,
    borderWidth: 1, ...shadows.subtle,
  },
  rateLabel: { fontSize: typography.fontSize.body, color: colors.text.secondary },
  rateValue: { fontSize: typography.fontSize.body, fontWeight: '700' },
  errorText: { fontSize: typography.fontSize.body, color: colors.text.secondary, marginTop: spacing.sm },
  retryText: { fontSize: typography.fontSize.caption, color: colors.text.tertiary, marginTop: spacing.xs },
});

export default MyEarningsScreen;
