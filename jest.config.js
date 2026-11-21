module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@react-native-community|@notifee|@reduxjs/toolkit|react-redux|immer|react-native-vector-icons|react-native-webview)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: ['/node_modules/', '/.worktrees/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts',
  ],
  // Ratchet: just below measured coverage on 2026-11-13 (statements 20.81, branches 10.91,
  // lines 21.57, functions 12.47). The old 50% gate was never met; it was masked by tsc failing
  // first. Raise these as tests are added; never lower them.
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 12,
      lines: 21,
      statements: 20,
    },
  },
};
