import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, components } from '../styles/driverDesignTokens';
import { QuickOrderScreen } from '../screens/cashier/QuickOrderScreen';
import MyShiftsScreen from '../screens/shared/MyShiftsScreen';
import MyProfileScreen from '../screens/shared/MyProfileScreen';

const Tab = createBottomTabNavigator();
const ACCENT = colors.roles.kiosk; // '#2196F3'

export const CashierTabNavigator = () => (
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
      name="NewOrder"
      component={QuickOrderScreen}
      options={{
        title: 'New Order',
        tabBarIcon: ({ color, size }) => <Icon name="add-circle" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="CashierShifts"
      component={MyShiftsScreen}
      options={{
        title: 'My Shifts',
        tabBarIcon: ({ color, size }) => <Icon name="timer" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="CashierProfile"
      component={MyProfileScreen}
      options={{
        title: 'Profile',
        tabBarIcon: ({ color, size }) => <Icon name="person" size={size} color={color} />,
      }}
    />
  </Tab.Navigator>
);

export default CashierTabNavigator;
