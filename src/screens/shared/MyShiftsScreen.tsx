// src/screens/shared/MyShiftsScreen.tsx
// Clock in/out + today's session + recent session history
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  useGetMyActiveSessionQuery,
  useGetMySessionHistoryQuery,
  useClockInMutation,
  useClockOutMutation,
} from '../../store/api/crewApi';
import { colors, typography, spacing, borderRadius, shadows, getRoleColor } from '../../styles/driverDesignTokens';

const formatDuration = (loginTime: string, logoutTime?: string): string => {
  const start = new Date(loginTime).getTime();
  const end = logoutTime ? new Date(logoutTime).getTime() : Date.now();
  const mins = Math.floor((end - start) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

const MyShiftsScreen = () => {
  const user = useSelector(selectCurrentUser);
  const roleColor = getRoleColor(user?.type);
  const [refreshing, setRefreshing] = useState(false);

  const { data: activeSession, isLoading: sessionLoading, isError: sessionError, refetch: refetchSession } =
    useGetMyActiveSessionQuery(user?.id ?? '', { skip: !user?.id });

  const { data: history = [], isLoading: historyLoading, isError: historyError, refetch: refetchHistory } =
    useGetMySessionHistoryQuery({ employeeId: user?.id ?? '' }, { skip: !user?.id });

  const [clockIn, { isLoading: clockingIn }] = useClockInMutation();
  const [clockOut, { isLoading: clockingOut }] = useClockOutMutation();

  const isLoading = sessionLoading || historyLoading;
  const hasError = sessionError || historyError;

  const handleClockIn = async () => {
    if (!user?.id || !user?.storeId) {
      Alert.alert('Error', 'User or store information missing');
      return;
    }
    try {
      await clockIn({ employeeId: user.id, storeId: user.storeId }).unwrap();
      refetchSession();
    } catch {
      Alert.alert('Error', 'Could not clock in. Please try again.');
    }
  };

  const handleClockOut = async () => {
    if (!activeSession) return;
    Alert.alert('Clock Out', 'Are you sure you want to clock out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clock Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await clockOut({ sessionId: activeSession.id }).unwrap();
            refetchSession();
            refetchHistory();
          } catch {
            Alert.alert('Error', 'Could not clock out. Please try again.');
          }
        },
      },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchSession(), refetchHistory()]);
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={roleColor} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={roleColor} />}
    >
      {hasError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>Could not load shift data. Pull to refresh.</Text>
        </View>
      )}

      {/* Clock In/Out Card */}
      <View style={[styles.clockCard, { borderTopColor: roleColor }]}>
        {activeSession ? (
          <>
            <View style={styles.clockActiveRow}>
              <View style={[styles.activeDot, { backgroundColor: roleColor }]} />
              <Text style={[styles.clockActiveText, { color: roleColor }]}>Clocked In</Text>
            </View>
            <Text style={styles.clockTime}>Since {formatTime(activeSession.loginTime)}</Text>
            <Text style={styles.clockDuration}>{formatDuration(activeSession.loginTime)}</Text>
            <TouchableOpacity
              style={[styles.clockBtn, { backgroundColor: colors.semantic.error }]}
              onPress={handleClockOut}
              disabled={clockingOut}
              activeOpacity={0.8}
            >
              {clockingOut
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.clockBtnText}>Clock Out</Text>
              }
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Icon name="timer" size={40} color={colors.text.tertiary} style={styles.timerIcon} />
            <Text style={styles.clockInPrompt}>Not clocked in</Text>
            <TouchableOpacity
              style={[styles.clockBtn, { backgroundColor: roleColor }]}
              onPress={handleClockIn}
              disabled={clockingIn}
              activeOpacity={0.8}
            >
              {clockingIn
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.clockBtnText}>Clock In</Text>
              }
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Session History */}
      <Text style={styles.sectionLabel}>RECENT SESSIONS</Text>
      {history.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No past sessions found</Text>
        </View>
      ) : (
        history.map((session) => (
          <View key={session.id} style={styles.sessionRow}>
            <View style={styles.sessionLeft}>
              <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
              <Text style={styles.sessionTimes}>
                {formatTime(session.loginTime)}
                {session.logoutTime ? ` → ${formatTime(session.logoutTime)}` : ' → ongoing'}
              </Text>
            </View>
            <View style={styles.sessionRight}>
              <Text style={[styles.sessionHours, { color: roleColor }]}>
                {session.totalHours != null
                  ? `${session.totalHours.toFixed(1)}h`
                  : formatDuration(session.loginTime, session.logoutTime)}
              </Text>
              <View style={[
                styles.sessionStatus,
                { backgroundColor: session.status === 'ACTIVE' ? roleColor + '22' : colors.surface.backgroundAlt }
              ]}>
                <Text style={[
                  styles.sessionStatusText,
                  { color: session.status === 'ACTIVE' ? roleColor : colors.text.tertiary }
                ]}>
                  {session.status}
                </Text>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.backgroundAlt },
  content: { padding: spacing.base, paddingBottom: spacing.xxxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  clockCard: {
    backgroundColor: colors.surface.background,
    borderRadius: borderRadius.md,
    borderTopWidth: 4,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.subtle,
  },
  clockActiveRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  activeDot: { width: 10, height: 10, borderRadius: 5 },
  clockActiveText: { fontSize: typography.fontSize.body, fontWeight: '700' },
  clockTime: { fontSize: typography.fontSize.h2, color: colors.text.secondary, marginBottom: spacing.xs },
  clockDuration: { fontSize: 40, fontWeight: '800', color: colors.text.primary, marginBottom: spacing.lg },
  timerIcon: { marginBottom: spacing.base },
  clockInPrompt: { fontSize: typography.fontSize.body, color: colors.text.secondary, marginBottom: spacing.lg },
  clockBtn: {
    paddingVertical: spacing.base, paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.sm, minWidth: 180, alignItems: 'center',
  },
  clockBtnText: { color: '#fff', fontWeight: '700', fontSize: typography.fontSize.body },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.text.tertiary,
    letterSpacing: 1, marginBottom: spacing.sm,
  },
  emptyCard: {
    backgroundColor: colors.surface.background,
    borderRadius: borderRadius.md, padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: { color: colors.text.secondary, fontSize: typography.fontSize.body },
  sessionRow: {
    backgroundColor: colors.surface.background,
    borderRadius: borderRadius.sm,
    padding: spacing.base,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.subtle,
  },
  sessionLeft: { flex: 1 },
  sessionDate: { fontSize: typography.fontSize.body, fontWeight: '600', color: colors.text.primary, marginBottom: 2 },
  sessionTimes: { fontSize: typography.fontSize.caption, color: colors.text.secondary },
  sessionRight: { alignItems: 'flex-end', gap: 4 },
  sessionHours: { fontSize: typography.fontSize.h2, fontWeight: '800' },
  sessionStatus: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  sessionStatusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  errorBanner: { backgroundColor: colors.semantic.errorBg, padding: spacing.base, borderRadius: borderRadius.sm, marginBottom: spacing.base, alignItems: 'center' },
  errorBannerText: { color: colors.semantic.error, fontSize: typography.fontSize.caption, fontWeight: '600' },
});

export default MyShiftsScreen;
