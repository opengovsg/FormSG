/** @type {import('jest').Config} */
module.exports = {
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
  testTimeout: 300000, // Set timeout to be 300s to reduce test flakiness
  maxWorkers: '4',
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest'],
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup/jest-setupAfterEnv.js'],
}
