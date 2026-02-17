// src/navigation/AppNavigator.tsx
// Role-based navigation root — routes to correct navigator based on user type
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import LoginScreen from '../screens/LoginScreen';
import { selectIsAuthenticated, selectCurrentUser } from '../store/slices/authSlice';

// Role navigators
import DriverTabNavigator from './DriverTabNavigator';
import KitchenNavigator from './KitchenNavigator';
import KioskNavigator from './KioskNavigator';
import ManagerNavigator from './ManagerNavigator';

const RoleRouter = () => {
  const user = useSelector(selectCurrentUser);
  const type = user?.type?.toUpperCase() ?? '';

  if (type === 'DRIVER') return <DriverTabNavigator />;
  if (type === 'STAFF') return <KitchenNavigator />;
  if (type === 'KIOSK') return <KioskNavigator />;
  if (type === 'MANAGER' || type === 'ASSISTANT_MANAGER') return <ManagerNavigator />;

  // Fallback: kitchen queue for unknown staff types
  return <KitchenNavigator />;
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
