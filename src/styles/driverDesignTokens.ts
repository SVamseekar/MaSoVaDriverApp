/**
 * Driver App Design Tokens - React Native
 * Hybrid Uber-Neumorphic Design System
 *
 * Philosophy:
 * - Primary: Clean, minimal Uber-style interface
 * - Accent: Strategic neumorphic elements for interactivity
 * - Goal: Professional, polished, premium delivery platform
 *
 * Adapted from web version for React Native
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const colors = {
  // Primary Colors (Uber-inspired)
  primary: {
    black: '#000000',      // Deep black for text
    white: '#FFFFFF',      // Pure white for backgrounds
    green: '#00B14F',      // Uber green for CTAs
    greenDark: '#009640',  // Darker green for hover/active
    greenLight: '#E8F5E9', // Light green for backgrounds
  },

  // Muted/Surface Colors
  surface: {
    background: '#FFFFFF',
    backgroundAlt: '#F6F6F6',
    backgroundMuted: '#FAFAFA',
    border: '#E8E8E8',
    borderDark: '#D0D0D0',
    disabled: '#AFAFAF',
  },

  // Text Colors
  text: {
    primary: '#000000',
    secondary: '#5E5E5E',
    tertiary: '#8E8E8E',
    disabled: '#AFAFAF',
    inverse: '#FFFFFF',
  },

  // Semantic Colors
  semantic: {
    success: '#00B14F',
    successBg: '#E8F5E9',
    warning: '#FFA726',
    warningBg: '#FFF3E0',
    error: '#F44336',
    errorBg: '#FFEBEE',
    info: '#2196F3',
    infoBg: '#E3F2FD',
  },

  // Status Colors
  status: {
    online: '#00B14F',
    offline: '#AFAFAF',
    delivering: '#2196F3',
    idle: '#FFA726',
  },

  // Role accent colors
  roles: {
    driver:           '#00B14F',  // Uber delivery green
    kitchen:          '#FF6B35',  // Warm orange — heat of the kitchen
    kiosk:            '#2196F3',  // Calm blue — POS/cashier
    manager:          '#7B1FA2',  // Deep purple — authority
    assistantManager: '#FF9800',  // Amber — support role
  },
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  fontFamily: {
    // React Native uses platform-specific system fonts
    primary: 'System',
    ios: 'System',
    android: 'Roboto',
  },

  fontSize: {
    hero: 32,       // Big numbers (earnings, stats)
    h1: 24,         // Page titles
    h2: 18,         // Section headers
    body: 16,       // Default text
    caption: 14,    // Secondary info
    small: 12,      // Timestamps, labels
    tiny: 10,       // Tags, badges
  },

  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// ============================================================================
// SPACING
// ============================================================================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// ============================================================================
// SHADOWS (React Native elevation + shadow properties)
// ============================================================================

export const shadows = {
  none: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },

  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },

  // Green glow for online status (approximated for React Native)
  greenGlow: {
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
};

// ============================================================================
// ANIMATIONS (React Native durations in milliseconds)
// ============================================================================

export const animations = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
};

// ============================================================================
// COMPONENT-SPECIFIC TOKENS
// ============================================================================

export const components = {
  button: {
    height: {
      small: 36,
      medium: 48,
      large: 56,
    },
    padding: {
      horizontal: spacing.base,
    },
  },

  card: {
    padding: spacing.base,
    borderRadius: borderRadius.md,
  },

  avatar: {
    size: {
      small: 32,
      medium: 48,
      large: 64,
      hero: 120,
    },
  },

  statusBadge: {
    height: 32,
    borderRadius: borderRadius.full,
    dotSize: 8,
  },

  bottomNav: {
    height: 64,
  },

  topBar: {
    height: 64,
  },
};

// ============================================================================
// Z-INDEX LAYERS
// ============================================================================

export const zIndex = {
  base: 0,
  card: 10,
  dropdown: 100,
  sticky: 500,
  overlay: 1000,
  modal: 1100,
  toast: 1200,
};

// ============================================================================
// EXPORT DEFAULT THEME
// ============================================================================

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  components,
  zIndex,
};

export default theme;
