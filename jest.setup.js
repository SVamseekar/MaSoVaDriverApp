// Jest setup file for React Native Testing Library

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  addEventListener: jest.fn(() => jest.fn()),
}));

// Mock React Native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

// Mock Notifee
jest.mock('@notifee/react-native', () => ({
  requestPermission: jest.fn(() => Promise.resolve(1)),
  createChannel: jest.fn(() => Promise.resolve('')),
  displayNotification: jest.fn(() => Promise.resolve('')),
  onBackgroundEvent: jest.fn(),
  onForegroundEvent: jest.fn(),
}));

// Mock image picker
jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
}));

// Mock geolocation
jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
  requestAuthorization: jest.fn(),
}));

// Mock native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.NativeModules.BackgroundLocationModule = {
    startTracking: jest.fn(() => Promise.resolve({ success: true })),
    stopTracking: jest.fn(() => Promise.resolve({ success: true })),
    isTracking: jest.fn(() => Promise.resolve(false)),
  };
  return RN;
});

// Silence console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
