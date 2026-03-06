// src/navigation/StaffTabNavigator.tsx
// Shared personal companion navigator for Kitchen Staff, Cashier, Manager
// Role accent color applied via user.type
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { colors, components, getRoleColor } from '../styles/driverDesignTokens';
import MyShiftsScreen from '../screens/shared/MyShiftsScreen';
import MyScheduleScreen from '../screens/shared/MyScheduleScreen';
import MyEarningsScreen from '../screens/shared/MyEarningsScreen';
import MyProfileScreen from '../screens/shared/MyProfileScreen';

const Tab = createBottomTabNavigator();

export const StaffTabNavigator = () => {
  const user = useSelector(selectCurrentUser);
  const accent = getRoleColor(user?.type);

  const screenOptions = {
    tabBarActiveTintColor: accent,
    tabBarInactiveTintColor: colors.text.secondary,
    tabBarStyle: {
      height: components.bottomNav.height,
      backgroundColor: colors.surface.background,
      borderTopColor: colors.surface.border,
      borderTopWidth: 1,
    },
    tabBarLabelStyle: { fontSize: 11, fontWeight: '600' as const },
    headerStyle: {
      backgroundColor: colors.surface.background,
      elevation: 0, shadowOpacity: 0,
      borderBottomWidth: 3, borderBottomColor: accent,
    },
    headerTintColor: colors.text.primary,
    headerTitleStyle: { fontWeight: '700' as const, fontSize: 18 },
  };

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="Shifts"
        component={MyShiftsScreen}
        options={{
          title: 'My Shifts',
          tabBarIcon: ({ color, size }) => <Icon name="timer" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Schedule"
        component={MyScheduleScreen}
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, size }) => <Icon name="event" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Earnings"
        component={MyEarningsScreen}
        options={{
          title: 'Earnings',
          tabBarIcon: ({ color, size }) => <Icon name="payments" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={MyProfileScreen}
        options={{
          title: 'My Profile',
          tabBarIcon: ({ color, size }) => <Icon name="person" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default StaffTabNavigator;
