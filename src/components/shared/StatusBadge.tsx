import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing, borderRadius, typography, animations } from '../../styles/driverDesignTokens';

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'delivering' | 'idle';
  label?: string;
  showPulse?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  showPulse = true,
  size = 'medium',
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (showPulse && status === 'online') {
      // Create pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: animations.duration.slow,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: animations.duration.slow,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status, showPulse]);

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return colors.status.online;
      case 'offline':
        return colors.status.offline;
      case 'delivering':
        return colors.status.delivering;
      case 'idle':
        return colors.status.idle;
      default:
        return colors.text.secondary;
    }
  };

  const getStatusText = () => {
    if (label) return label;

    switch (status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'delivering':
        return 'Delivering';
      case 'idle':
        return 'Idle';
      default:
        return status;
    }
  };

  const getDotSize = () => {
    switch (size) {
      case 'small':
        return 6;
      case 'large':
        return 12;
      default:
        return 8;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return typography.fontSize.tiny;
      case 'large':
        return typography.fontSize.body;
      default:
        return typography.fontSize.small;
    }
  };

  const statusColor = getStatusColor();

  return (
    <View style={[styles.container, size === 'small' && styles.containerSmall]}>
      <Animated.View
        style={[
          styles.dot,
          {
            width: getDotSize(),
            height: getDotSize(),
            backgroundColor: statusColor,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
      <Text style={[styles.text, { fontSize: getFontSize(), color: statusColor }]}>
        {getStatusText()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface.backgroundAlt,
    borderRadius: borderRadius.full,
  },
  containerSmall: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dot: {
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  text: {
    fontWeight: typography.fontWeight.semibold,
  },
});

export default StatusBadge;
