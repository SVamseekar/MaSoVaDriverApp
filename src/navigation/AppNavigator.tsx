// src/navigation/AppNavigator.tsx
// Role-based navigation root — routes to correct navigator based on user type
import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import LoginScreen from '../screens/LoginScreen';
import { selectIsAuthenticated, selectCurrentUser } from '../store/slices/authSlice';

// Role navigators
import DriverTabNavigator from './DriverTabNavigator';
import StaffTabNavigator from './StaffTabNavigator';

const RoleRouter = () => {
  const user = useSelector(selectCurrentUser);
  const type = user?.type?.toUpperCase() ?? '';

  if (type === 'DRIVER') return <DriverTabNavigator />;
  if (['KITCHEN_STAFF', 'STAFF', 'CASHIER', 'KIOSK', 'MANAGER', 'ASSISTANT_MANAGER'].includes(type)) return <StaffTabNavigator />;

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 }}>
        Access Denied
      </Text>
      <Text style={{ fontSize: 14, color: '#888', textAlign: 'center' }}>
        Role not supported. Please contact your manager.
      </Text>
    </View>
  );
};

export const AppNavigator = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return (
    <NavigationContainer>
      {!isAuthenticated ? <LoginScreen /> : <RoleRouter />}
    </NavigationContainer>
  );
};

export default AppNavigator;
