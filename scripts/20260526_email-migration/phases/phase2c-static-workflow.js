// @ts-check
'use strict'

const log = require('../lib/logger')
const { runWithConcurrency } = require('../lib/confirm')
const { rewriteEmails } = require('./phase2b-emails')

/** @typedef {import('../lib/types').PhaseContext} PhaseContext */
/** @typedef {import('../lib/types').EmailMap} EmailMap */
/** @typedef {import('../lib/types').WorkflowStep} WorkflowStep */

const PHASE = '2c-static'

/**
 * Identify static-workflow steps that need updates.
 *
 * @param {WorkflowStep[] | undefined} workflows
 * @param {EmailMap} mapping
 * @returns {Array<{ stepId: unknown, originalEmails: string[], newEmails: string[] }>}
 */
function planStaticSteps(workflows, mapping) {
  /** @type {Array<{ stepId: unknown, originalEmails: string[], newEmails: string[] }>} */
  const out = []
  for (const step of workflows || []) {
    if (!step || step.workflow_type !== 'static') continue
    const stepId = step._id
    if (!stepId) continue
    const original = Array.isArray(step.emails) ? step.emails : []
    const { newEmails, changed } = rewriteEmails(original, mapping)
    if (changed) {
      out.push({ stepId, originalEmails: original, newEmails })
    }
  }
  return out
}

/**
 * @param {PhaseContext} ctx
 */
async function runPhase2Cstatic(ctx) {
  const { Form, mapping, backup, bucket, batchSize, dryRun } = ctx
  const oldEmails = [...mapping.keys()]
  log.info(`[Phase 2C-i] scanning forms with static workflow emails in oldEmails`)

  /** @type {Array<{ _id: unknown, form_workflows: WorkflowStep[], lastModified: Date }>} */
  const forms = await Form.find({
    form_workflows: {
      $elemMatch: { workflow_type: 'static', emails: { $in: oldEmails } },
    },
  })
    .select('_id form_workflows lastModified')
    .lean()
  log.info(`[Phase 2C-i] ${forms.length} forms matched`)

  let appliedWrites = 0
  let skippedConcurrentWrites = 0
  let formsTouched = 0

  await runWithConcurrency(
    forms,
    { concurrency: batchSize, batchSize, onBatch: () => backup.flushBatch() },
    async (form) => {
      const plans = planStaticSteps(form.form_workflows, mapping)
      if (plans.length === 0) return
      formsTouched++

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
            stepId: String(plan.stepId),
            status: 'dry-run',
            originalEmails: plan.originalEmails,
            newEmails: plan.newEmails,
          })
          continue
        }

        await bucket.take()
        /** @type {{ lastModified: Date } | null} */
        const res = await Form.findOneAndUpdate(
          {
            _id: form._id,
            lastModified: expectedLastModified,
            'form_workflows._id': plan.stepId,
          },
          { $set: { 'form_workflows.$.emails': plan.newEmails } },
          { writeConcern: { w: 'majority' }, new: true, projection: { lastModified: 1 } },
        ).lean()

        if (!res) {
          skippedConcurrentWrites++
          backup.audit({
            phase: PHASE,
            _id: String(form._id),
            stepId: String(plan.stepId),
            status: 'skip:concurrent-modification',
            lastModifiedAtScan: expectedLastModified,
          })
          return
        }
        appliedWrites++
        backup.audit({
          phase: PHASE,
          _id: String(form._id),
          stepId: String(plan.stepId),
          status: 'applied',
          lastModifiedAtScan: expectedLastModified,
          originalEmails: plan.originalEmails,
          newEmails: plan.newEmails,
        })
        expectedLastModified = res.lastModified
      }
    },
  )

  log.info(
    `[Phase 2C-i] done: forms-touched=${formsTouched} writes-applied=${appliedWrites} writes-skipped-concurrent=${skippedConcurrentWrites}${dryRun ? ' (DRY-RUN)' : ''}`,
  )
  return { formsTouched, appliedWrites, skippedConcurrentWrites }
}

module.exports = { runPhase2Cstatic, planStaticSteps }
