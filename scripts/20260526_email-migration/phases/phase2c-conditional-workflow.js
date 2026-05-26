'use strict'

const log = require('../lib/logger')
const { runWithConcurrency } = require('../lib/confirm')
const { normalizeEmail } = require('../lib/normalize')

const PHASE = '2c-conditional'

const BAD_KEY_RE = /[.$\x00]/

function rewriteRecipients(list, mapping) {
  const seen = new Set()
  const out = []
  let changed = false
  for (const raw of list) {
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
  return { newRecipients: out, changed }
}

/**
 * Find every (fieldId, optionKey) on this form that needs a recipient rewrite.
 * Returns [{ fieldId, optionKey, originalRecipients, newRecipients }, ...].
 * Throws if any optionKey contains a pathological character.
 */
function planConditionalWrites(formFields, mapping) {
  const out = []
  for (const field of formFields || []) {
    if (!field || field.fieldType !== 'dropdown') continue
    const map = field.optionsToRecipientsMap
    if (!map || typeof map !== 'object') continue
    const fieldId = field._id
    if (!fieldId) continue
    for (const [optionKey, recipients] of Object.entries(map)) {
      if (BAD_KEY_RE.test(optionKey)) {
        throw new Error(
          `optionsToRecipientsMap key on field ${fieldId} contains forbidden character ('.', '$', or NUL): ${JSON.stringify(optionKey)}. Manual handling required.`,
        )
      }
      if (!Array.isArray(recipients)) continue
      const { newRecipients, changed } = rewriteRecipients(recipients, mapping)
      if (changed) {
        out.push({ fieldId, optionKey, originalRecipients: recipients, newRecipients })
      }
    }
  }
  return out
}

async function runPhase2Cconditional({
  Form,
  mongoose,
  mapping,
  backup,
  bucket,
  batchSize,
  dryRun,
}) {
  const oldEmails = [...mapping.keys()]
  log.info(`[Phase 2C-ii] aggregating forms with conditional recipients in oldEmails`)

  // Server-side filter via $objectToArray. Use the underlying collection so we
  // can pass `allowDiskUse` and use a cursor (Mongoose Model.aggregate also
  // supports cursor but the raw driver is simpler here).
  const coll = mongoose.connection.db.collection(Form.collection.name)
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
                            { $size: { $setIntersection: ['$$entry.v', oldEmails] } },
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
  const forms = []
  for await (const f of cursor) forms.push(f)
  log.info(`[Phase 2C-ii] ${forms.length} forms matched`)

  let appliedWrites = 0
  let skippedConcurrentWrites = 0
  let formsTouched = 0

  await runWithConcurrency(
    forms,
    { concurrency: batchSize, batchSize, onBatch: () => backup.flushBatch() },
    async (form) => {
      const plans = planConditionalWrites(form.form_fields, mapping)
      if (plans.length === 0) return
      formsTouched++

      const fullDoc = await Form.findById(form._id).lean()
      if (!fullDoc) {
        backup.audit({ phase: PHASE, _id: String(form._id), status: 'skip:vanished' })
        return
      }
      backup.snapshotForm(fullDoc)

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
          // Same reasoning as 2C-i: abandon further plans on this form.
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
    `[Phase 2C-ii] done: forms-touched=${formsTouched} writes-applied=${appliedWrites} writes-skipped-concurrent=${skippedConcurrentWrites}${dryRun ? ' (DRY-RUN)' : ''}`,
  )
  return { formsTouched, appliedWrites, skippedConcurrentWrites }
}

module.exports = {
  runPhase2Cconditional,
  planConditionalWrites,
  rewriteRecipients,
}
