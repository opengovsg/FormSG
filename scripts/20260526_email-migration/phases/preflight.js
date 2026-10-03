// @ts-check
'use strict'

const log = require('../lib/logger')
const { EMAIL_COLLATION } = require('../lib/db')
const { normalizeEmail } = require('../lib/normalize')
const { confirm } = require('../lib/confirm')

/** @typedef {import('../lib/types').AnyModel} AnyModel */
/** @typedef {import('../lib/types').EmailMap} EmailMap */

/**
 * DB-side pre-flight checks. CSV-shape checks already ran in lib/csv.js.
 *
 * Behavior:
 *  - All non-trivial situations are surfaced and require a single PROCEED
 *    confirmation. `--allow-missing` skips the prompt (intended for automation).
 *  - Soft issues: missing oldEmail user, OR newEmail already taken by what
 *    appears to be the partially-migrated user (oldUser is missing).
 *  - Hard collisions: BOTH oldUser AND newUser exist as distinct User
 *    documents. Phase 1 handles these by REASSIGNING form ownership (admin
 *    field) from oldUser to newUser instead of renaming oldUser's email.
 *    The operator should sanity-check the listed pairs before confirming.
 *
 * @param {{ User: AnyModel, mapping: EmailMap, dryRun: boolean, allowMissing: boolean }} args
 */
async function preflight({ User, mapping, dryRun, allowMissing }) {
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
    oldByEmail.set(normalizeEmail(u.email), u._id)
  }
  const missing = oldEmails.filter((e) => !oldByEmail.has(e))
  log.info(
    `Pre-flight: ${oldByEmail.size} of ${oldEmails.length} oldEmails have a matching user (${missing.length} missing)`,
  )

  if (missing.length > 0) {
    await runDiagnostics(User, missing)
  }

  log.info(`Pre-flight: checking newEmail collisions in User collection`)
  /** @type {Array<{ _id: unknown, email: string }>} */
  const newDocs = await User.find({ email: { $in: newEmails } })
    .collation(EMAIL_COLLATION)
    .select('_id email')
    .lean()

  /** @type {Set<string>} */
  const missingSet = new Set(missing)

  /** @type {Array<{ newEmail: string, existingUserId: string, mappedOldEmail: string, oldUserId: string }>} */
  const hardCollisions = []
  /** @type {Array<{ newEmail: string, existingUserId: string, mappedOldEmail: string }>} */
  const softCollisions = []

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

    if (expectedId) {
      // Both oldUser and newUser exist as distinct documents. Phase 1 will
      // reassign forms owned by oldUser to newUser instead of renaming.
      hardCollisions.push({
        newEmail: u.email,
        existingUserId: String(u._id),
        mappedOldEmail,
        oldUserId: String(expectedId),
      })
    } else if (missingSet.has(mappedOldEmail)) {
      // oldEmail user is gone but newEmail exists — almost certainly a
      // partially-migrated record from a prior run.
      softCollisions.push({
        newEmail: u.email,
        existingUserId: String(u._id),
        mappedOldEmail,
      })
    }
  }

  const totalIssues = missing.length + softCollisions.length + hardCollisions.length
  if (totalIssues === 0) {
    log.info(`Pre-flight: clean — no missing users, no collisions`)
    return
  }

  log.warn(
    `Pre-flight summary: ${missing.length} missing oldEmail user(s), ` +
      `${softCollisions.length} soft collision(s), ` +
      `${hardCollisions.length} hard collision(s) (Phase 1 will reassign form ownership).`,
  )
  if (hardCollisions.length > 0) {
    log.warn(`  Hard collisions — Phase 1 will reassign Form.admin (first 10):`)
    for (const h of hardCollisions.slice(0, 10)) {
      log.warn(
        `    ${h.mappedOldEmail} (${h.oldUserId}) -> ${h.newEmail} (${h.existingUserId})`,
      )
    }
  }
  if (softCollisions.length > 0) {
    log.warn(`  Soft collisions (first 10):`, softCollisions.slice(0, 10))
  }
  if (missing.length > 0) {
    log.warn(`  Missing oldEmail users (first 10):`, missing.slice(0, 10))
  }

  if (allowMissing) {
    log.warn(`Pre-flight: --allow-missing set — proceeding without confirmation`)
    return
  }
  if (dryRun) {
    log.info(`Pre-flight: dry-run — skipping PROCEED confirmation`)
    return
  }

  const ok = await confirm(`PROCEED ${totalIssues}`)
  if (!ok) {
    throw new Error('Pre-flight: operator declined to proceed')
  }
  log.info(`Pre-flight: operator confirmed — proceeding`)
}

/**
 * Per-missing-email DB lookups to help the operator diagnose why an email
 * didn't match. Best-effort; bounded to first 20 to avoid hammering.
 *
 * @param {AnyModel} User
 * @param {string[]} missing
 */
async function runDiagnostics(User, missing) {
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
      log.warn(`  '${m}' — found as '${caseInsensitive.email}' (case differs)`)
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

module.exports = { preflight }
