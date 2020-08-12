const { defaults: tsJestPreset } = require('ts-jest/presets')

module.exports = {
  preset: '@shelf/jest-mongodb',
  testMatch: ['**/?(*.)+(spec|test).[t]s?(x)'],
  modulePaths: ['<rootDir>'],
  transform: {
    // Needed to use @shelf/jest-mongodb preset.
    ...tsJestPreset.transform,
  },
}
