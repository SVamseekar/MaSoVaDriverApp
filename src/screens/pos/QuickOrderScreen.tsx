// src/screens/pos/QuickOrderScreen.tsx
// Phase 1 stub — full POS implementation in Tier 4 (Point 5)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../styles/driverDesignTokens';

const QuickOrderScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>POS — Coming Soon</Text>
    <Text style={styles.sub}>
      The quick order screen will be implemented as part of the mobile customer/staff app revamp.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface.backgroundAlt,
    padding: 32,
  },
  text: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default QuickOrderScreen;
