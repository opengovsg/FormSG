module.exports = {
  extends: ['../.eslintrc.js'],
  ignorePatterns: ['*.mjs'],
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
}
