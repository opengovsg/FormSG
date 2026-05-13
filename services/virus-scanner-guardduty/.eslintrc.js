module.exports = {
  extends: ['../../apps/backend/.eslintrc.js'],
  ignorePatterns: ['*.mjs'],
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
}
