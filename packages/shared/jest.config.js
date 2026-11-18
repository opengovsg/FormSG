/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  rootDir: __dirname,
  moduleDirectories: ['node_modules'],
  testEnvironment: 'node',
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/node_modules/'],
  collectCoverage: false,
  collectCoverageFrom: ['<rootDir>/**/*.{ts,js}', '!<rootDir>/**/__tests__/**'],
  coveragePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '/__tests__/',
  ],
  coverageReporters: ['lcov', 'text'],
}
