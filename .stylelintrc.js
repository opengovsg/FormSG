module.exports = {
  extends: ['stylelint-config-standard', 'stylelint-prettier/recommended'],
  rules: {
    'no-descending-specificity': [true, { severity: 'warning' }],
    'selector-type-no-unknown': [true, { ignore: ['custom-elements'] }],
  },
  ignoreFiles: ['dist/**', "**/*.html"],
}
