import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    // Exclude node_modules and tests. 
    '!**/node_modules/**',
    '!**/__tests__/**',
    'constants/index.ts', // barrel: ./constants
    'constants/**/*.ts', // deep: ./constants/**/foo
    'modules/**/index.ts',
    'types/index.ts', // barrel: ./types
    'types/**/*.ts', // deep: ./types/**/foo
    'utils/**/*.ts',
  ],
  format: ['esm', 'cjs'],
  shims: true,
  exports: 'local-only',
})
