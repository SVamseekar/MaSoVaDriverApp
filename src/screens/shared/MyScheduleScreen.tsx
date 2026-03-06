// src/screens/shared/MyScheduleScreen.tsx
// Upcoming shifts calendar view for all staff roles
import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useGetMyUpcomingShiftsQuery } from '../../store/api/crewApi';
import { colors, typography, spacing, borderRadius, shadows, getRoleColor } from '../../styles/driverDesignTokens';

const formatShiftDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

const formatShiftTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

const shiftDuration = (start: string, end: string) => {
  const mins = (new Date(end).getTime() - new Date(start).getTime()) / 60000;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const isToday = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  return d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
};

const MyScheduleScreen = () => {
  const user = useSelector(selectCurrentUser);
  const roleColor = getRoleColor(user?.type);
  const [refreshing, setRefreshing] = useState(false);

  const { data: shifts = [], isLoading, isError, refetch } = useGetMyUpcomingShiftsQuery(
    { employeeId: user?.id ?? '', storeId: user?.storeId ?? '' },
    { skip: !user?.id }
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={roleColor} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Icon name="cloud-off" size={48} color={colors.text.tertiary} />
        <Text style={styles.emptyTitle}>Could not load schedule</Text>
        <Text style={styles.emptySubtitle}>Pull to refresh and try again</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={roleColor} />}
    >
      <Text style={styles.heading}>Upcoming Shifts</Text>

      {shifts.length === 0 ? (
        <View style={styles.emptyCard}>
          <Icon name="event-available" size={48} color={colors.text.tertiary} />
          <Text style={styles.emptyTitle}>No upcoming shifts</Text>
          <Text style={styles.emptySubtitle}>Your schedule will appear here once assigned</Text>
        </View>
      ) : (
        shifts.map((shift) => {
          const today = isToday(shift.scheduledStart);
          return (
            <View key={shift.id} style={[styles.shiftCard, today && { borderLeftColor: roleColor, borderLeftWidth: 4 }]}>
              {today && (
                <View style={[styles.todayBadge, { backgroundColor: roleColor }]}>
                  <Text style={styles.todayText}>TODAY</Text>
                </View>
              )}
              <Text style={styles.shiftDate}>{formatShiftDate(shift.scheduledStart)}</Text>
              <View style={styles.timeRow}>
                <Icon name="schedule" size={16} color={colors.text.secondary} />
                <Text style={styles.shiftTime}>
                  {formatShiftTime(shift.scheduledStart)} → {formatShiftTime(shift.scheduledEnd)}
                </Text>
                <Text style={[styles.shiftDuration, { color: roleColor }]}>
                  {shiftDuration(shift.scheduledStart, shift.scheduledEnd)}
                </Text>
              </View>
              {shift.notes ? (
                <Text style={styles.shiftNotes}>{shift.notes}</Text>
              ) : null}
            </View>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.backgroundAlt },
  content: { padding: spacing.base, paddingBottom: spacing.xxxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: {
    fontSize: typography.fontSize.h2, fontWeight: '700',
    color: colors.text.primary, marginBottom: spacing.base,
  },
  emptyCard: {
    backgroundColor: colors.surface.background,
    borderRadius: borderRadius.md, padding: spacing.xl,
    alignItems: 'center', gap: spacing.sm,
  },
  emptyTitle: { fontSize: typography.fontSize.h2, fontWeight: '700', color: colors.text.primary },
  emptySubtitle: { fontSize: typography.fontSize.caption, color: colors.text.secondary, textAlign: 'center' },
  shiftCard: {
    backgroundColor: colors.surface.background,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.sm,
    borderLeftWidth: 0,
    ...shadows.subtle,
  },
  todayBadge: {
    alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderRadius: borderRadius.full, marginBottom: spacing.sm,
  },
  todayText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  shiftDate: { fontSize: typography.fontSize.body, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.xs },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  shiftTime: { flex: 1, fontSize: typography.fontSize.body, color: colors.text.secondary },
  shiftDuration: { fontSize: typography.fontSize.caption, fontWeight: '700' },
  shiftNotes: { fontSize: typography.fontSize.caption, color: colors.text.tertiary, marginTop: spacing.sm },
});

export default MyScheduleScreen;
