// @ts-check
'use strict'

const log = require('../lib/logger')
const { runWithConcurrency } = require('../lib/confirm')

/** @typedef {import('../lib/types').PhaseContext} PhaseContext */

const PHASE = '1'

/**
 * @param {{ code?: number, message?: string } | unknown} err
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
 * Filter guard: `email: oldEmail` makes the update idempotent and safe under
 * concurrent edits. If something flipped the email between scan and write,
 * matchedCount === 0 and we log skip:concurrent-modification.
 *
 * @param {PhaseContext} ctx
 */
async function runPhase1(ctx) {
  const { User, mapping, backup, bucket, batchSize, dryRun } = ctx
  const oldEmails = [...mapping.keys()]
  log.info(`[Phase 1] scanning users for ${oldEmails.length} oldEmails`)

  /** @type {Array<{ _id: unknown, email: string }>} */
  const users = await User.find({ email: { $in: oldEmails } })
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
      const oldEmail = user.email
      const newEmail = mapping.get(oldEmail)
      if (!newEmail) {
        skippedNotMapped++
        backup.audit({ phase: PHASE, _id: String(user._id), status: 'skip:not-mapped', oldEmail })
        return
      }

      /** @type {{ _id: unknown } & Record<string, unknown> | null} */
      const fullDoc = await User.findById(user._id).lean()
      if (!fullDoc) {
        backup.audit({ phase: PHASE, _id: String(user._id), status: 'skip:vanished', oldEmail })
        return
      }
      backup.snapshotUser(fullDoc)

      if (dryRun) {
        backup.audit({
          phase: PHASE,
          _id: String(user._id),
          oldEmail,
          newEmail,
          status: 'dry-run',
        })
        return
      }

      await bucket.take()
      let res
      try {
        res = await User.updateOne(
          { _id: user._id, email: oldEmail },
          { $set: { email: newEmail } },
          { writeConcern: { w: 'majority' } },
        )
      } catch (err) {
        if (isMongoErrorWithCode(err) && err.code === 11000) {
          backup.audit({
            phase: PHASE,
            _id: String(user._id),
            oldEmail,
            newEmail,
            status: 'fail:E11000',
            error: String(err.message || err),
          })
          backup.flushBatch()
          throw new Error(
            `[Phase 1] E11000 on user ${user._id} ('${oldEmail}' -> '${newEmail}'). Aborting phase.`,
          )
        }
        throw err
      }

      if (res.matchedCount === 0) {
        skippedConcurrent++
        backup.audit({
          phase: PHASE,
          _id: String(user._id),
          oldEmail,
          newEmail,
          status: 'skip:concurrent-modification',
        })
        return
      }

      applied++
      backup.audit({
        phase: PHASE,
        _id: String(user._id),
        oldEmail,
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
