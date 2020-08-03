module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
    jquery: true
  },
  extends: [
    'eslint:recommended',
    'plugin:angular/johnpapa',
    'plugin:prettier/recommended',
  ],
  globals: {
    angular: true,
    _: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    "angular/controller-name": 1,
    "angular/controller-as-route": 1,
    "angular/file-name": 1,
    "angular/controller-as": 1,
    "angular/window-service": 1,
    "angular/module-getter": 1,
    "angular/no-run-logic": 1,
    "angular/module-setter": 1,
    "angular/file-name": "off",
    "angular/function-type": 2,
    "angular/document-service": 1,
    "angular/timeout-service": 1,
    "angular/interval-service": 1,
    "angular/no-service-method": 0,

    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  },
}
