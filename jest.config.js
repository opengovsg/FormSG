module.exports = {
  preset: 'ts-jest',
  testMatch: ['**/?(*.)+(spec|test).[t]s?(x)'],
  modulePaths: ['<rootDir>'],
  testEnvironment: 'node',
  globalSetup: '<rootDir>/__tests__/setup/jest-global-setup.js',
  testPathIgnorePatterns: [
    '<rootDir>/__tests__/e2e',
    '<rootDir>/dist/',
    '<rootDir>/node_modules/',
    '<rootDir>/frontend',
  ],
  collectCoverageFrom: ['./src/**/*.{ts,js}', '!**/__tests__/**'],
  coveragePathIgnorePatterns: ['./node_modules/', './tests'],
  coverageReporters: ['lcov', 'text'],
  coverageThreshold: {
    global: {
      statements: 38, // Increase this percentage as test coverage improves
    },
  },
  testTimeout: 15000, // Set timeout to be 15s to reduce test flakiness
  globals: {
    // Revert when memory leak in ts-jest is fixed.
    // See https://github.com/kulshekhar/ts-jest/issues/1967.
    'ts-jest': {
      isolatedModules: true,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup/jest-setupAfterEnv.js'],
}
