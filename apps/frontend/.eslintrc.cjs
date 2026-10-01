/* eslint-env node */

// Global key prefixes whose copy has moved into its own i18next namespace (see
// src/i18n/registerNamespace.ts). Add a namespace's old prefix here when
// migrating it, so stale keys fail lint even where `t` is untyped.
const MIGRATED_I18N_KEY_PREFIXES = ['features.adminForm.sidebar.workflow']

const migratedKeyPattern = `/^(${MIGRATED_I18N_KEY_PREFIXES.map((prefix) =>
  prefix.replaceAll('.', '\\.'),
).join('|')})(\\.|$)/`

const namespaceMessage =
  'Import the namespace constant from ~/i18n/locales/... instead of naming it, so TurboSnap can trace the locale file to this component.'

module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  plugins: [
    'import',
    'simple-import-sort',
    'prettier',
    'testing-library',
    'react-refresh',
  ],
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended',
    'plugin:storybook/recommended',
    'plugin:react-hooks/recommended',
  ],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      extends: ['plugin:@typescript-eslint/recommended'],
      parser: '@typescript-eslint/parser',
      rules: {
        '@typescript-eslint/no-unused-vars': 'warn',
        '@typescript-eslint/no-unused-expressions': [
          'error',
          { allowShortCircuit: true, allowTernary: true },
        ],
      },
    },
    {
      files: ['*.stories.*'],
      rules: {
        '@typescript-eslint/explicit-module-boundary-types': 'off',
      },
    },
    {
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
      extends: ['plugin:testing-library/react'],
      rules: {
        '@typescript-eslint/no-non-null-assertion': 'off',
        'testing-library/no-unnecessary-act': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'no-unsafe-optional-chaining': 'off',
      },
    },
    {
      // Everything here is imported by .storybook/preview.tsx, so any file it
      // reaches invalidates every Chromatic snapshot when it changes. The
      // formsg-shared barrels pull in ~60 unrelated files, and form.ts changes
      // often; import the leaf module that defines the symbol instead.
      files: ['.storybook/**', 'src/i18n/**'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              'formsg-shared/types',
              'formsg-shared/constants',
              'formsg-shared/types/form/form',
            ].map((name) => ({
              name,
              message:
                'Import from a dependency-free leaf module (e.g. formsg-shared/types/form/form_enums) to keep the Storybook preview dependency graph small.',
            })),
          },
        ],
      },
    },
    {
      files: ['src/**/*.ts', 'src/**/*.tsx'],
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            // 'translation' is the legacy global namespace, allowed until
            // every namespace is migrated.
            selector:
              "CallExpression[callee.name='useTranslation'][arguments.0.type='Literal'][arguments.0.value!='translation']",
            message: namespaceMessage,
          },
          {
            selector:
              "CallExpression[callee.name='useTranslation'] > ArrayExpression > Literal",
            message: namespaceMessage,
          },
          {
            selector: "Property[key.name='ns'][value.type='Literal']",
            message: namespaceMessage,
          },
          {
            selector: "JSXAttribute[name.name='ns'][value.type='Literal']",
            message: namespaceMessage,
          },
          ...['Literal[value', 'TemplateElement[value.raw'].map((node) => ({
            selector: `${node}=${migratedKeyPattern}]`,
            message:
              'This copy moved to its own namespace. Use `useTranslation(<namespace>)` and a key relative to it.',
          })),
        ],
      },
    },
    {
      files: ['**/*Context.[jt]s?(x)', '**/*Provider.[jt]s?(x)'],
      rules: {
        'react-refresh/only-export-components': 'off',
      },
    },
  ],
  ignorePatterns: ['!.storybook'],
  rules: {
    // Rules for auto sort of imports
    'simple-import-sort/imports': [
      'error',
      {
        groups: [
          // Side effect imports.
          ['^\\u0000'],
          // Packages.
          // Packages. `react` related packages come first.
          // Things that start with a letter (or digit or underscore), or
          // `@` followed by a letter.
          ['^react', '^@?\\w'],
          // Root imports
          // Shared imports should be separate from application imports.
          ['^(formsg-shared)(/.*|$)'],
          ['^(~)(/.*|$)'],
          ['^(~typings)(/.*|$)'],
          [
            '^(~assets|~theme)(/.*|$)',
            '^(~contexts)(/.*|$)',
            '^(~constants)(/.*|$)',
            '^(~hooks)(/.*|$)',
            '^(~utils)(/.*|$)',
            '^(~services)(/.*|$)',
            '^(~components)(/.*|$)',
            '^(~templates)(/.*|$)',
          ],
          ['^(~pages)(/.*|$)', '^(~features)(/.*|$)'],
          // Parent imports. Put `..` last.
          ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
          // Other relative imports. Put same-folder imports and `.` last.
          ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
        ],
      },
    ],
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'simple-import-sort/exports': 'error',
    'import/first': 'error',
    'import/newline-after-import': 'error',
    'import/no-duplicates': 'error',
  },
}
