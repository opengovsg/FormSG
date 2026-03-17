module.exports = {
  ignorePatterns: ['*.mjs'],
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  rules: {
    'no-console': 'off', // Used for logging to lambda
    'typesafe/no-throw-sync-func': 'off',
  },
}
