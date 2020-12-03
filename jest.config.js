const { defaults: tsJestPreset } = require('ts-jest/presets')

module.exports = {
  preset: '@shelf/jest-mongodb',
  testMatch: ['**/?(*.)+(spec|test).[t]s?(x)'],
  modulePaths: ['<rootDir>'],
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/node_modules/'],
  transform: {
    // Needed to use @shelf/jest-mongodb preset.
    ...tsJestPreset.transform,
  },
  collectCoverageFrom: ['./src/**/*.{ts,js}', '!**/__tests__/**'],
  coveragePathIgnorePatterns: ['./node_modules/', './tests'],
  coverageReporters: ['lcov', 'text'],
  coverageThreshold: {
    global: {
      statements: 38, // Increase this percentage as test coverage improves
    },
  },
  testEnvironment: 'node',
}
