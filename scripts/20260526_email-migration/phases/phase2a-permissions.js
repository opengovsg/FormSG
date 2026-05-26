// @ts-check
'use strict'

const log = require('../lib/logger')
const { runWithConcurrency } = require('../lib/confirm')
const { normalizeEmail } = require('../lib/normalize')

/** @typedef {import('../lib/types').PhaseContext} PhaseContext */
/** @typedef {import('../lib/types').EmailMap} EmailMap */
/** @typedef {import('../lib/types').PermissionEntry} PermissionEntry */
/** @typedef {import('../lib/collision-prompt').CollisionPrompt} CollisionPrompt */

const PHASE = '2a'

/**
 * Plan a permissionList rewrite.
 *
 * Modes:
 *  - 'add'    — for each entry whose email is in `mapping`, ensure an entry for
 *               the newEmail also exists (copying the old entry's `write`). The
 *               old entry stays. No merge if newEmail is already present.
 *  - 'replace' — rewrite each mapped entry to newEmail; if both old and new were
 *                present pre-rewrite, the operator is prompted (max-rights union
 *                if merged).
 *
 * Returns the rewritten list plus a list of (oldEmail, newEmail) collisions
 * that the caller must resolve via CollisionPrompt before committing.
 *
 * @param {PermissionEntry[]} list
 * @param {EmailMap} mapping
 * @param {'add' | 'replace'} mode
 * @returns {{ newList: PermissionEntry[], changed: boolean, collisions: Array<{ oldEmail: string, newEmail: string }> }}
 */
function planPermissionList(list, mapping, mode) {
  /** @type {Set<string>} */
  const presentEmails = new Set(list.map((e) => normalizeEmail(e.email)))

  if (mode === 'add') {
    /** @type {PermissionEntry[]} */
    const additions = []
    /** @type {Set<string>} */
    const addedNew = new Set()
    let changed = false
    for (const entry of list) {
      const orig = normalizeEmail(entry.email)
      const mapped = mapping.get(orig)
      if (!mapped) continue
      if (presentEmails.has(mapped) || addedNew.has(mapped)) continue
      additions.push({ email: mapped, write: !!entry.write })
      addedNew.add(mapped)
      changed = true
    }
    return {
      newList: [
        ...list.map((e) => ({ email: normalizeEmail(e.email), write: !!e.write })),
        ...additions,
      ],
      changed,
      collisions: [],
    }
  }

  // replace mode.
  // Track the original (pre-mapping) email per slot so we can detect collisions
  // regardless of input order — old-first or new-first.
  /** @type {Map<string, { write: boolean, originalEmail: string }>} */
  const byEmail = new Map()
  /** @type {Array<{ oldEmail: string, newEmail: string }>} */
  const collisions = []
  let changed = false

  for (const entry of list) {
    const orig = normalizeEmail(entry.email)
    const mapped = mapping.get(orig)
    const target = mapped || orig
    if (mapped) changed = true

    const existing = byEmail.get(target)
    if (!existing) {
      byEmail.set(target, { write: !!entry.write, originalEmail: orig })
      continue
    }
    const mergedWrite = !!existing.write || !!entry.write
    if (existing.write !== mergedWrite) changed = true
    existing.write = mergedWrite
    if (existing.originalEmail !== orig) {
      // Two distinct original entries collapse to the same target — real collision.
      // The 'old' is whichever original maps to the target (i.e. != target).
      const oldE = existing.originalEmail !== target ? existing.originalEmail : orig
      collisions.push({ oldEmail: oldE, newEmail: target })
    }
    // else: duplicate of the same originalEmail — shouldn't happen but harmless.
  }
  /** @type {PermissionEntry[]} */
  const newList = [...byEmail.entries()].map(([email, info]) => ({
    email,
    write: info.write,
  }))
  return { newList, changed, collisions }
}

/**
 * @param {PhaseContext} ctx
 */
async function runPhase2A(ctx) {
  const { Form, mapping, backup, bucket, batchSize, dryRun, mode, collisionPrompt } = ctx
  const oldEmails = [...mapping.keys()]
  log.info(`[Phase 2A] mode=${mode} — scanning forms with permissionList.email in oldEmails`)

  /** @type {Array<{ _id: unknown, permissionList: PermissionEntry[], lastModified: Date }>} */
  const forms = await Form.find({ 'permissionList.email': { $in: oldEmails } })
    .select('_id permissionList lastModified')
    .lean()
  log.info(`[Phase 2A] ${forms.length} forms matched`)

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

      const plan = planPermissionList(form.permissionList || [], mapping, mode)
      if (!plan.changed) {
        skippedNoChange++
        return
      }

      if (plan.collisions.length > 0) {
        // Replace-mode collisions: ask the operator before committing.
        for (const c of plan.collisions) {
          const decision = await collisionPrompt.ask({
            formId: String(form._id),
            location: 'permissionList',
            oldEmail: c.oldEmail,
            newEmail: c.newEmail,
            detail: 'replace would merge write rights via OR',
          })
          if (decision === 'abort') {
            aborted = true
            backup.audit({
              phase: PHASE,
              _id: String(form._id),
              status: 'fail:operator-abort',
            })
            backup.flushBatch()
            throw new Error('[Phase 2A] operator aborted phase at collision prompt')
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
          // 'merge' — fall through to write the planned list.
        }
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
          originalLength: (form.permissionList || []).length,
          newLength: plan.newList.length,
        })
        return
      }

      await bucket.take()
      const res = await Form.updateOne(
        { _id: form._id, lastModified: form.lastModified },
        { $set: { permissionList: plan.newList } },
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
        mode,
        lastModifiedAtScan: form.lastModified,
        originalLength: (form.permissionList || []).length,
        newLength: plan.newList.length,
        updateResult: { matched: res.matchedCount, modified: res.modifiedCount },
      })
    },
  )

  log.info(
    `[Phase 2A] done: applied=${applied} ` +
      `skipped-concurrent=${skippedConcurrent} ` +
      `skipped-no-change=${skippedNoChange} ` +
      `skipped-by-operator=${skippedByOperator}` +
      `${dryRun ? ' (DRY-RUN)' : ''}`,
  )
  return { applied, skippedConcurrent, skippedNoChange, skippedByOperator }
}

module.exports = { runPhase2A, planPermissionList }
