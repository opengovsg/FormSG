module.exports = {
  extends: ['../../apps/backend/.eslintrc'],
  ignorePatterns: ['*.mjs'],
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
}
