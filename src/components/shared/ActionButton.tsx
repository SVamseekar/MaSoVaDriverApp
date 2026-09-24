import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, borderRadius, shadows, typography } from '../../styles/driverDesignTokens';

interface ActionButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.base,
      ...shadows.subtle,
    };

    // Size
    switch (size) {
      case 'small':
        baseStyle.height = 36;
        baseStyle.paddingHorizontal = spacing.md;
        break;
      case 'large':
        baseStyle.height = 56;
        baseStyle.paddingHorizontal = spacing.lg;
        break;
      default:
        baseStyle.height = 48;
    }

    // Variant
    switch (variant) {
      case 'primary':
        baseStyle.backgroundColor = colors.primary.green;
        break;
      case 'secondary':
        baseStyle.backgroundColor = colors.surface.backgroundAlt;
        break;
      case 'outline':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = colors.surface.borderDark;
        break;
      case 'danger':
        baseStyle.backgroundColor = colors.semantic.error;
        break;
    }

    // Disabled
    if (disabled || loading) {
      baseStyle.opacity = 0.5;
    }

    // Full width
    if (fullWidth) {
      baseStyle.width = '100%';
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: typography.fontWeight.semibold,
      marginLeft: icon ? spacing.sm : 0,
    };

    // Size
    switch (size) {
      case 'small':
        baseStyle.fontSize = typography.fontSize.small;
        break;
      case 'large':
        baseStyle.fontSize = typography.fontSize.h2;
        break;
      default:
        baseStyle.fontSize = typography.fontSize.body;
    }

    // Variant
    switch (variant) {
      case 'primary':
      case 'danger':
        baseStyle.color = colors.text.inverse;
        break;
      case 'secondary':
        baseStyle.color = colors.text.primary;
        break;
      case 'outline':
        baseStyle.color = colors.text.primary;
        break;
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? colors.text.inverse : colors.primary.green}
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export default ActionButton;
