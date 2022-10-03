/* eslint-env node */
// This file is currently imported by craco in craco.config.js.
const esModules = ['react-markdown'].join('|')

module.exports = {
  transformIgnorePatterns: [`node_modules/(?!${esModules})/`],
}
