// src/navigation/KioskNavigator.tsx
// Navigation for KIOSK-type users (POS/cashier staff)
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../styles/driverDesignTokens';
import QuickOrderScreen from '../screens/pos/QuickOrderScreen';
import DriverProfileScreen from '../screens/DriverProfileScreen';

const Tab = createBottomTabNavigator();

export const KioskNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: colors.roles.kiosk,
      tabBarInactiveTintColor: colors.text.secondary,
      tabBarStyle: {
        backgroundColor: colors.surface.background,
        borderTopColor: colors.surface.border,
        borderTopWidth: 1,
      },
      headerStyle: {
        backgroundColor: colors.surface.background,
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 3,
        borderBottomColor: colors.roles.kiosk,
      },
      headerTintColor: colors.text.primary,
      headerTitleStyle: { fontWeight: '700', fontSize: 18 },
    }}
  >
    <Tab.Screen
      name="Order"
      component={QuickOrderScreen}
      options={{
        title: 'New Order',
        tabBarLabel: 'Order',
        tabBarIcon: ({ color, size }) => <Icon name="point-of-sale" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="KioskProfile"
      component={DriverProfileScreen}
      options={{
        title: 'Profile',
        tabBarLabel: 'Profile',
        tabBarIcon: ({ color, size }) => <Icon name="person" size={size} color={color} />,
      }}
    />
  </Tab.Navigator>
);

export default KioskNavigator;
