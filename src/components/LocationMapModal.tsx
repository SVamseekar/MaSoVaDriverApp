/**
 * LocationMapModal - React Native Modal for showing driver's current location
 * Displays map within the app instead of opening browser
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Linking,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Location } from '../services/locationService';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/driverDesignTokens';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LocationMapModalProps {
  visible: boolean;
  onClose: () => void;
  location: Location | null;
}

export const LocationMapModal: React.FC<LocationMapModalProps> = ({ visible, onClose, location }) => {
  const [mapLoading, setMapLoading] = useState(true);
  const [mapKey, setMapKey] = useState(0);
  const webViewRef = React.useRef<WebView>(null);

  if (!location) return null;

  const handleOpenGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
    Linking.openURL(url);
  };

  const handleOpenOSM = () => {
    const url = `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}&zoom=16`;
    Linking.openURL(url);
  };

  const handleRecenterMap = () => {
    // Force WebView to reload by changing the key
    setMapKey(prev => prev + 1);
  };

  // Create OpenStreetMap embed URL for WebView
  // Building level zoom (0.001 = very close, can see individual buildings)
  const zoomLevel = 0.001; // Smaller number = more zoomed in
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - zoomLevel},${location.latitude - zoomLevel},${location.longitude + zoomLevel},${location.latitude + zoomLevel}&layer=mapnik&marker=${location.latitude},${location.longitude}`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={false}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Icon name="my-location" size={24} color={colors.primary.green} />
              <Text style={styles.headerTitle}>My Current Location</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            <View style={styles.coordinatesBox}>
              <Text style={styles.coordinatesLabel}>GPS Coordinates</Text>
              <Text style={styles.coordinatesValue}>
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </Text>
              {location.accuracy && (
                <Text style={styles.accuracyText}>
                  Accuracy: ±{Math.round(location.accuracy)} meters
                </Text>
              )}
            </View>

            <View style={styles.mapContainer}>
              {mapLoading && (
                <View style={styles.mapLoader}>
                  <ActivityIndicator size="large" color={colors.primary.green} />
                  <Text style={styles.mapLoaderText}>Loading map...</Text>
                </View>
              )}
              <WebView
                ref={webViewRef}
                key={mapKey}
                source={{ uri: mapUrl }}
                style={styles.webMap}
                onLoadStart={() => setMapLoading(true)}
                onLoadEnd={() => setMapLoading(false)}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                scrollEnabled={true}
              />

              <TouchableOpacity
                style={styles.myLocationButton}
                onPress={handleRecenterMap}
                activeOpacity={0.8}
              >
                <Icon name="my-location" size={24} color={colors.primary.green} />
              </TouchableOpacity>
            </View>

            <View style={styles.actionsContainer}>
              <Text style={styles.actionsTitle}>Need Turn-by-Turn Navigation?</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={handleOpenGoogleMaps}
                >
                  <Icon name="navigation" size={20} color={colors.primary.white} />
                  <Text style={styles.primaryButtonText}>Google Maps</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={handleOpenOSM}
                >
                  <Icon name="map" size={20} color={colors.text.primary} />
                  <Text style={styles.secondaryButtonText}>OSM</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.infoBox}>
              <Icon name="info-outline" size={20} color={colors.semantic.info} />
              <Text style={styles.infoText}>
                This is your current GPS location. For turn-by-turn navigation to a delivery address, use the navigation feature in the Active Deliveries tab.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    height: SCREEN_HEIGHT - 100, // Leave only 100px at top (covers bottom nav text)
    ...shadows.elevated,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize.h2,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  coordinatesBox: {
    backgroundColor: colors.surface.backgroundAlt,
    padding: spacing.base,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.lg,
  },
  coordinatesLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  coordinatesValue: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  accuracyText: {
    fontSize: typography.fontSize.small,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  mapContainer: {
    height: 300,
    backgroundColor: colors.surface.backgroundAlt,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.subtle,
    position: 'relative',
  },
  webMap: {
    flex: 1,
  },
  mapLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface.backgroundAlt,
    zIndex: 10,
  },
  mapLoaderText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface.background,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.card,
    elevation: 4,
  },
  actionsContainer: {
    marginBottom: spacing.lg,
  },
  actionsTitle: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 44,
    borderRadius: borderRadius.sm,
    ...shadows.subtle,
  },
  primaryButton: {
    backgroundColor: colors.primary.green,
  },
  primaryButtonText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.primary.white,
  },
  secondaryButton: {
    backgroundColor: colors.surface.background,
    borderWidth: 2,
    borderColor: colors.surface.borderDark,
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  infoBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.base,
    backgroundColor: colors.semantic.infoBg,
    borderRadius: borderRadius.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.semantic.info,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    lineHeight: 18,
  },
});

export default LocationMapModal;
