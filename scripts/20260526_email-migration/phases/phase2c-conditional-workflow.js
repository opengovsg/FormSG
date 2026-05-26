// @ts-check
'use strict'

const log = require('../lib/logger')
const { runWithConcurrency } = require('../lib/confirm')
const { normalizeEmail } = require('../lib/normalize')

/** @typedef {import('../lib/types').PhaseContext} PhaseContext */
/** @typedef {import('../lib/types').EmailMap} EmailMap */
/** @typedef {import('../lib/types').DropdownField} DropdownField */

const PHASE = '2c-conditional'

const BAD_KEY_RE = /[.$\x00]/

/**
 * Replace-mode rewrite for a recipient list. Returns collisions where both old
 * and new were originally present so the caller can prompt before committing.
 *
 * @param {string[]} list
 * @param {EmailMap} mapping
 * @returns {{ newRecipients: string[], changed: boolean, collisions: Array<{ oldEmail: string, newEmail: string }> }}
 */
function rewriteRecipients(list, mapping) {
  /** @type {Set<string>} */
  const presentNormalized = new Set(list.map(normalizeEmail))
  /** @type {Set<string>} */
  const seen = new Set()
  /** @type {string[]} */
  const out = []
  /** @type {Array<{ oldEmail: string, newEmail: string }>} */
  const collisions = []
  let changed = false
  for (const raw of list) {
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
  return { newRecipients: out, changed, collisions }
}

/**
 * Find every (fieldId, optionKey) on this form that needs a recipient rewrite.
 * Throws if any optionKey contains a pathological character.
 *
 * @param {Array<Record<string, unknown>> | undefined} formFields
 * @param {EmailMap} mapping
 * @returns {Array<{ fieldId: unknown, optionKey: string, originalRecipients: string[], newRecipients: string[], collisions: Array<{ oldEmail: string, newEmail: string }> }>}
 */
function planConditionalWrites(formFields, mapping) {
  /** @type {Array<{ fieldId: unknown, optionKey: string, originalRecipients: string[], newRecipients: string[], collisions: Array<{ oldEmail: string, newEmail: string }> }>} */
  const out = []
  for (const field of formFields || []) {
    if (!field || field.fieldType !== 'dropdown') continue
    const map = /** @type {Record<string, unknown> | undefined} */ (
      field.optionsToRecipientsMap
    )
    if (!map || typeof map !== 'object') continue
    const fieldId = field._id
    if (!fieldId) continue
    for (const [optionKey, recipients] of Object.entries(map)) {
      if (BAD_KEY_RE.test(optionKey)) {
        throw new Error(
          `optionsToRecipientsMap key on field ${String(fieldId)} contains forbidden character ('.', '$', or NUL): ${JSON.stringify(optionKey)}. Manual handling required.`,
        )
      }
      if (!Array.isArray(recipients)) continue
      /** @type {string[]} */
      const recArr = recipients
      const { newRecipients, changed, collisions } = rewriteRecipients(recArr, mapping)
      if (changed) {
        out.push({ fieldId, optionKey, originalRecipients: recArr, newRecipients, collisions })
      }
    }
  }
  return out
}

/**
 * @param {PhaseContext} ctx
 */
async function runPhase2Cconditional(ctx) {
  const { Form, mongoose, mapping, backup, bucket, batchSize, dryRun, collisionPrompt } = ctx
  const oldEmails = [...mapping.keys()]
  log.info(`[Phase 2C-ii] (replace-only) aggregating forms with conditional recipients in oldEmails`)

  const conn = mongoose.connection.db
  if (!conn) throw new Error('Mongo connection not established')
  const coll = conn.collection(Form.collection.name)

  const pipeline = [
    { $match: { 'form_fields.optionsToRecipientsMap': { $exists: true, $type: 'object' } } },
    {
      $match: {
        $expr: {
          $anyElementTrue: {
            $map: {
              input: '$form_fields',
              as: 'f',
              in: {
                $cond: [
                  { $eq: ['$$f.fieldType', 'dropdown'] },
                  {
                    $anyElementTrue: {
                      $map: {
                        input: {
                          $ifNull: [
                            { $objectToArray: '$$f.optionsToRecipientsMap' },
                            [],
                          ],
                        },
                        as: 'entry',
                        in: {
                          $gt: [
                            {
                              $size: {
                                $setIntersection: [
                                  // Lowercase each recipient before the intersection so
                                  // mixed-case stored emails match the lowercased oldEmails.
                                  {
                                    $map: {
                                      input: '$$entry.v',
                                      as: 'r',
                                      in: { $toLower: '$$r' },
                                    },
                                  },
                                  oldEmails,
                                ],
                              },
                            },
                            0,
                          ],
                        },
                      },
                    },
                  },
                  false,
                ],
              },
            },
          },
        },
      },
    },
    { $project: { _id: 1, form_fields: 1, lastModified: 1 } },
  ]

  const cursor = coll.aggregate(pipeline, { allowDiskUse: true })
  /** @type {Array<{ _id: unknown, form_fields: Array<Record<string, unknown>>, lastModified: Date }>} */
  const forms = []
  for await (const f of cursor) {
    forms.push(/** @type {any} */ (f))
  }
  log.info(`[Phase 2C-ii] ${forms.length} forms matched`)

  let appliedWrites = 0
  let skippedConcurrentWrites = 0
  let formsTouched = 0
  let skippedByOperator = 0
  let aborted = false

  await runWithConcurrency(
    forms,
    { concurrency: batchSize, batchSize, onBatch: () => backup.flushBatch() },
    async (form) => {
      if (aborted) return

      const plans = planConditionalWrites(form.form_fields, mapping)
      if (plans.length === 0) return
      formsTouched++

      for (const plan of plans) {
        for (const c of plan.collisions) {
          const decision = await collisionPrompt.ask({
            formId: String(form._id),
            location: `form_fields[${String(plan.fieldId)}].optionsToRecipientsMap.${plan.optionKey}`,
            oldEmail: c.oldEmail,
            newEmail: c.newEmail,
            detail: 'replace would shrink the recipient list for this option',
          })
          if (decision === 'abort') {
            aborted = true
            backup.audit({ phase: PHASE, _id: String(form._id), status: 'fail:operator-abort' })
            backup.flushBatch()
            throw new Error('[Phase 2C-ii] operator aborted at collision prompt')
          }
          if (decision === 'skip') {
            skippedByOperator++
            backup.audit({
              phase: PHASE,
              _id: String(form._id),
              fieldId: String(plan.fieldId),
              optionKey: plan.optionKey,
              status: 'skip:operator-decline',
              oldEmail: c.oldEmail,
              newEmail: c.newEmail,
            })
            return
          }
        }
      }

      /** @type {{ _id: unknown } & Record<string, unknown> | null} */
      const fullDoc = await Form.findById(form._id).lean()
      if (!fullDoc) {
        backup.audit({ phase: PHASE, _id: String(form._id), status: 'skip:vanished' })
        return
      }
      backup.snapshotForm(fullDoc)

      /** @type {Date} */
      let expectedLastModified = form.lastModified

      for (const plan of plans) {
        if (dryRun) {
          backup.audit({
            phase: PHASE,
            _id: String(form._id),
            fieldId: String(plan.fieldId),
            optionKey: plan.optionKey,
            status: 'dry-run',
            originalRecipients: plan.originalRecipients,
            newRecipients: plan.newRecipients,
          })
          continue
        }

        await bucket.take()
        const setPath = `form_fields.$.optionsToRecipientsMap.${plan.optionKey}`
        /** @type {{ lastModified: Date } | null} */
        const res = await Form.findOneAndUpdate(
          {
            _id: form._id,
            lastModified: expectedLastModified,
            'form_fields._id': plan.fieldId,
          },
          { $set: { [setPath]: plan.newRecipients } },
          { writeConcern: { w: 'majority' }, new: true, projection: { lastModified: 1 } },
        ).lean()

        if (!res) {
          skippedConcurrentWrites++
          backup.audit({
            phase: PHASE,
            _id: String(form._id),
            fieldId: String(plan.fieldId),
            optionKey: plan.optionKey,
            status: 'skip:concurrent-modification',
            lastModifiedAtScan: expectedLastModified,
          })
          return
        }
        appliedWrites++
        backup.audit({
          phase: PHASE,
          _id: String(form._id),
          fieldId: String(plan.fieldId),
          optionKey: plan.optionKey,
          status: 'applied',
          lastModifiedAtScan: expectedLastModified,
          originalRecipients: plan.originalRecipients,
          newRecipients: plan.newRecipients,
        })
        expectedLastModified = res.lastModified
      }
    },
  )

  log.info(
    `[Phase 2C-ii] done: forms-touched=${formsTouched} writes-applied=${appliedWrites} writes-skipped-concurrent=${skippedConcurrentWrites} skipped-by-operator=${skippedByOperator}${dryRun ? ' (DRY-RUN)' : ''}`,
  )
  return { formsTouched, appliedWrites, skippedConcurrentWrites, skippedByOperator }
}

module.exports = {
  runPhase2Cconditional,
  planConditionalWrites,
  rewriteRecipients,
}
