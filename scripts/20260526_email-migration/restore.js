#!/usr/bin/env node
// @ts-check
'use strict'

const fs = require('fs')
const path = require('path')
const { parseArgs } = require('util')
const { EJSON } = require('bson')
const log = require('./lib/logger')
const { connect, disconnect, models } = require('./lib/db')
const { confirm } = require('./lib/confirm')

/**
 * @param {unknown} err
 * @returns {string}
 */
function formatErr(err) {
  if (err instanceof Error) return err.stack || err.message
  return String(err)
}

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      'backup-dir': { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
      'no-dry-run': { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
    strict: true,
  })

  if (values.help || !values['backup-dir']) {
    console.error(
      `Usage: DB_URI=... node restore.js --backup-dir <dir> [--no-dry-run]\n\n` +
        `Replays the audit log in reverse, restoring each touched document\n` +
        `from its snapshot. Default is dry-run.\n`,
    )
    process.exit(values['backup-dir'] ? 0 : 2)
  }

  const dryRun = !values['no-dry-run']
  const backupDir = /** @type {string} */ (values['backup-dir'])
  const auditPath = path.join(backupDir, 'audit.ndjson')
  if (!fs.existsSync(auditPath)) {
    throw new Error(`audit.ndjson not found in ${backupDir}`)
  }
  const usersDir = path.join(backupDir, 'users')
  const formsDir = path.join(backupDir, 'forms')

  const raw = fs.readFileSync(auditPath, 'utf8')
  /** @type {Array<Record<string, unknown>>} */
  const rows = raw
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l))
  const applied = rows.filter((r) => r.status === 'applied')

  /** @type {Set<string>} */
  const userIds = new Set()
  /** @type {Set<string>} */
  const formIds = new Set()
  for (const r of applied) {
    const id = String(r._id)
    if (r.phase === '1') userIds.add(id)
    else formIds.add(id)
  }

  log.info(
    `Restore plan: ${userIds.size} users, ${formIds.size} forms (from ${applied.length} applied writes)`,
  )
  if (!dryRun) {
    const ok = await confirm(`RESTORE ${userIds.size + formIds.size}`)
    if (!ok) {
      log.warn('Confirmation declined; exiting')
      process.exit(0)
    }
  }

  const dbUri = process.env.DB_URI
  if (!dbUri) throw new Error('DB_URI is required')
  await connect(dbUri)
  const { User, Form } = models()

  let restored = 0
  let missingSnapshot = 0

  for (const id of userIds) {
    const snapPath = path.join(usersDir, `${id}.json`)
    if (!fs.existsSync(snapPath)) {
      missingSnapshot++
      log.warn(`No snapshot for user ${id}; skipping`)
      continue
    }
    const snap = /** @type {Record<string, unknown>} */ (
      EJSON.parse(fs.readFileSync(snapPath, 'utf8'), { relaxed: false })
    )
    const { _id, ...rest } = snap
    if (dryRun) {
      log.info(`[DRY] would restore user ${id}`)
      continue
    }
    await User.replaceOne({ _id }, rest, { writeConcern: { w: 'majority' } })
    restored++
  }

  for (const id of formIds) {
    const snapPath = path.join(formsDir, `${id}.json`)
    if (!fs.existsSync(snapPath)) {
      missingSnapshot++
      log.warn(`No snapshot for form ${id}; skipping`)
      continue
    }
    const snap = /** @type {Record<string, unknown>} */ (
      EJSON.parse(fs.readFileSync(snapPath, 'utf8'), { relaxed: false })
    )
    const { _id, ...rest } = snap
    if (dryRun) {
      log.info(`[DRY] would restore form ${id}`)
      continue
    }
    await Form.replaceOne({ _id }, rest, { writeConcern: { w: 'majority' } })
    restored++
  }

  log.info(
    `Restore done: restored=${restored} missingSnapshots=${missingSnapshot}${dryRun ? ' (DRY-RUN)' : ''}`,
  )
  await disconnect()
}

main().catch((err) => {
  log.error(`Restore failed: ${formatErr(err)}`)
  process.exit(1)
})
