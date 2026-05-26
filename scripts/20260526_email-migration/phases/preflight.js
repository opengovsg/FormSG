// @ts-check
'use strict'

const log = require('../lib/logger')
const { EMAIL_COLLATION } = require('../lib/db')
const { normalizeEmail } = require('../lib/normalize')

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
    .collation(EMAIL_COLLATION)
    .select('_id email')
    .lean()

  /** @type {Map<string, unknown>} */
  const oldByEmail = new Map()
  for (const u of oldDocs) {
    // Stored email may be mixed-case; key by normalized so mapping/missing logic works.
    oldByEmail.set(normalizeEmail(u.email), u._id)
  }
  const missing = oldEmails.filter((e) => !oldByEmail.has(e))
  log.info(
    `Pre-flight: ${oldByEmail.size} of ${oldEmails.length} oldEmails have a matching user (${missing.length} missing)`,
  )

  if (missing.length > 0) {
    // Diagnostics: help the operator figure out *why* the email didn't match.
    // We check:
    //   (1) Total user count — catches "wrong DB" and "empty staging".
    //   (2) Case-insensitive regex match — catches legacy non-lowercased rows.
    //   (3) Trim-equality via regex anchors — catches surrounding whitespace.
    // Bounded to first 20 missing emails to avoid hammering the DB.
    const totalUsers = await User.estimatedDocumentCount()
    log.warn(`Diagnostic: User collection has ~${totalUsers} documents total`)

    const sample = missing.slice(0, 20)
    for (const m of sample) {
      const escaped = m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const caseInsensitive = await User.findOne({
        email: { $regex: `^${escaped}$`, $options: 'i' },
      })
        .select('_id email')
        .lean()
      if (caseInsensitive) {
        log.warn(
          `  '${m}' — found as '${caseInsensitive.email}' (case differs)`,
        )
        continue
      }
      const trimmed = await User.findOne({
        email: { $regex: `^\\s*${escaped}\\s*$`, $options: 'i' },
      })
        .select('_id email')
        .lean()
      if (trimmed) {
        log.warn(
          `  '${m}' — found as ${JSON.stringify(trimmed.email)} (surrounding whitespace)`,
        )
        continue
      }
      log.warn(`  '${m}' — no user found by any variant; check the DB / collection`)
    }
  }

  if (missing.length > 0 && !allowMissing) {
    throw new Error(
      `${missing.length} oldEmail(s) have no matching User. See diagnostics above. ` +
        `Re-run with --allow-missing to proceed anyway, or fix the input/DB first.`,
    )
  }

  log.info(`Pre-flight: checking newEmail collisions in User collection`)
  /** @type {Array<{ _id: unknown, email: string }>} */
  const newDocs = await User.find({ email: { $in: newEmails } })
    .collation(EMAIL_COLLATION)
    .select('_id email')
    .lean()

  /** @type {Set<string>} */
  const missingSet = new Set(missing)

  /** @type {Array<{ newEmail: string, existingUserId: string, expectedOldEmail: string, expectedUserId: string | null }>} */
  const collisions = []
  /** @type {Array<{ newEmail: string, existingUserId: string, mappedOldEmail: string }>} */
  const tolerated = []
  for (const u of newDocs) {
    const storedNorm = normalizeEmail(u.email)
    /** @type {string | null} */
    let mappedOldEmail = null
    for (const [o, n] of mapping.entries()) {
      if (n === storedNorm) {
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
