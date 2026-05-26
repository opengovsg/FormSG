// @ts-check
'use strict'

const log = require('../lib/logger')

/** @typedef {import('../lib/types').AnyModel} AnyModel */
/** @typedef {import('../lib/types').EmailMap} EmailMap */

/**
 * DB-side pre-flight checks. CSV-shape checks already ran in lib/csv.js.
 *
 * Throws to abort the run.
 *
 * @param {{ User: AnyModel, mapping: EmailMap, allowMissing: boolean }} args
 */
async function preflight({ User, mapping, allowMissing }) {
  const oldEmails = [...mapping.keys()]
  const newEmails = [...mapping.values()]

  log.info(`Pre-flight: scanning ${oldEmails.length} oldEmails for matching users`)
  /** @type {Array<{ _id: unknown, email: string }>} */
  const oldDocs = await User.find({ email: { $in: oldEmails } })
    .select('_id email')
    .lean()

  /** @type {Map<string, unknown>} */
  const oldByEmail = new Map()
  for (const u of oldDocs) {
    oldByEmail.set(u.email, u._id)
  }
  const missing = oldEmails.filter((e) => !oldByEmail.has(e))
  log.info(
    `Pre-flight: ${oldByEmail.size} of ${oldEmails.length} oldEmails have a matching user (${missing.length} missing)`,
  )
  if (missing.length > 0 && !allowMissing) {
    log.error(`Missing users for the following oldEmails (first 20):`, missing.slice(0, 20))
    throw new Error(
      `${missing.length} oldEmail(s) have no matching User. Re-run with --allow-missing to proceed anyway.`,
    )
  }

  log.info(`Pre-flight: checking newEmail collisions in User collection`)
  /** @type {Array<{ _id: unknown, email: string }>} */
  const newDocs = await User.find({ email: { $in: newEmails } })
    .select('_id email')
    .lean()

  /** @type {Set<string>} */
  const missingSet = new Set(missing)

  /** @type {Array<{ newEmail: string, existingUserId: string, expectedOldEmail: string, expectedUserId: string | null }>} */
  const collisions = []
  /** @type {Array<{ newEmail: string, existingUserId: string, mappedOldEmail: string }>} */
  const tolerated = []
  for (const u of newDocs) {
    /** @type {string | null} */
    let mappedOldEmail = null
    for (const [o, n] of mapping.entries()) {
      if (n === u.email) {
        mappedOldEmail = o
        break
      }
    }
    if (!mappedOldEmail) continue
    const expectedId = oldByEmail.get(mappedOldEmail)
    if (expectedId && String(expectedId) === String(u._id)) continue

    // No expected old user. This commonly means the user was already migrated
    // in a previous run. Tolerate when --allow-missing is set; otherwise this
    // is still ambiguous so default to refusing.
    if (!expectedId && missingSet.has(mappedOldEmail) && allowMissing) {
      tolerated.push({
        newEmail: u.email,
        existingUserId: String(u._id),
        mappedOldEmail,
      })
      continue
    }
    collisions.push({
      newEmail: u.email,
      existingUserId: String(u._id),
      expectedOldEmail: mappedOldEmail,
      expectedUserId: expectedId ? String(expectedId) : null,
    })
  }

  if (collisions.length > 0) {
    log.error('Pre-flight FAILED: newEmail collisions (first 20):', collisions.slice(0, 20))
    throw new Error(
      `${collisions.length} newEmail(s) are already taken by a different User. Resolve before re-running.`,
    )
  }
  if (tolerated.length > 0) {
    log.warn(
      `Pre-flight: ${tolerated.length} newEmail(s) already exist with no matching oldEmail — ` +
        `assuming prior partial migration (--allow-missing). First 10:`,
      tolerated.slice(0, 10),
    )
  } else {
    log.info(`Pre-flight: no newEmail collisions`)
  }

  return { missing, oldByEmail }
}

module.exports = { preflight }
