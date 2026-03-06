// src/screens/driver/OtpVerificationScreen.tsx
// Driver OTP entry — required before marking order as DELIVERED
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { colors, typography, spacing, borderRadius, shadows } from '../../styles/driverDesignTokens';
import { API_CONFIG } from '../../config/api.config';

const API_BASE = API_CONFIG.API_GATEWAY_URL.replace('/api', '');

interface Props {
  orderId: string;
  onVerified: () => void;
  onCancel: () => void;
}

export const OtpVerificationScreen = ({ orderId, onVerified, onCancel }: Props) => {
  const token = useSelector((state: RootState) => state.auth.accessToken);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleVerify = async () => {
    if (otp.length !== 4) {
      setError('Enter the 4-digit OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/delivery/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, otp }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.verified) {
        onVerified();
      } else {
        setError('Incorrect OTP. Ask the customer again.');
        setOtp('');
        inputRef.current?.focus();
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Delivery OTP</Text>
        <Text style={styles.subtitle}>Ask the customer for their 4-digit code to complete delivery</Text>

        <TextInput
          ref={inputRef}
          style={[styles.otpInput, error ? styles.otpInputError : undefined]}
          value={otp}
          onChangeText={v => { setOtp(v.replace(/\D/g, '').slice(0, 4)); setError(''); }}
          keyboardType="numeric"
          maxLength={4}
          placeholder="0 0 0 0"
          placeholderTextColor={colors.text.tertiary}
          textAlign="center"
          autoFocus
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.verifyBtn, (otp.length !== 4 || loading) && styles.disabled]}
          onPress={handleVerify}
          disabled={otp.length !== 4 || loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.verifyText}>Verify & Complete Delivery</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface.background,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '100%',
    alignItems: 'center',
    ...shadows.elevated,
  },
  title: {
    fontSize: typography.fontSize.h1,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  otpInput: {
    width: 200,
    height: 72,
    backgroundColor: colors.surface.backgroundAlt,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.roles.driver,
    fontSize: 36,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: 12,
    marginBottom: spacing.sm,
  },
  otpInputError: { borderColor: colors.semantic.error },
  error: {
    color: colors.semantic.error,
    fontSize: typography.fontSize.caption,
    marginBottom: spacing.base,
    textAlign: 'center',
  },
  verifyBtn: {
    backgroundColor: colors.roles.driver,
    width: '100%',
    padding: spacing.base,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  verifyText: { color: '#fff', fontWeight: '700', fontSize: typography.fontSize.body },
  cancelBtn: { padding: spacing.sm },
  cancelText: { color: colors.text.secondary, fontSize: typography.fontSize.body },
  disabled: { opacity: 0.5 },
});

export default OtpVerificationScreen;
