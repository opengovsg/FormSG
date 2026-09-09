/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testMatch: ['**/?(*.)+(spec|test).[t]s?(x)'],
  modulePaths: ['<rootDir>'],
  moduleDirectories: ['node_modules'],
  // Map workspace package so Jest can resolve it (Jest does not fully support package.json "exports")
  moduleNameMapper: {
    '^formsg-shared$': '<rootDir>/../../packages/shared',
    '^formsg-shared/(.*)$': '<rootDir>/../../packages/shared/$1',
    '^~features/(.*)$': '<rootDir>/../frontend/src/features/$1',
    '^~templates/(.*)$': '<rootDir>/../frontend/src/templates/$1',
    '^~utils/(.*)$': '<rootDir>/../frontend/src/utils/$1',
    '^~constants/(.*)$': '<rootDir>/../frontend/src/constants/$1',
    '^~services/(.*)$': '<rootDir>/../frontend/src/services/$1',
    '^~contexts/(.*)$': '<rootDir>/../frontend/src/contexts/$1',
    '^~components/(.*)$': '<rootDir>/../frontend/src/components/$1',
    '^~hooks/(.*)$': '<rootDir>/../frontend/src/hooks/$1',
    '^~theme/(.*)$': '<rootDir>/../frontend/src/theme/$1',
    '^~typings/(.*)$': '<rootDir>/../frontend/src/typings/$1',
    '^~/(.*)$': '<rootDir>/../frontend/src/$1',
  },
  testEnvironment: 'node',
  globalSetup: '<rootDir>/__tests__/setup/jest-global-setup.js',
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/node_modules/'],
  collectCoverage: false,
  collectCoverageFrom: ['./src/**/*.{ts,js}', '!**/__tests__/**'],
  coveragePathIgnorePatterns: ['./node_modules/', './tests'],
  coverageReporters: ['lcov', 'text'],
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
