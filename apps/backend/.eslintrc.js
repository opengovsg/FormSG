module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true,
  },
  ignorePatterns: ['scripts/'],
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
    _: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        sourceType: 'module',
        ecmaFeatures: {
          modules: true,
          jsx: true,
        },
        tsconfigRootDir: __dirname,
        project: ['tsconfig.json'],
      },
      plugins: [
        '@typescript-eslint',
        'import',
        'simple-import-sort',
        'typesafe',
      ],
      extends: ['plugin:@typescript-eslint/recommended'],
      rules: {
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
              ['^\\./(?=.*/)(?!\\/?$)', '^\\.(?!\\/?$)', '^\\.\\/?$'],
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
    },
    {
      files: ['**/*.spec.ts', '**/__tests__/**/*.ts'],
      extends: ['plugin:jest/recommended'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      files: ['*.ts', '*.js'],
      excludedFiles: ['**/*.spec.ts', '**/__tests__/**/*.ts'],
      rules: {
        '@typescript-eslint/no-non-null-assertion': 'error',
      },
    },
  ],
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'warn',
  },
}
