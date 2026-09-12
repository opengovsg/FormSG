// @ts-check
'use strict'

function ts() {
  return new Date().toISOString()
}

/**
 * @param {string} msg
 * @param {unknown} [meta]
 */
function info(msg, meta) {
  if (meta !== undefined) {
    console.log(`[${ts()}] ${msg}`, meta)
  } else {
    console.log(`[${ts()}] ${msg}`)
  }
}

/**
 * @param {string} msg
 * @param {unknown} [meta]
 */
function warn(msg, meta) {
  if (meta !== undefined) {
    console.warn(`[${ts()}] WARN: ${msg}`, meta)
  } else {
    console.warn(`[${ts()}] WARN: ${msg}`)
  }
}

/**
 * @param {string} msg
 * @param {unknown} [meta]
 */
function error(msg, meta) {
  if (meta !== undefined) {
    console.error(`[${ts()}] ERROR: ${msg}`, meta)
  } else {
    console.error(`[${ts()}] ERROR: ${msg}`)
  }
}

module.exports = { info, warn, error }
