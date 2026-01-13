/**
 * MaSoVa Driver App
 * React Native Driver Application
 */

import React, { useEffect } from 'react';
import { StatusBar, Alert } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import AppNavigator from './src/navigation/AppNavigator';
import { store, persistor } from './src/store/store';
import { notificationService } from './src/services/notificationService';
import ErrorBoundary from './src/components/ErrorBoundary';
import { colors } from './src/styles/driverDesignTokens';

function AppWrapper(): React.JSX.Element {
  useEffect(() => {
    // Initialize notification service on app startup
    const initializeServices = async () => {
      try {
        await notificationService.initialize();
        console.log('Notification service initialized');

        // Check if notifications are enabled
        const enabled = await notificationService.areNotificationsEnabled();
        if (!enabled) {
          Alert.alert(
            'Enable Notifications',
            'Please enable notifications to receive delivery updates',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Failed to initialize services:', error);
      }
    };

    initializeServices();
  }, []);

  return (
    <ErrorBoundary onError={(error, errorInfo) => {
      console.error('App Error:', error);
      console.error('Error Info:', errorInfo);
      // TODO: Send to Sentry in production
    }}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.surface.background}
      />
      <AppNavigator />
    </ErrorBoundary>
  );
}

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AppWrapper />
      </PersistGate>
    </Provider>
  );
}

export default App;
