module.exports = {
  preset: 'ts-jest',
  testMatch: ['**/?(*.)+(spec|test).[t]s?(x)'],
  modulePaths: ['<rootDir>'],
  testEnvironment: '<rootDir>/tests/environment.js',
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/node_modules/'],
  collectCoverageFrom: ['./src/**/*.{ts,js}', '!**/__tests__/**'],
  coveragePathIgnorePatterns: ['./node_modules/', './tests'],
  coverageReporters: ['lcov', 'text'],
  coverageThreshold: {
    global: {
      statements: 38, // Increase this percentage as test coverage improves
    },
  },
}
