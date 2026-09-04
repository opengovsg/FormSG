// This package had no ESLint config, so lint-staged's
// `{apps/backend,packages,services}/**/*.tsx` glob failed on every file here.
// Kept deliberately light: these are preview wrappers and Storybook stories,
// not shipped code, so linting is not type-aware.
module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
    browser: true,
  },
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        sourceType: 'module',
        ecmaFeatures: { modules: true, jsx: true },
      },
      plugins: ['@typescript-eslint'],
      extends: ['plugin:@typescript-eslint/recommended'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'error',
      },
    },
  ],
}
