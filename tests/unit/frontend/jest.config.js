module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  rootDir: '../../../',
  modulePaths: ['<rootDir>'],
  roots: ['<rootDir>/src/public/', '<rootDir>/tests/unit/frontend/'],
  globals: {
    // Revert when memory leak in ts-jest is fixed.
    // See https://github.com/kulshekhar/ts-jest/issues/1967.
    'ts-jest': {
      isolatedModules: true,
    },
  },
  clearMocks: true,
  setupFilesAfterEnv: ['jest-extended'],
}
