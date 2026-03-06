/**
 * API Configuration - React Native
 * Central configuration for all API endpoints and settings
 *
 * IMPORTANT: All requests MUST go through API Gateway for security
 */

import { Platform } from 'react-native';

// Development URLs
// Android emulator: Use 10.0.2.2 to access localhost
// iOS simulator: Use localhost
// Physical device: Use your computer's local IP (e.g., 192.168.1.100)

// Your Mac's local IP - UPDATE THIS if your IP changes
const LOCAL_IP = '192.168.50.88'; // Dell backend host

const getDevApiUrl = () => {
  // Use API Gateway on port 8080 (same as web version)
  // Android emulator: Use 10.0.2.2 to access host machine's localhost
  // Physical device: Use LOCAL_IP
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8080/api';  // API Gateway
  }
  // iOS or physical device
  return `http://${LOCAL_IP}:8080/api`;
};

const getDevWsUrl = () => {
  // Android emulator: Use 10.0.2.2 to access host machine's localhost
  // Physical device: Use LOCAL_IP
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8090/ws';
  }
  // iOS or physical device
  return `http://${LOCAL_IP}:8090/ws`;
};

// Production URLs (replace with your hosted backend)
const PROD_API_URL = 'https://api.masova.com/api'; // TODO: Replace with your production API
const PROD_WS_URL = 'wss://api.masova.com/ws'; // TODO: Replace with your production WebSocket

// Environment detection
const isDevelopment = __DEV__;

const API_GATEWAY_URL = isDevelopment ? getDevApiUrl() : PROD_API_URL;
const WS_URL = isDevelopment ? getDevWsUrl() : PROD_WS_URL;

export const API_CONFIG = {
  // API Gateway - Single entry point for all backend services
  API_GATEWAY_URL,

  // Base URL (alias for API Gateway)
  BASE_URL: API_GATEWAY_URL,

  // Service URLs through API Gateway
  USER_SERVICE_URL: API_GATEWAY_URL,
  ORDER_SERVICE_URL: API_GATEWAY_URL,
  PAYMENT_SERVICE_URL: API_GATEWAY_URL,
  CUSTOMER_SERVICE_URL: API_GATEWAY_URL,
  REVIEW_SERVICE_URL: API_GATEWAY_URL,

  // Timeouts
  TIMEOUT: 30000, // 30 seconds

  // WebSocket
  WS_URL,
} as const;

// Use API Gateway for all endpoints
const GATEWAY = API_CONFIG.API_GATEWAY_URL;

export const API_ENDPOINTS = {
  // Authentication (user-service endpoints)
  AUTH: {
    LOGIN: `${GATEWAY}/users/login`,  // Changed from /auth/login to /users/login
    REGISTER: `${GATEWAY}/users/register`,
    REFRESH_TOKEN: `${GATEWAY}/users/refresh`,
    LOGOUT: `${GATEWAY}/users/logout`,
    PROFILE: `${GATEWAY}/users/profile`,
  },

  // Users
  USERS: {
    BASE: `${GATEWAY}/users`,
    BY_ID: (id: string) => `${GATEWAY}/users/${id}`,
    BY_ROLE: (role: string) => `${GATEWAY}/users/role/${role}`,
    BY_STORE: (storeId: string) => `${GATEWAY}/users/store/${storeId}`,
  },

  // Sessions (Working Hours)
  SESSIONS: {
    BASE: `${GATEWAY}/sessions`,
    START: `${GATEWAY}/sessions`,
    END: `${GATEWAY}/sessions/end`,
    BY_ID: (id: string) => `${GATEWAY}/sessions/${id}`,
    BY_EMPLOYEE: (employeeId: string) => `${GATEWAY}/sessions/employee/${employeeId}`,
    ACTIVE: (storeId: string) => `${GATEWAY}/sessions/store/${storeId}/active`,
    APPROVE: (id: string) => `${GATEWAY}/sessions/${id}/approve`,
  },

  // Orders
  ORDERS: {
    BASE: `${GATEWAY}/orders`,
    BY_ID: (id: string) => `${GATEWAY}/orders/${id}`,
  },

  // Delivery
  DELIVERY: {
    BASE: `${GATEWAY}/delivery`,
    DISPATCH: `${GATEWAY}/dispatch`,
    TRACKING: `${GATEWAY}/tracking`,
  },
} as const;

export default API_CONFIG;
