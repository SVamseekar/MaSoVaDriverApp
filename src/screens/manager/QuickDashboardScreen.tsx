// src/screens/manager/QuickDashboardScreen.tsx
// Quick KPI overview for managers and assistant managers
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { colors } from '../../styles/driverDesignTokens';

interface KPI { label: string; value: string; sub?: string; color: string; }

const API_BASE = 'http://10.0.2.2:8080';

const QuickDashboardScreen = () => {
  const user = useSelector(selectCurrentUser);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const storeId = user?.storeId ?? '';

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/api/analytics/summary?storeId=${storeId}`);
      if (res.ok) {
        const d = await res.json();
        setKpis([
          { label: "Today's Orders", value: String(d.todayOrders ?? '—'), color: colors.roles.kiosk },
          { label: "Today's Revenue", value: d.todayRevenue ? `\u20B9${d.todayRevenue.toLocaleString('en-IN')}` : '—', color: '#10b981' },
          { label: 'Active Orders', value: String(d.activeOrders ?? '—'), color: colors.roles.kitchen },
          { label: 'Avg Prep Time', value: d.avgPrepTime ? `${d.avgPrepTime}m` : '—', color: colors.text.secondary },
        ]);
      }
    } catch {
      setKpis([
        { label: "Today's Orders", value: '—', color: colors.roles.kiosk },
        { label: "Today's Revenue", value: '—', color: '#10b981' },
        { label: 'Active Orders', value: '—', color: colors.roles.kitchen },
        { label: 'Avg Prep Time', value: '—', color: colors.text.secondary },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [storeId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.roles.manager} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={colors.roles.manager} />
      }
    >
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Good {getTimeGreeting()},</Text>
        <Text style={styles.nameText}>{user?.name ?? 'Manager'}</Text>
        <Text style={styles.storeText}>Store: {storeId || 'Not assigned'}</Text>
      </View>

      <Text style={styles.sectionLabel}>TODAY'S OVERVIEW</Text>
      <View style={styles.grid}>
        {kpis.map((k, i) => (
          <View key={i} style={[styles.kpiCard, { borderTopColor: k.color }]}>
            <Text style={[styles.kpiValue, { color: k.color }]}>{k.value}</Text>
            <Text style={styles.kpiLabel}>{k.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.hint}>Pull down to refresh</Text>
    </ScrollView>
  );
};

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.backgroundAlt },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  welcomeSection: {
    backgroundColor: colors.surface.background,
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  welcomeText: { fontSize: 14, color: colors.text.secondary },
  nameText: { fontSize: 24, fontWeight: '800', color: colors.text.primary, marginTop: 2 },
  storeText: { fontSize: 13, color: colors.text.tertiary, marginTop: 4 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.tertiary,
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  kpiCard: {
    width: '46%',
    margin: '2%',
    backgroundColor: colors.surface.background,
    borderRadius: 12,
    padding: 16,
    borderTopWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  kpiValue: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  kpiLabel: { fontSize: 13, color: colors.text.secondary },
  hint: { textAlign: 'center', color: colors.text.tertiary, fontSize: 12, padding: 24 },
});

export default QuickDashboardScreen;
