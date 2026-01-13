import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, shadows, typography } from '../../styles/driverDesignTokens';

export interface Delivery {
  id: string;
  orderNumber: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  estimatedDeliveryTime: string;
  distance?: string;
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered';
  orderTotal: number;
}

interface DeliveryCardProps {
  delivery: Delivery;
  onPress?: () => void;
  showActions?: boolean;
}

export const DeliveryCard: React.FC<DeliveryCardProps> = ({
  delivery,
  onPress,
  showActions = false,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return colors.status.idle;
      case 'picked_up':
        return colors.status.delivering;
      case 'in_transit':
        return colors.status.delivering;
      case 'delivered':
        return colors.semantic.success;
      default:
        return colors.text.secondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'Assigned';
      case 'picked_up':
        return 'Picked Up';
      case 'in_transit':
        return 'In Transit';
      case 'delivered':
        return 'Delivered';
      default:
        return status;
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.orderNumber}>#{delivery.orderNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(delivery.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(delivery.status) }]}>
            {getStatusText(delivery.status)}
          </Text>
        </View>
      </View>

      {/* Customer Info */}
      <View style={styles.section}>
        <Text style={styles.customerName}>{delivery.customerName}</Text>
        <Text style={styles.address} numberOfLines={2}>
          {delivery.customerAddress}
        </Text>
        <Text style={styles.phone}>{delivery.customerPhone}</Text>
      </View>

      {/* Delivery Info */}
      <View style={styles.footer}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>ETA</Text>
          <Text style={styles.infoValue}>{delivery.estimatedDeliveryTime}</Text>
        </View>

        {delivery.distance && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Distance</Text>
            <Text style={styles.infoValue}>{delivery.distance}</Text>
          </View>
        )}

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Amount</Text>
          <Text style={styles.infoValue}>₹{delivery.orderTotal.toFixed(2)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.background,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  orderNumber: {
    fontSize: typography.fontSize.h2,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.semibold,
  },
  section: {
    marginBottom: spacing.md,
  },
  customerName: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  address: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    lineHeight: typography.fontSize.caption * typography.lineHeight.normal,
  },
  phone: {
    fontSize: typography.fontSize.caption,
    color: colors.primary.green,
    fontWeight: typography.fontWeight.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.fontSize.tiny,
    color: colors.text.tertiary,
    marginBottom: spacing.xs / 2,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
});

export default DeliveryCard;
