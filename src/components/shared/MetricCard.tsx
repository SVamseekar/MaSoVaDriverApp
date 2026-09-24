import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadows, typography } from '../../styles/driverDesignTokens';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon,
  trend,
  variant = 'default',
}) => {
  const getVariantColor = () => {
    switch (variant) {
      case 'success':
        return colors.semantic.success;
      case 'warning':
        return colors.semantic.warning;
      case 'error':
        return colors.semantic.error;
      default:
        return colors.primary.green;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return colors.semantic.success;
      case 'down':
        return colors.semantic.error;
      default:
        return colors.text.tertiary;
    }
  };

  return (
    <View style={styles.card}>
      {/* Icon */}
      {icon && (
        <View style={[styles.iconContainer, { backgroundColor: getVariantColor() + '20' }]}>
          {icon}
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color: getVariantColor() }]}>
          {value}
        </Text>

        {/* Trend */}
        {trend && (
          <View style={styles.trendContainer}>
            <Text style={[styles.trendIndicator, { color: getTrendColor() }]}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.background,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    ...shadows.subtle,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: typography.fontSize.hero,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize.hero * 1.2,
  },
  trendContainer: {
    marginTop: spacing.xs,
  },
  trendIndicator: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
  },
});

export default MetricCard;
