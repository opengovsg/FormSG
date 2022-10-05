/* eslint-env node */

module.exports = {
  rootDir: '.',
  testMatch: ['**/*.runner.ts'],
  preset: 'ts-jest',
  transform: {
    '^.+\\.stories\\.tsx$': '@storybook/addon-storyshots/injectFileName',
    '^.+\\.(js|jsx|ts|tsx)$': 'react-scripts/config/jest/babelTransform.js',
    '^.+\\.css$': 'react-scripts/config/jest/cssTransform.js',
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)':
      'react-scripts/config/jest/fileTransform.js',
  },
  moduleNameMapper: {
    '~shared/(.*)': '<rootDir>/../../../shared/$1',
    '~assets/(.*)': '<rootDir>/../../src/assets/$1',
    '~contexts/(.*)': '<rootDir>/../../src/contexts/$1',
    '~constants/(.*)': '<rootDir>/../../src/constants/$1',
    '~components/(.*)': '<rootDir>/../../src/components/$1',
    '~templates/(.*)': '<rootDir>/../../src/templates/$1',
    '~features/(.*)': '<rootDir>/../../src/features/$1',
    '~hooks/(.*)': '<rootDir>/../../src/hooks/$1',
    '~utils/(.*)': '<rootDir>/../../src/utils/$1',
    '~pages/(.*)': '<rootDir>/../../src/pages/$1',
    '~services/(.*)': '<rootDir>/../../src/services/$1',
    '~theme/(.*)': '<rootDir>/../../src/theme/$1',
    '~typings/(.*)': '<rootDir>/../../src/typings/$1',
    '~/(.*)': '<rootDir>/../../src/$1',
  },
}
