module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  rootDir: '../../../',
  modulePaths: ['<rootDir>'],
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src/public/', '<rootDir>/__tests__/unit/frontend/'],
  globals: {
    // Revert when memory leak in ts-jest is fixed.
    // See https://github.com/kulshekhar/ts-jest/issues/1967.
    'ts-jest': {
      isolatedModules: true,
    },
  },
  clearMocks: true,
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup/jest-setupAfterEnv.js'],
  setupFiles: ['jest-localstorage-mock'],
}
