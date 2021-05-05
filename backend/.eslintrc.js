module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2018,
    ecmaFeatures: {
      modules: true,
    },
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'import', 'simple-import-sort', 'typesafe'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'warn',
    // Rules for auto sort of imports
    'simple-import-sort/imports': [
      'error',
      {
        groups: [
          // Side effect imports.
          ['^\\u0000'],
          // Packages.
          // Things that start with a letter (or digit or underscore), or
          // `@` followed by a letter.
          ['^@?\\w'],
          // Root imports
          ['^(src)(/.*|$)'],
          ['^(tests)(/.*|$)'],
          // Parent imports. Put `..` last.
          ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
          // Other relative imports. Put same-folder imports and `.` last.
          ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
        ],
      },
    ],
    'sort-imports': 'off',
    'import/order': 'off',
    'import/first': 'error',
    'import/newline-after-import': 'error',
    'import/no-duplicates': 'error',
    '@typescript-eslint/no-floating-promises': 2,
    '@typescript-eslint/no-unused-vars': 2,
    'typesafe/no-throw-sync-func': 'error',
  },
  overrides: [
    { files: ['*.spec.ts'], extends: ['plugin:jest/recommended'] },
    {
      files: ['*.ts', '*.js'],
      excludedFiles: ['**/*.spec.ts', '**/.spec.js', '**/__tests__/**/*.ts'],
      rules: {
        '@typescript-eslint/no-non-null-assertion': 'error',
      },
    },
  ],
}
