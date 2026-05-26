// @ts-check
'use strict'

const log = require('../lib/logger')
const { runWithConcurrency } = require('../lib/confirm')
const { normalizeEmail } = require('../lib/normalize')

/** @typedef {import('../lib/types').PhaseContext} PhaseContext */
/** @typedef {import('../lib/types').EmailMap} EmailMap */
/** @typedef {import('../lib/types').PermissionEntry} PermissionEntry */

const PHASE = '2a'

/**
 * Merge a permissionList in-process.
 * - rewrites entries whose email is in `mapping`
 * - on collision (old + new both present), keeps a single entry with write = OR
 *
 * @param {PermissionEntry[]} list
 * @param {EmailMap} mapping
 * @returns {{ newList: PermissionEntry[], changed: boolean, mergedEmails: string[] }}
 */
function rewritePermissionList(list, mapping) {
  /** @type {Map<string, PermissionEntry>} */
  const byEmail = new Map()
  let changed = false
  /** @type {string[]} */
  const mergedEmails = []

  for (const entry of list) {
    const origEmail = normalizeEmail(entry.email)
    const mapped = mapping.get(origEmail)
    const newEmail = mapped || origEmail
    if (mapped) changed = true

    const existing = byEmail.get(newEmail)
    if (existing) {
      const mergedWrite = !!existing.write || !!entry.write
      if (existing.write !== mergedWrite) changed = true
      existing.write = mergedWrite
      mergedEmails.push(newEmail)
    } else {
      byEmail.set(newEmail, { email: newEmail, write: !!entry.write })
    }
  }

  const newList = [...byEmail.values()]
  return { newList, changed, mergedEmails }
}

/**
 * @param {PhaseContext} ctx
 */
async function runPhase2A(ctx) {
  const { Form, mapping, backup, bucket, batchSize, dryRun } = ctx
  const oldEmails = [...mapping.keys()]
  log.info(`[Phase 2A] scanning forms with permissionList.email in oldEmails`)

  /** @type {Array<{ _id: unknown, permissionList: PermissionEntry[], lastModified: Date }>} */
  const forms = await Form.find({ 'permissionList.email': { $in: oldEmails } })
    .select('_id permissionList lastModified')
    .lean()
  log.info(`[Phase 2A] ${forms.length} forms matched`)

  let applied = 0
  let skippedConcurrent = 0
  let skippedNoChange = 0

  await runWithConcurrency(
    forms,
    { concurrency: batchSize, batchSize, onBatch: () => backup.flushBatch() },
    async (form) => {
      const { newList, changed, mergedEmails } = rewritePermissionList(
        form.permissionList || [],
        mapping,
      )
      if (!changed) {
        skippedNoChange++
        return
      }

      /** @type {{ _id: unknown } & Record<string, unknown> | null} */
      const fullDoc = await Form.findById(form._id).lean()
      if (!fullDoc) {
        backup.audit({ phase: PHASE, _id: String(form._id), status: 'skip:vanished' })
        return
      }
      backup.snapshotForm(fullDoc)

      if (dryRun) {
        backup.audit({
          phase: PHASE,
          _id: String(form._id),
          status: 'dry-run',
          merged: mergedEmails,
          originalLength: (form.permissionList || []).length,
          newLength: newList.length,
        })
        return
      }

      await bucket.take()
      const res = await Form.updateOne(
        { _id: form._id, lastModified: form.lastModified },
        { $set: { permissionList: newList } },
        { writeConcern: { w: 'majority' } },
      )

      if (res.matchedCount === 0) {
        skippedConcurrent++
        backup.audit({
          phase: PHASE,
          _id: String(form._id),
          status: 'skip:concurrent-modification',
          lastModifiedAtScan: form.lastModified,
        })
        return
      }
      applied++
      backup.audit({
        phase: PHASE,
        _id: String(form._id),
        status: 'applied',
        lastModifiedAtScan: form.lastModified,
        merged: mergedEmails,
        originalLength: (form.permissionList || []).length,
        newLength: newList.length,
        updateResult: { matched: res.matchedCount, modified: res.modifiedCount },
      })
    },
  )

  log.info(
    `[Phase 2A] done: applied=${applied} skipped-concurrent=${skippedConcurrent} skipped-no-change=${skippedNoChange}${dryRun ? ' (DRY-RUN)' : ''}`,
  )
  return { applied, skippedConcurrent, skippedNoChange }
}

module.exports = { runPhase2A, rewritePermissionList }
