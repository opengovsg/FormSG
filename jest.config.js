/** @type {import('jest').Config} */
module.exports = {
  automock: true,
  preset: 'ts-jest',
  testMatch: ['**/?(*.)+(spec|test).[t]s?(x)'],
  modulePaths: ['<rootDir>', '<rootDir>/serverless/virus-scanner/'],
  moduleDirectories: [
    'node_modules',
    './serverless/virus-scanner/node_modules',
  ],
  testEnvironment: 'node',
  globalSetup: '<rootDir>/__tests__/setup/jest-global-setup.js',
  testPathIgnorePatterns: [
    '<rootDir>/__tests__/e2e',
    '<rootDir>/dist/',
    '<rootDir>/node_modules/',
    '<rootDir>/frontend',
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    './src/**/*.{ts,js}',
    './serverless/**/*.{ts,js}',
    '!**/__tests__/**',
  ],
  coveragePathIgnorePatterns: ['./node_modules/', './tests'],
  coverageReporters: ['lcov', 'text'],
  coverageThreshold: {
    global: {
      statements: 38, // Increase this percentage as test coverage improves
    },
  },
  testTimeout: 300000, // Set timeout to be 300s to reduce test flakiness
  maxWorkers: '4',
  globals: {
    // Revert when memory leak in ts-jest is fixed.
    // See https://github.com/kulshekhar/ts-jest/issues/1967.
    'ts-jest': {
      isolatedModules: true,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup/jest-setupAfterEnv.js'],
}
