/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  // Mirror the path alias declared in tsconfig.json so spec imports resolve.
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1',
  },
}
