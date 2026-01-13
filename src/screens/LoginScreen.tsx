/**
 * LoginScreen - Driver Login for React Native App
 * Matches web app design with GPS permission handling
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  PermissionsAndroid,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { loginStart, loginSuccess, loginFailure, selectAuth } from '../store/slices/authSlice';
import { API_ENDPOINTS } from '../config/api.config';
import { colors, typography, spacing, borderRadius, shadows, components } from '../styles/driverDesignTokens';
import type { User } from '../types/user';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

const LoginScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(selectAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [gpsPermission, setGpsPermission] = useState<'granted' | 'denied' | 'unknown'>('unknown');
  const [isCheckingGPS, setIsCheckingGPS] = useState(false);

  // Demo credentials
  const demoCredentials = {
    email: 'ramesh.driver@masova.com',
    password: 'Driver@123',
  };

  useEffect(() => {
    checkGPSPermission();
  }, []);

  const checkGPSPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        setGpsPermission(granted ? 'granted' : 'denied');
      } else {
        // iOS - check with Geolocation
        // Permission is requested on first use
        setGpsPermission('unknown');
      }
    } catch (err) {
      console.warn('GPS permission check failed:', err);
      setGpsPermission('unknown');
    }
  };

  const requestGPSPermission = async (): Promise<boolean> => {
    setIsCheckingGPS(true);

    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'MaSoVa Driver App needs access to your location for delivery tracking',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        setGpsPermission(isGranted ? 'granted' : 'denied');
        setIsCheckingGPS(false);
        return isGranted;
      } else {
        // iOS - request via Geolocation API
        setGpsPermission('granted');
        setIsCheckingGPS(false);
        return true;
      }
    } catch (err) {
      console.warn('GPS permission request failed:', err);
      setIsCheckingGPS(false);
      setGpsPermission('denied');
      return false;
    }
  };

  const handleLogin = async () => {
    // Validation
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    // Request GPS permission before login
    if (gpsPermission !== 'granted') {
      const granted = await requestGPSPermission();
      if (!granted) {
        Alert.alert(
          'GPS Required',
          'GPS access is required for delivery drivers. Please enable location permissions in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    // Dispatch login start
    dispatch(loginStart());

    try {
      // Call login API
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          // rememberMe not supported by backend
        }),
      });

      const data: LoginResponse | any = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Login failed');
      }

      // Verify user is a driver
      if (data.user.type !== 'DRIVER') {
        dispatch(loginFailure('This login is for drivers only. Please contact your manager.'));
        Alert.alert('Error', 'This login is for drivers only. Please contact your manager.');
        return;
      }

      // Dispatch login success
      dispatch(loginSuccess({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      }));

      // Navigation will happen automatically via AppNavigator
    } catch (err: any) {
      const errorMessage = err?.message || 'Login failed. Please check your credentials.';
      dispatch(loginFailure(errorMessage));
      Alert.alert('Login Failed', errorMessage);
    }
  };

  const handleDemoLogin = () => {
    setEmail(demoCredentials.email);
    setPassword(demoCredentials.password);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo & Title */}
        <View style={styles.header}>
          <Icon name="local-shipping" size={80} color={colors.text.inverse} style={styles.logo} />
          <Text style={styles.title}>MaSoVa Driver</Text>
          <Text style={styles.subtitle}>Delivery Management System</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          {/* GPS Status */}
          <View style={[
            styles.gpsStatus,
            gpsPermission === 'granted' && styles.gpsGranted,
            gpsPermission === 'denied' && styles.gpsDenied,
          ]}>
            <View style={styles.gpsContent}>
              <Icon
                name={gpsPermission === 'granted' ? 'check-circle' : 'gps-fixed'}
                size={24}
                color={
                  gpsPermission === 'granted'
                    ? colors.semantic.success
                    : gpsPermission === 'denied'
                    ? colors.semantic.error
                    : colors.text.secondary
                }
              />
              <View style={styles.gpsText}>
                <Text style={[
                  styles.gpsTitle,
                  gpsPermission === 'granted' && styles.gpsGrantedText,
                  gpsPermission === 'denied' && styles.gpsDeniedText,
                ]}>
                  {gpsPermission === 'granted'
                    ? 'GPS Access Enabled'
                    : gpsPermission === 'denied'
                    ? 'GPS Access Denied'
                    : 'GPS Access Required'}
                </Text>
                <Text style={styles.gpsDescription}>
                  {gpsPermission === 'granted'
                    ? 'You can track deliveries in real-time'
                    : 'Enable location access to use the driver app'}
                </Text>
              </View>
              {gpsPermission !== 'granted' && (
                <TouchableOpacity
                  onPress={requestGPSPermission}
                  disabled={isCheckingGPS}
                  style={styles.gpsButton}
                >
                  {isCheckingGPS ? (
                    <ActivityIndicator size="small" color={colors.primary.green} />
                  ) : (
                    <Text style={styles.gpsButtonText}>Enable</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Icon name="error" size={20} color={colors.semantic.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Icon name="email" size={20} color={colors.text.secondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="driver@masova.com"
                placeholderTextColor={colors.text.tertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <Icon name="lock" size={20} color={colors.text.secondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Enter your password"
                placeholderTextColor={colors.text.tertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Icon
                  name={showPassword ? 'visibility-off' : 'visibility'}
                  size={20}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Remember Me */}
          <TouchableOpacity
            style={styles.rememberMe}
            onPress={() => setRememberMe(!rememberMe)}
            disabled={loading}
          >
            <Icon
              name={rememberMe ? 'check-box' : 'check-box-outline-blank'}
              size={24}
              color={colors.primary.green}
            />
            <Text style={styles.rememberMeText}>Remember me</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.text.inverse} />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Demo Login */}
          <View style={styles.demoSection}>
            <Text style={styles.demoLabel}>Demo Account</Text>
            <TouchableOpacity
              onPress={handleDemoLogin}
              disabled={loading}
              style={styles.demoButton}
            >
              <Text style={styles.demoButtonText}>Use Demo Driver Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <Text style={styles.featuresTitle}>Driver App Features</Text>
          <View style={styles.featuresGrid}>
            {[
              { icon: 'gps-fixed', text: 'Real-time GPS Tracking' },
              { icon: 'map', text: 'Turn-by-Turn Navigation' },
              { icon: 'inventory', text: 'Order Management' },
              { icon: 'attach-money', text: 'Earnings Dashboard' },
            ].map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Icon name={feature.icon} size={16} color={colors.text.inverse} />
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary.green,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.base,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logo: {
    marginBottom: spacing.base,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  title: {
    fontSize: typography.fontSize.hero,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
    marginBottom: spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: typography.fontSize.body,
    color: colors.text.inverse,
    opacity: 0.9,
  },
  card: {
    backgroundColor: colors.surface.background,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    ...shadows.card,
  },
  gpsStatus: {
    padding: spacing.base,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.surface.border,
    marginBottom: spacing.lg,
  },
  gpsGranted: {
    backgroundColor: colors.semantic.successBg,
    borderColor: colors.semantic.success,
  },
  gpsDenied: {
    backgroundColor: colors.semantic.errorBg,
    borderColor: colors.semantic.error,
  },
  gpsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gpsText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  gpsTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  gpsGrantedText: {
    color: colors.semantic.success,
  },
  gpsDeniedText: {
    color: colors.semantic.error,
  },
  gpsDescription: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
  },
  gpsButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  gpsButtonText: {
    fontSize: typography.fontSize.caption,
    color: colors.primary.green,
    fontWeight: typography.fontWeight.semibold,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.semantic.errorBg,
    padding: spacing.base,
    borderRadius: borderRadius.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.semantic.error,
    marginBottom: spacing.base,
  },
  errorText: {
    flex: 1,
    fontSize: typography.fontSize.caption,
    color: colors.semantic.error,
    marginLeft: spacing.sm,
  },
  inputGroup: {
    marginBottom: spacing.base,
  },
  label: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.backgroundAlt,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.surface.border,
    paddingHorizontal: spacing.base,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    height: components.button.height.medium,
    fontSize: typography.fontSize.body,
    color: colors.text.primary,
  },
  passwordInput: {
    paddingRight: spacing.xl,
  },
  eyeIcon: {
    position: 'absolute',
    right: spacing.base,
    padding: spacing.xs,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  rememberMeText: {
    fontSize: typography.fontSize.body,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  loginButton: {
    height: components.button.height.large,
    backgroundColor: colors.primary.green,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.card,
  },
  loginButtonDisabled: {
    backgroundColor: colors.surface.disabled,
  },
  loginButtonText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  },
  demoSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
    alignItems: 'center',
  },
  demoLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  demoButton: {
    padding: spacing.sm,
  },
  demoButtonText: {
    fontSize: typography.fontSize.body,
    color: colors.primary.green,
    fontWeight: typography.fontWeight.semibold,
  },
  features: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  featuresTitle: {
    fontSize: typography.fontSize.caption,
    color: colors.text.inverse,
    opacity: 0.8,
    marginBottom: spacing.sm,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.base,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  featureText: {
    fontSize: typography.fontSize.caption,
    color: colors.text.inverse,
  },
});

export default LoginScreen;
