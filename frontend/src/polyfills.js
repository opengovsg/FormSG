/* eslint-disable no-undef */

const fromEntries = require('polyfill-object.fromentries')

/**
 * Polyfills the Object.fromEntries
 */
if (!Object.fromEntries) {
  Object.fromEntries = fromEntries
}

module.exports = {}
