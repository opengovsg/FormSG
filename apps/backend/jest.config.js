/** @type {import('jest').Config} */
module.exports = {
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  testMatch: ['**/?(*.)+(spec|test).[t]s?(x)'],
  modulePaths: ['<rootDir>'],
  moduleDirectories: ['node_modules'],
  // Map workspace package so Jest can resolve it (Jest does not fully support package.json "exports")
  moduleNameMapper: {
    '^formsg-shared$': '<rootDir>/../../packages/shared',
    '^formsg-shared/(.*)$': '<rootDir>/../../packages/shared/$1',
  },
  testEnvironment: 'node',
  globalSetup: '<rootDir>/__tests__/setup/jest-global-setup.js',
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/node_modules/'],
  collectCoverage: true,
  collectCoverageFrom: ['./src/**/*.{ts,js}', '!**/__tests__/**'],
  coveragePathIgnorePatterns: ['./node_modules/', './tests'],
  coverageReporters: ['lcov', 'text'],
  testTimeout: 300000, // Set timeout to be 300s to reduce test flakiness
  maxWorkers: '4',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup/jest-setupAfterEnv.js'],
}
