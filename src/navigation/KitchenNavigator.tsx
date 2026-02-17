// src/navigation/KitchenNavigator.tsx
// Navigation for STAFF-type users (kitchen staff)
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../styles/driverDesignTokens';
import KitchenQueueScreen from '../screens/kitchen/KitchenQueueScreen';
import DriverProfileScreen from '../screens/DriverProfileScreen';

const Tab = createBottomTabNavigator();

export const KitchenNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: colors.roles.kitchen,
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
        borderBottomColor: colors.roles.kitchen,
      },
      headerTintColor: colors.text.primary,
      headerTitleStyle: { fontWeight: '700', fontSize: 18 },
    }}
  >
    <Tab.Screen
      name="Queue"
      component={KitchenQueueScreen}
      options={{
        title: 'Order Queue',
        tabBarLabel: 'Queue',
        tabBarIcon: ({ color, size }) => <Icon name="restaurant" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="KitchenProfile"
      component={DriverProfileScreen}
      options={{
        title: 'Profile',
        tabBarLabel: 'Profile',
        tabBarIcon: ({ color, size }) => <Icon name="person" size={size} color={color} />,
      }}
    />
  </Tab.Navigator>
);

export default KitchenNavigator;
