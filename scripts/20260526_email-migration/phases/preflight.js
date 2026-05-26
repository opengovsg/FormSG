'use strict'

const log = require('../lib/logger')

/**
 * DB-side pre-flight checks. CSV-shape checks already ran in lib/csv.js.
 *
 * Returns nothing; throws to abort the run.
 */
async function preflight({ User, mapping, allowMissing }) {
  const oldEmails = [...mapping.keys()]
  const newEmails = [...mapping.values()]

  log.info(`Pre-flight: scanning ${oldEmails.length} oldEmails for matching users`)
  const oldDocs = await User.find({ email: { $in: oldEmails } })
    .select('_id email')
    .lean()

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
  const newDocs = await User.find({ email: { $in: newEmails } })
    .select('_id email')
    .lean()

  const collisions = []
  for (const u of newDocs) {
    // Find the oldEmail that maps to this newEmail.
    let mappedOldEmail = null
    for (const [o, n] of mapping.entries()) {
      if (n === u.email) {
        mappedOldEmail = o
        break
      }
    }
    if (!mappedOldEmail) {
      // Shouldn't happen (we queried by newEmails) but be defensive.
      continue
    }
    const expectedId = oldByEmail.get(mappedOldEmail)
    if (!expectedId || String(expectedId) !== String(u._id)) {
      collisions.push({
        newEmail: u.email,
        existingUserId: String(u._id),
        expectedOldEmail: mappedOldEmail,
        expectedUserId: expectedId ? String(expectedId) : null,
      })
    }
  }

  if (collisions.length > 0) {
    log.error('Pre-flight FAILED: newEmail collisions (first 20):', collisions.slice(0, 20))
    throw new Error(
      `${collisions.length} newEmail(s) are already taken by a different User. Resolve before re-running.`,
    )
  }
  log.info(`Pre-flight: no newEmail collisions`)

  return { missing, oldByEmail }
}

module.exports = { preflight }
