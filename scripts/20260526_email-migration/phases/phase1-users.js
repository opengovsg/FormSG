// @ts-check
'use strict'

const log = require('../lib/logger')
const { runWithConcurrency } = require('../lib/confirm')
const { EMAIL_COLLATION } = require('../lib/db')
const { normalizeEmail } = require('../lib/normalize')

/** @typedef {import('../lib/types').PhaseContext} PhaseContext */

const PHASE = '1'

/**
 * @param {unknown} err
 * @returns {err is { code: number, message?: string }}
 */
function isMongoErrorWithCode(err) {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof /** @type {{ code: unknown }} */ (err).code === 'number'
  )
}

/**
 * Phase 1: rewrite User.email from oldEmail to newEmail.
 *
 * The scan uses case-insensitive collation so mixed-case stored emails match
 * the lowercased CSV input. The TOCTOU guard on updateOne uses the actual
 * stored email value (preserving case), so we don't need collation on the
 * write. The $set writes the lowercased newEmail, normalizing case as a
 * side effect.
 *
 * @param {PhaseContext} ctx
 */
async function runPhase1(ctx) {
  const { User, mapping, backup, bucket, batchSize, dryRun } = ctx
  const oldEmails = [...mapping.keys()]
  log.info(`[Phase 1] scanning users for ${oldEmails.length} oldEmails`)

  /** @type {Array<{ _id: unknown, email: string }>} */
  const users = await User.find({ email: { $in: oldEmails } })
    .collation(EMAIL_COLLATION)
    .select('_id email')
    .lean()
  log.info(`[Phase 1] ${users.length} users matched; planned writes: ${users.length}`)

  let applied = 0
  let skippedConcurrent = 0
  let skippedNotMapped = 0

  await runWithConcurrency(
    users,
    { concurrency: batchSize, batchSize, onBatch: () => backup.flushBatch() },
    async (user) => {
      // user.email is the stored value (may be mixed case). The mapping is
      // keyed by normalized lowercase. Use the stored value as the TOCTOU
      // guard in the updateOne filter; use normalized for mapping lookup.
      const storedEmail = user.email
      const normalizedOld = normalizeEmail(storedEmail)
      const newEmail = mapping.get(normalizedOld)
      if (!newEmail) {
        skippedNotMapped++
        backup.audit({
          phase: PHASE,
          _id: String(user._id),
          status: 'skip:not-mapped',
          oldEmail: storedEmail,
        })
        return
      }

      /** @type {{ _id: unknown } & Record<string, unknown> | null} */
      const fullDoc = await User.findById(user._id).lean()
      if (!fullDoc) {
        backup.audit({
          phase: PHASE,
          _id: String(user._id),
          status: 'skip:vanished',
          oldEmail: storedEmail,
        })
        return
      }
      backup.snapshotUser(fullDoc)

      if (dryRun) {
        backup.audit({
          phase: PHASE,
          _id: String(user._id),
          oldEmail: storedEmail,
          newEmail,
          status: 'dry-run',
        })
        return
      }

      await bucket.take()
      let res
      try {
        res = await User.updateOne(
          { _id: user._id, email: storedEmail },
          { $set: { email: newEmail } },
          { writeConcern: { w: 'majority' } },
        )
      } catch (err) {
        if (isMongoErrorWithCode(err) && err.code === 11000) {
          backup.audit({
            phase: PHASE,
            _id: String(user._id),
            oldEmail: storedEmail,
            newEmail,
            status: 'fail:E11000',
            error: String(err.message || err),
          })
          backup.flushBatch()
          throw new Error(
            `[Phase 1] E11000 on user ${user._id} ('${storedEmail}' -> '${newEmail}'). Aborting phase.`,
          )
        }
        throw err
      }

      if (res.matchedCount === 0) {
        skippedConcurrent++
        backup.audit({
          phase: PHASE,
          _id: String(user._id),
          oldEmail: storedEmail,
          newEmail,
          status: 'skip:concurrent-modification',
        })
        return
      }

      applied++
      backup.audit({
        phase: PHASE,
        _id: String(user._id),
        oldEmail: storedEmail,
        newEmail,
        status: 'applied',
        updateResult: { matched: res.matchedCount, modified: res.modifiedCount },
      })
    },
  )

  log.info(
    `[Phase 1] done: applied=${applied} skipped-concurrent=${skippedConcurrent} skipped-not-mapped=${skippedNotMapped}${dryRun ? ' (DRY-RUN)' : ''}`,
  )
  return { applied, skippedConcurrent, skippedNotMapped }
}

module.exports = { runPhase1 }
