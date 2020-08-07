module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true,
  },
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
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        sourceType: 'module',
        ecmaFeatures: {
          modules: true,
        },
      },
      plugins: ['@typescript-eslint', 'import', 'simple-import-sort'],
      rules: {
        // Rules for auto sort of imports
        'simple-import-sort/sort': [
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
        '@typescript-eslint/no-var-requires': 'warn',
        '@typescript-eslint/no-unused-vars': 'error',
        'no-unused-vars': 'off',
      },
    },
  ],
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'warn',
  },
  ignorePatterns: ['dist/**', 'src/public/**', '*.html'],
}
