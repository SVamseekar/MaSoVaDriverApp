import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, components } from '../styles/driverDesignTokens';
import { QuickDashboardScreen } from '../screens/manager/QuickDashboardScreen';
import MyShiftsScreen from '../screens/shared/MyShiftsScreen';
import MyProfileScreen from '../screens/shared/MyProfileScreen';

const Tab = createBottomTabNavigator();
const ACCENT = colors.roles.manager; // '#7B1FA2'

export const ManagerTabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: ACCENT,
      tabBarInactiveTintColor: colors.text.secondary,
      tabBarStyle: {
        height: components.bottomNav.height,
        backgroundColor: colors.surface.background,
        borderTopColor: colors.surface.border,
        borderTopWidth: 1,
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      headerStyle: {
        backgroundColor: colors.surface.background,
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 3,
        borderBottomColor: ACCENT,
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
        tabBarIcon: ({ color, size }) => <Icon name="dashboard" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="ManagerShifts"
      component={MyShiftsScreen}
      options={{
        title: 'Staff Shifts',
        tabBarIcon: ({ color, size }) => <Icon name="people" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="ManagerProfile"
      component={MyProfileScreen}
      options={{
        title: 'Profile',
        tabBarIcon: ({ color, size }) => <Icon name="person" size={size} color={color} />,
      }}
    />
  </Tab.Navigator>
);

export default ManagerTabNavigator;
