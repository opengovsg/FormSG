// @ts-check
'use strict'

const log = require('../lib/logger')
const { runWithConcurrency } = require('../lib/confirm')
const { normalizeEmail } = require('../lib/normalize')
const { EMAIL_COLLATION } = require('../lib/db')

/** @typedef {import('../lib/types').PhaseContext} PhaseContext */
/** @typedef {import('../lib/types').EmailMap} EmailMap */

const PHASE = '2b'

/**
 * Replace-mode rewrite for an email list. Mapped entries are swapped to the
 * new value; duplicates are silently dropped (shrink accepted per spec) — but
 * a true collision (both old and new originally present) is also flagged for
 * the caller to confirm.
 *
 * Exported because Phase 2C-static reuses this for workflow step emails.
 *
 * @param {string[]} emails
 * @param {EmailMap} mapping
 * @returns {{ newEmails: string[], changed: boolean, collisions: Array<{ oldEmail: string, newEmail: string }> }}
 */
function rewriteEmails(emails, mapping) {
  /** @type {Set<string>} */
  const presentNormalized = new Set(emails.map(normalizeEmail))
  /** @type {Set<string>} */
  const seen = new Set()
  /** @type {string[]} */
  const out = []
  /** @type {Array<{ oldEmail: string, newEmail: string }>} */
  const collisions = []
  let changed = false

  for (const raw of emails) {
    const orig = normalizeEmail(raw)
    const mapped = mapping.get(orig)
    const next = mapped || orig
    if (mapped) {
      changed = true
      if (presentNormalized.has(mapped) && mapped !== orig) {
        collisions.push({ oldEmail: orig, newEmail: mapped })
      }
    }
    if (seen.has(next)) {
      changed = true
      continue
    }
    seen.add(next)
    out.push(next)
  }
  return { newEmails: out, changed, collisions }
}

/**
 * Add-mode rewrite: leave existing entries untouched; append the new email
 * after the list (preserving order) whenever it isn't already present.
 *
 * @param {string[]} emails
 * @param {EmailMap} mapping
 * @returns {{ newEmails: string[], changed: boolean }}
 */
function addEmails(emails, mapping) {
  const normalized = emails.map(normalizeEmail)
  /** @type {Set<string>} */
  const present = new Set(normalized)
  const out = [...normalized]
  let changed = false
  for (const orig of normalized) {
    const mapped = mapping.get(orig)
    if (!mapped) continue
    if (present.has(mapped)) continue
    out.push(mapped)
    present.add(mapped)
    changed = true
  }
  return { newEmails: out, changed }
}

/**
 * @param {PhaseContext} ctx
 */
async function runPhase2B(ctx) {
  const { Form, mapping, backup, bucket, batchSize, dryRun, mode, collisionPrompt } = ctx
  const oldEmails = [...mapping.keys()]
  log.info(`[Phase 2B] mode=${mode} — scanning forms with emails in oldEmails`)

  /** @type {Array<{ _id: unknown, emails: string[], responseMode?: string, lastModified: Date }>} */
  const forms = await Form.find({ emails: { $in: oldEmails } })
    .collation(EMAIL_COLLATION)
    .select('_id emails responseMode lastModified')
    .lean()
  log.info(`[Phase 2B] ${forms.length} forms matched`)

  let applied = 0
  let skippedConcurrent = 0
  let skippedNoChange = 0
  let skippedByOperator = 0
  let aborted = false

  await runWithConcurrency(
    forms,
    { concurrency: batchSize, batchSize, onBatch: () => backup.flushBatch() },
    async (form) => {
      if (aborted) return

      const original = form.emails || []
      /** @type {string[]} */
      let newEmails
      let changed
      /** @type {Array<{ oldEmail: string, newEmail: string }>} */
      let collisions = []

      if (mode === 'add') {
        const r = addEmails(original, mapping)
        newEmails = r.newEmails
        changed = r.changed
      } else {
        const r = rewriteEmails(original, mapping)
        newEmails = r.newEmails
        changed = r.changed
        collisions = r.collisions
      }

      if (!changed) {
        skippedNoChange++
        return
      }

      for (const c of collisions) {
        const decision = await collisionPrompt.ask({
          formId: String(form._id),
          location: 'emails',
          oldEmail: c.oldEmail,
          newEmail: c.newEmail,
          detail: 'replace would shrink the notification list',
        })
        if (decision === 'abort') {
          aborted = true
          backup.audit({ phase: PHASE, _id: String(form._id), status: 'fail:operator-abort' })
          backup.flushBatch()
          throw new Error('[Phase 2B] operator aborted phase at collision prompt')
        }
        if (decision === 'skip') {
          skippedByOperator++
          backup.audit({
            phase: PHASE,
            _id: String(form._id),
            status: 'skip:operator-decline',
            oldEmail: c.oldEmail,
            newEmail: c.newEmail,
          })
          return
        }
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
          mode,
          originalLength: original.length,
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
        mode,
        lastModifiedAtScan: form.lastModified,
        originalLength: original.length,
        newLength: newEmails.length,
        updateResult: { matched: res.matchedCount, modified: res.modifiedCount },
      })
    },
  )

  log.info(
    `[Phase 2B] done: applied=${applied} ` +
      `skipped-concurrent=${skippedConcurrent} ` +
      `skipped-no-change=${skippedNoChange} ` +
      `skipped-by-operator=${skippedByOperator}` +
      `${dryRun ? ' (DRY-RUN)' : ''}`,
  )
  return { applied, skippedConcurrent, skippedNoChange, skippedByOperator }
}

module.exports = { runPhase2B, rewriteEmails, addEmails }
