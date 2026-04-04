import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, components } from '../styles/driverDesignTokens';
import { KitchenQueueScreen } from '../screens/kitchen/KitchenQueueScreen';
import MyShiftsScreen from '../screens/shared/MyShiftsScreen';
import MyProfileScreen from '../screens/shared/MyProfileScreen';

const Tab = createBottomTabNavigator();
const ACCENT = colors.roles.kitchen; // '#FF6B35'

export const KitchenTabNavigator = () => (
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
      name="KitchenQueue"
      component={KitchenQueueScreen}
      options={{
        title: 'Order Queue',
        tabBarIcon: ({ color, size }) => <Icon name="restaurant" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="KitchenShifts"
      component={MyShiftsScreen}
      options={{
        title: 'My Shifts',
        tabBarIcon: ({ color, size }) => <Icon name="timer" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="KitchenProfile"
      component={MyProfileScreen}
      options={{
        title: 'Profile',
        tabBarIcon: ({ color, size }) => <Icon name="person" size={size} color={color} />,
      }}
    />
  </Tab.Navigator>
);

export default KitchenTabNavigator;
