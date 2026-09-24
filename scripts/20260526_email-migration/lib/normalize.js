// @ts-check
'use strict'

/**
 * @param {unknown} input
 * @returns {string}
 */
function normalizeEmail(input) {
  if (typeof input !== 'string') {
    throw new TypeError(`Expected email string, got ${typeof input}`)
  }
  return input.trim().toLowerCase()
}

module.exports = { normalizeEmail }
