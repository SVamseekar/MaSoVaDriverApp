import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LoginScreen from '../screens/LoginScreen';
import DeliveryHomeScreen from '../screens/DeliveryHomeScreen';
import ActiveDeliveryScreen from '../screens/ActiveDeliveryScreen';
import DeliveryHistoryScreen from '../screens/DeliveryHistoryScreen';
import DriverProfileScreen from '../screens/DriverProfileScreen';
import { selectIsAuthenticated } from '../store/slices/authSlice';
import { colors, components } from '../styles/driverDesignTokens';

const Tab = createBottomTabNavigator();

export const AppNavigator = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        // Show login screen when not authenticated
        <LoginScreen />
      ) : (
        // Show main app tabs when authenticated
        <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.primary.green,
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
            borderBottomColor: colors.surface.border,
            borderBottomWidth: 1,
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
            tabBarIcon: ({ color, size }) => (
              <Icon name="home" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Active"
          component={ActiveDeliveryScreen}
          options={{
            title: 'Active Deliveries',
            tabBarLabel: 'Active',
            tabBarIcon: ({ color, size }) => (
              <Icon name="local-shipping" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="History"
          component={DeliveryHistoryScreen}
          options={{
            title: 'Delivery History',
            tabBarLabel: 'History',
            tabBarIcon: ({ color, size }) => (
              <Icon name="history" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={DriverProfileScreen}
          options={{
            title: 'Profile',
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Icon name="person" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
