// @ts-check
'use strict'

const fs = require('fs')
const { parse } = require('csv-parse/sync')
const { normalizeEmail } = require('./normalize')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * @param {unknown} s
 * @returns {s is string}
 */
function isValidEmail(s) {
  return typeof s === 'string' && EMAIL_RE.test(s)
}

/**
 * Load the migration CSV.
 *
 * The CSV has 5 columns: username, display_name, old_email, new_display_name, new_email.
 * Only columns 3 and 5 are used. A header row is optional and auto-detected by checking
 * whether the first row's email columns parse as emails.
 *
 * @param {string} csvPath
 * @returns {{ map: Map<string, string>, totalRows: number, droppedNoop: number }}
 */
function loadCsv(csvPath) {
  const raw = fs.readFileSync(csvPath, 'utf8')
  /** @type {string[][]} */
  const rows = parse(raw, {
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  })

  if (rows.length === 0) {
    throw new Error(`CSV at ${csvPath} contains no rows`)
  }

  const first = rows[0]
  const headerSuspect =
    !isValidEmail(first[2] || '') && !isValidEmail(first[4] || '')
  const dataRows = headerSuspect ? rows.slice(1) : rows

  /** @type {Map<string, string>} */
  const map = new Map()
  let droppedNoop = 0

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]
    const lineNo = headerSuspect ? i + 2 : i + 1
    if (row.length < 5) {
      throw new Error(
        `CSV line ${lineNo}: expected 5 columns, got ${row.length}`,
      )
    }
    const oldRaw = row[2]
    const newRaw = row[4]
    if (!oldRaw || !newRaw) {
      throw new Error(
        `CSV line ${lineNo}: blank email (oldEmail='${oldRaw}', newEmail='${newRaw}')`,
      )
    }
    if (!isValidEmail(oldRaw)) {
      throw new Error(`CSV line ${lineNo}: invalid oldEmail '${oldRaw}'`)
    }
    if (!isValidEmail(newRaw)) {
      throw new Error(`CSV line ${lineNo}: invalid newEmail '${newRaw}'`)
    }
    const oldEmail = normalizeEmail(oldRaw)
    const newEmail = normalizeEmail(newRaw)
    if (oldEmail === newEmail) {
      droppedNoop++
      continue
    }
    if (map.has(oldEmail)) {
      throw new Error(
        `CSV line ${lineNo}: duplicate oldEmail '${oldEmail}' (first seen earlier)`,
      )
    }
    map.set(oldEmail, newEmail)
  }

  /** @type {Map<string, string>} */
  const seenNew = new Map()
  for (const [oldE, newE] of map.entries()) {
    const prev = seenNew.get(newE)
    if (prev !== undefined) {
      throw new Error(
        `CSV maps multiple old emails to the same new email '${newE}': ['${prev}', '${oldE}']`,
      )
    }
    seenNew.set(newE, oldE)
  }

  for (const newE of map.values()) {
    if (map.has(newE)) {
      throw new Error(
        `CSV contains a chain: '${newE}' is both a newEmail and an oldEmail`,
      )
    }
  }

  return {
    map,
    totalRows: dataRows.length,
    droppedNoop,
  }
}

module.exports = { loadCsv, isValidEmail }
