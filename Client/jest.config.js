module.exports = {
  preset: 'jest-expo',
  maxWorkers: 2,
  coverageProvider: 'v8',
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
  setupFilesAfterEnv: ['./jest.setup.js'],
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$': require.resolve(
      '@react-native-async-storage/async-storage/jest/async-storage-mock'
    ),
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-paper|react-native-safe-area-context|react-native-calendars|react-native-maps|react-native-toast-message|@microsoft/signalr)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/utils/firebaseConfig*.ts',
    '!src/utils/oauthHandler.ts',
    '!src/utils/serverOAuthHandler.ts',
  ],
};
