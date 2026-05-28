// @ts-check
'use strict'

const log = require('../lib/logger')

/** @typedef {import('../lib/types').AnyModel} AnyModel */
/** @typedef {import('../lib/backup').BackupStore} BackupStore */

const FORM_PHASES = new Set(['1-reassign', '2a', '2b', '2c-static', '2c-conditional'])

/**
 * @template T
 * @param {T[]} arr
 * @param {number} size
 * @returns {T[][]}
 */
function chunk(arr, size) {
  /** @type {T[][]} */
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

/**
 * Re-read every touched user and form. The mere fact that Mongoose hydrates
 * the document without throwing is the schema-readability check. For users we
 * additionally assert the email matches the audit-recorded newEmail.
 *
 * @param {{ User: AnyModel, Form: AnyModel, backup: BackupStore }} args
 */
async function runPhase3({ User, Form, backup }) {
  const audit = backup.readAudit()

  /** @type {Map<string, string>} */
  const userTargets = new Map()
  /** @type {Set<string>} */
  const formIds = new Set()

  for (const row of audit) {
    if (row.status !== 'applied') continue
    if (row.phase === '1') {
      if (row.newEmail) userTargets.set(row._id, row.newEmail)
    } else if (FORM_PHASES.has(row.phase)) {
      formIds.add(row._id)
    }
  }

  log.info(
    `[Phase 3] verifying ${userTargets.size} touched users and ${formIds.size} touched forms`,
  )

  let userHydratedOk = 0
  let userEmailMismatch = 0
  let userMissing = 0
  for (const idChunk of chunk([...userTargets.keys()], 500)) {
    /** @type {Array<{ _id: unknown, email: string }>} */
    const docs = await User.find({ _id: { $in: idChunk } })
    /** @type {Set<string>} */
    const found = new Set(docs.map((d) => String(d._id)))
    for (const id of idChunk) {
      if (!found.has(id)) {
        userMissing++
        log.warn(`[Phase 3] user ${id} not found (deleted?)`)
      }
    }
    for (const doc of docs) {
      const expected = userTargets.get(String(doc._id))
      if (doc.email !== expected) {
        userEmailMismatch++
        log.error(
          `[Phase 3] user ${String(doc._id)} email mismatch: got '${doc.email}', expected '${expected}'`,
        )
      } else {
        userHydratedOk++
      }
    }
  }

  let formHydratedOk = 0
  let formMissing = 0
  for (const idChunk of chunk([...formIds], 500)) {
    /** @type {Array<{ _id: unknown }>} */
    const docs = await Form.find({ _id: { $in: idChunk } })
    /** @type {Set<string>} */
    const found = new Set(docs.map((d) => String(d._id)))
    for (const id of idChunk) {
      if (!found.has(id)) {
        formMissing++
        log.warn(`[Phase 3] form ${id} not found (deleted?)`)
      }
    }
    formHydratedOk += docs.length
  }

  const failed = userEmailMismatch
  log.info(
    `[Phase 3] users: hydrated-ok=${userHydratedOk} missing=${userMissing} email-mismatch=${userEmailMismatch}`,
  )
  log.info(`[Phase 3] forms: hydrated-ok=${formHydratedOk} missing=${formMissing}`)

  return {
    userHydratedOk,
    userMissing,
    userEmailMismatch,
    formHydratedOk,
    formMissing,
    failed,
  }
}

module.exports = { runPhase3 }
