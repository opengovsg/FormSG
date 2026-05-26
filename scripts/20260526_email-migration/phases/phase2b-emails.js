// @ts-check
'use strict'

const log = require('../lib/logger')
const { runWithConcurrency } = require('../lib/confirm')
const { normalizeEmail } = require('../lib/normalize')

/** @typedef {import('../lib/types').PhaseContext} PhaseContext */
/** @typedef {import('../lib/types').EmailMap} EmailMap */

const PHASE = '2b'

/**
 * Map a notification-emails list. Order is preserved per first occurrence;
 * duplicates are silently dropped (shrink accepted per spec).
 *
 * @param {string[]} emails
 * @param {EmailMap} mapping
 * @returns {{ newEmails: string[], changed: boolean }}
 */
function rewriteEmails(emails, mapping) {
  /** @type {Set<string>} */
  const seen = new Set()
  /** @type {string[]} */
  const out = []
  let changed = false
  for (const raw of emails) {
    const orig = normalizeEmail(raw)
    const mapped = mapping.get(orig)
    const next = mapped || orig
    if (mapped) changed = true
    if (seen.has(next)) {
      changed = true
      continue
    }
    seen.add(next)
    out.push(next)
  }
  return { newEmails: out, changed }
}

/**
 * @param {PhaseContext} ctx
 */
async function runPhase2B(ctx) {
  const { Form, mapping, backup, bucket, batchSize, dryRun } = ctx
  const oldEmails = [...mapping.keys()]
  log.info(`[Phase 2B] scanning forms with emails in oldEmails`)

  /** @type {Array<{ _id: unknown, emails: string[], responseMode?: string, lastModified: Date }>} */
  const forms = await Form.find({ emails: { $in: oldEmails } })
    .select('_id emails responseMode lastModified')
    .lean()
  log.info(`[Phase 2B] ${forms.length} forms matched`)

  let applied = 0
  let skippedConcurrent = 0
  let skippedNoChange = 0

  await runWithConcurrency(
    forms,
    { concurrency: batchSize, batchSize, onBatch: () => backup.flushBatch() },
    async (form) => {
      const { newEmails, changed } = rewriteEmails(form.emails || [], mapping)
      if (!changed) {
        skippedNoChange++
        return
      }

      if (form.responseMode === 'email' && newEmails.length === 0) {
        backup.audit({
          phase: PHASE,
          _id: String(form._id),
          status: 'fail:empty-emails-on-email-form',
        })
        backup.flushBatch()
        throw new Error(
          `[Phase 2B] form ${form._id} would have empty emails after rewrite; refusing to write.`,
        )
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
          originalLength: (form.emails || []).length,
          newLength: newEmails.length,
        })
        return
      }

      await bucket.take()
      const res = await Form.updateOne(
        { _id: form._id, lastModified: form.lastModified },
        { $set: { emails: newEmails } },
        { writeConcern: { w: 'majority' } },
      )

      if (res.matchedCount === 0) {
        skippedConcurrent++
        backup.audit({
          phase: PHASE,
          _id: String(form._id),
          status: 'skip:concurrent-modification',
        })
        return
      }
      applied++
      backup.audit({
        phase: PHASE,
        _id: String(form._id),
        status: 'applied',
        lastModifiedAtScan: form.lastModified,
        originalLength: (form.emails || []).length,
        newLength: newEmails.length,
        updateResult: { matched: res.matchedCount, modified: res.modifiedCount },
      })
    },
  )

  log.info(
    `[Phase 2B] done: applied=${applied} skipped-concurrent=${skippedConcurrent} skipped-no-change=${skippedNoChange}${dryRun ? ' (DRY-RUN)' : ''}`,
  )
  return { applied, skippedConcurrent, skippedNoChange }
}

module.exports = { runPhase2B, rewriteEmails }
