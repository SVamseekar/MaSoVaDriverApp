// src/navigation/ManagerNavigator.tsx
// Navigation for MANAGER and ASSISTANT_MANAGER type users
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../styles/driverDesignTokens';
import QuickDashboardScreen from '../screens/manager/QuickDashboardScreen';
import DriverProfileScreen from '../screens/DriverProfileScreen';

const Tab = createBottomTabNavigator();

export const ManagerNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: colors.roles.manager,
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
        borderBottomColor: colors.roles.manager,
      },
      headerTintColor: colors.text.primary,
      headerTitleStyle: { fontWeight: '700', fontSize: 18 },
    }}
  >
    <Tab.Screen
      name="Dashboard"
      component={QuickDashboardScreen}
      options={{
        title: 'Dashboard',
        tabBarLabel: 'Dashboard',
        tabBarIcon: ({ color, size }) => <Icon name="dashboard" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="ManagerProfile"
      component={DriverProfileScreen}
      options={{
        title: 'Profile',
        tabBarLabel: 'Profile',
        tabBarIcon: ({ color, size }) => <Icon name="person" size={size} color={color} />,
      }}
    />
  </Tab.Navigator>
);

export default ManagerNavigator;
