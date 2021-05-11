module.exports = {
  preset: 'ts-jest',
  testMatch: ['**/?(*.)+(spec|test).[t]s?(x)'],
  modulePaths: ['<rootDir>'],
  testEnvironment: 'node',
  globalSetup: '<rootDir>/tests/jest-global-setup.js',
  testPathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/node_modules/',
    '<rootDir>/src/public',
  ],
  collectCoverageFrom: ['./src/**/*.{ts,js}', '!**/__tests__/**'],
  coveragePathIgnorePatterns: ['./node_modules/', './tests'],
  coverageReporters: ['lcov', 'text'],
  coverageThreshold: {
    global: {
      statements: 38, // Increase this percentage as test coverage improves
    },
  },
  globals: {
    // Revert when memory leak in ts-jest is fixed.
    // See https://github.com/kulshekhar/ts-jest/issues/1967.
    'ts-jest': {
      isolatedModules: true,
    },
  },
  moduleNameMapper: {
    // Jest wires `fs` to `graceful-fs`, which causes a memory leak when
    // `graceful-fs` does `require('fs')`.
    // Ref: https://github.com/facebook/jest/issues/2179#issuecomment-355231418
    'graceful-fs': '<rootDir>/tests/helpers/fs.js',
  },
  setupFilesAfterEnv: ['jest-extended'],
}
