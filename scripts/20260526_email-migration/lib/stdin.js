// @ts-check
'use strict'

const readline = require('readline')

/**
 * Shared stdin reader. Two modes:
 *  - TTY: a single readline interface, reused.
 *  - Piped (with MIGRATE_ALLOW_PIPED_CONFIRM=1): drain stdin once into a line
 *    buffer; serve subsequent reads from the buffer. Avoids the readline-on-
 *    piped-stdin auto-close after the first answer.
 *
 * Every component that reads from stdin must go through this module so we don't
 * race for chunks.
 */

/** @type {Promise<string[]> | null} */
let pipedLinesPromise = null
let pipedCursor = 0

function isPiped() {
  return !process.stdin.isTTY
}

function pipedAllowed() {
  return isPiped() && !!process.env.MIGRATE_ALLOW_PIPED_CONFIRM
}

function drainPiped() {
  if (!pipedLinesPromise) {
    pipedLinesPromise = new Promise((resolve, reject) => {
      let buf = ''
      process.stdin.setEncoding('utf8')
      process.stdin.on('data', (c) => {
        buf += c
      })
      process.stdin.on('end', () => resolve(buf.split('\n')))
      process.stdin.on('error', reject)
    })
  }
  return pipedLinesPromise
}

async function nextPipedLine() {
  const lines = await drainPiped()
  if (pipedCursor >= lines.length) {
    throw new Error('Piped stdin exhausted but more input required')
  }
  return lines[pipedCursor++]
}

/** @type {readline.Interface | null} */
let sharedRl = null
function getReadline() {
  if (!sharedRl) {
    sharedRl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
  }
  return sharedRl
}

function closeReadline() {
  if (sharedRl) {
    sharedRl.close()
    sharedRl = null
  }
}

/**
 * Prompt with a given message and return the operator's reply (without the
 * trailing newline). Echoes the reply when piped so the transcript reads
 * cleanly.
 *
 * @param {string} promptText
 * @returns {Promise<string>}
 */
async function readLine(promptText) {
  if (isPiped()) {
    if (!pipedAllowed()) {
      throw new Error(
        'stdin is not a TTY and MIGRATE_ALLOW_PIPED_CONFIRM is not set',
      )
    }
    process.stdout.write(promptText)
    const line = await nextPipedLine()
    process.stdout.write(line + '\n')
    return line
  }
  const rl = getReadline()
  return new Promise((resolve) => {
    rl.question(promptText, resolve)
  })
}

module.exports = { readLine, closeReadline, isPiped }
