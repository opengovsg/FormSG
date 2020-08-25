const { defaults: tsJestPreset } = require('ts-jest/presets')

module.exports = {
  preset: '@shelf/jest-mongodb',
  testMatch: ['**/?(*.)+(spec|test).[t]s?(x)'],
  modulePaths: ['<rootDir>'],
  transform: {
    // Needed to use @shelf/jest-mongodb preset.
    ...tsJestPreset.transform,
  },
  collectCoverageFrom: ['./src/**/*.{ts}'],
  coveragePathIgnorePatterns: ['./node_modules/', './tests'],
  coverageThreshold: {
    global: {
      statements: 14, // Increase this percentage as test coverage improves
    },
  },
}
