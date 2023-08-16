module.exports = {
  extends: ['../../.eslintrc'],
  ignorePatterns: ['*.mjs'],
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
}
