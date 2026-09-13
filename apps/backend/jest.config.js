const fs = require('fs')
const path = require('path')

// Files that call `dbHandler.connect()` need a Mongo connection and run as
// the "integration" project; everything else runs as "unit" with no
// globalSetup / mongod download. Grepped at config-load time (like the
// mock-split pattern) instead of a hand-maintained list, so a new spec file
// is routed correctly without editing this config.
function getIntegrationTestFiles() {
  const srcDir = path.join(__dirname, 'src')
  const testFileRegex = /\.(spec|test)\.tsx?$/
  const dbConnectRegex = /dbHandler\.connect\s*\(/

  return fs
    .readdirSync(srcDir, { recursive: true })
    .filter((file) => testFileRegex.test(file))
    .filter((file) =>
      dbConnectRegex.test(fs.readFileSync(path.join(srcDir, file), 'utf8')),
    )
    .map((file) => path.join(srcDir, file).replace(/\\/g, '/'))
}

const integrationTestFiles = getIntegrationTestFiles()
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** @type {import('jest').Config} */
const commonProjectConfig = {
  preset: 'ts-jest',
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
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/node_modules/'],
  globals: {
    // Revert when memory leak in ts-jest is fixed.
    // See https://github.com/kulshekhar/ts-jest/issues/1967.
    'ts-jest': {
      isolatedModules: true,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup/jest-setupAfterEnv.js'],
}

/** @type {import('jest').Config} */
module.exports = {
  maxWorkers: '50%',
  projects: [
    {
      ...commonProjectConfig,
      displayName: 'unit',
      testMatch: ['**/?(*.)+(spec|test).[t]s?(x)'],
      testPathIgnorePatterns: [
        ...commonProjectConfig.testPathIgnorePatterns,
        ...integrationTestFiles.map(escapeRegExp),
      ],
    },
    {
      ...commonProjectConfig,
      displayName: 'integration',
      testMatch: integrationTestFiles,
      globalSetup: '<rootDir>/__tests__/setup/jest-global-setup.js',
      testTimeout: 300000, // Set timeout to be 300s to reduce test flakiness
    },
  ],
}
