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
 * Phase 1: rewrite User.email from oldEmail to newEmail — OR, if the newEmail
 * user already exists (hard collision), reassign forms owned by oldUser to
 * newUser instead.
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
  const { User, Form, mapping, backup, bucket, batchSize, dryRun } = ctx
  const oldEmails = [...mapping.keys()]
  log.info(`[Phase 1] scanning users for ${oldEmails.length} oldEmails`)

  /** @type {Array<{ _id: unknown, email: string }>} */
  const users = await User.find({ email: { $in: oldEmails } })
    .collation(EMAIL_COLLATION)
    .select('_id email')
    .lean()
  log.info(`[Phase 1] ${users.length} users matched`)

  let renamed = 0
  let reassignedUsers = 0
  let reassignedForms = 0
  let skippedConcurrent = 0
  let skippedNotMapped = 0

  await runWithConcurrency(
    users,
    { concurrency: batchSize, batchSize, onBatch: () => backup.flushBatch() },
    async (user) => {
      // user.email is the stored value (may be mixed case). The mapping is
      // keyed by normalized lowercase.
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

      // Does the newEmail user already exist as a distinct User?
      // If so: reassign form ownership instead of renaming.
      /** @type {{ _id: unknown } | null} */
      const existingNewUser = await User.findOne({ email: newEmail })
        .collation(EMAIL_COLLATION)
        .select('_id')
        .lean()
      if (existingNewUser && String(existingNewUser._id) !== String(user._id)) {
        const n = await reassignFormOwnership(ctx, {
          oldUserId: user._id,
          newUserId: existingNewUser._id,
          oldEmail: storedEmail,
          newEmail,
        })
        reassignedUsers++
        reassignedForms += n
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

      renamed++
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
    `[Phase 1] done: renamed=${renamed} reassigned-users=${reassignedUsers} reassigned-forms=${reassignedForms} skipped-concurrent=${skippedConcurrent} skipped-not-mapped=${skippedNotMapped}${dryRun ? ' (DRY-RUN)' : ''}`,
  )
  return {
    renamed,
    reassignedUsers,
    reassignedForms,
    skippedConcurrent,
    skippedNotMapped,
  }
}

/**
 * Reassign forms owned by oldUser to newUser. Used when newUser already exists
 * (a hard collision in pre-flight terms). oldUser is left intact; only Form.admin
 * references are moved. Each form is snapshotted and audited individually so
 * restore can revert per-document.
 *
 * @param {PhaseContext} ctx
 * @param {{ oldUserId: unknown, newUserId: unknown, oldEmail: string, newEmail: string }} args
 * @returns {Promise<number>} count of forms reassigned
 */
async function reassignFormOwnership(ctx, args) {
  const { Form, backup, bucket, dryRun } = ctx
  const { oldUserId, newUserId, oldEmail, newEmail } = args

  /** @type {Array<{ _id: unknown }>} */
  const formIds = await Form.find({ admin: oldUserId }).select('_id').lean()
  log.info(
    `[Phase 1-reassign] '${oldEmail}' (${String(oldUserId)}) -> '${newEmail}' (${String(newUserId)}): ${formIds.length} form(s)`,
  )

  let count = 0
  for (const f of formIds) {
    /** @type {{ _id: unknown } & Record<string, unknown> | null} */
    const fullDoc = await Form.findById(f._id).lean()
    if (!fullDoc) {
      backup.audit({
        phase: '1-reassign',
        _id: String(f._id),
        status: 'skip:vanished',
        oldUserId: String(oldUserId),
        newUserId: String(newUserId),
        oldEmail,
        newEmail,
      })
      continue
    }
    backup.snapshotForm(fullDoc)

    if (dryRun) {
      backup.audit({
        phase: '1-reassign',
        _id: String(f._id),
        status: 'dry-run',
        oldUserId: String(oldUserId),
        newUserId: String(newUserId),
        oldEmail,
        newEmail,
      })
      count++
      continue
    }

    await bucket.take()
    const res = await Form.updateOne(
      { _id: f._id, admin: oldUserId },
      { $set: { admin: newUserId } },
      { writeConcern: { w: 'majority' } },
    )
    backup.audit({
      phase: '1-reassign',
      _id: String(f._id),
      status: res.matchedCount > 0 ? 'applied' : 'skip:concurrent-modification',
      oldUserId: String(oldUserId),
      newUserId: String(newUserId),
      oldEmail,
      newEmail,
      updateResult: { matched: res.matchedCount, modified: res.modifiedCount },
    })
    if (res.matchedCount > 0) count++
  }
  return count
}

module.exports = { runPhase1, reassignFormOwnership }
