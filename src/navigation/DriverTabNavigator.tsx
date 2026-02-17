// src/navigation/DriverTabNavigator.tsx
// Extracted from AppNavigator — original 4-tab driver navigation
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DeliveryHomeScreen from '../screens/DeliveryHomeScreen';
import ActiveDeliveryScreen from '../screens/ActiveDeliveryScreen';
import DeliveryHistoryScreen from '../screens/DeliveryHistoryScreen';
import DriverProfileScreen from '../screens/DriverProfileScreen';
import { colors, components } from '../styles/driverDesignTokens';

const Tab = createBottomTabNavigator();

export const DriverTabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: colors.roles.driver,
      tabBarInactiveTintColor: colors.text.secondary,
      tabBarStyle: {
        height: components.bottomNav.height,
        backgroundColor: colors.surface.background,
        borderTopColor: colors.surface.border,
        borderTopWidth: 1,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '600',
      },
      headerStyle: {
        backgroundColor: colors.surface.background,
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 3,
        borderBottomColor: colors.roles.driver,
      },
      headerTintColor: colors.text.primary,
      headerTitleStyle: {
        fontWeight: '700',
        fontSize: 18,
      },
    }}
  >
    <Tab.Screen
      name="Home"
      component={DeliveryHomeScreen}
      options={{
        title: 'Home',
        tabBarLabel: 'Home',
        tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="Active"
      component={ActiveDeliveryScreen}
      options={{
        title: 'Active Deliveries',
        tabBarLabel: 'Active',
        tabBarIcon: ({ color, size }) => <Icon name="local-shipping" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="History"
      component={DeliveryHistoryScreen}
      options={{
        title: 'Delivery History',
        tabBarLabel: 'History',
        tabBarIcon: ({ color, size }) => <Icon name="history" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="Profile"
      component={DriverProfileScreen}
      options={{
        title: 'Profile',
        tabBarLabel: 'Profile',
        tabBarIcon: ({ color, size }) => <Icon name="person" size={size} color={color} />,
      }}
    />
  </Tab.Navigator>
);

export default DriverTabNavigator;
