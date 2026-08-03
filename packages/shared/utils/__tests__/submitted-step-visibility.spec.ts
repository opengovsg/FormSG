import { model, Schema } from 'mongoose'

import {
  SubmittedStep,
  SubmittedStepBoundary,
  SubmittedStepField,
  WorkflowStatus,
} from '../../types/submission'
import {
  buildSubmittedStepsMongoProjection,
  projectSubmittedStepForStatusTracker,
  projectSubmittedStepForWebhook,
} from '../submitted-step-visibility'

/**
 * A step subdocument with EVERY field populated, including the internal ones.
 * Distinctive values so a leak is unmistakable in a stringified payload.
 */
const fullApprovalStep = {
  isApproval: true as const,
  submittedAt: '2026-07-22T00:00:00.000Z',
  status: WorkflowStatus.APPROVED,
  nextStepRecipientEmails: ['next@example.com'],
  submitterId: 'SUBMITTER_ID_HASH',
  snapshotToken: 'SNAPSHOT_TOKEN_LEAF_VALUE',
} satisfies SubmittedStep

describe('projectSubmittedStepForWebhook', () => {
  it('drops snapshotToken but keeps the fields webhook consumers receive today', () => {
    const out = projectSubmittedStepForWebhook(fullApprovalStep)

    expect(out).toEqual({
      isApproval: true,
      submittedAt: '2026-07-22T00:00:00.000Z',
      status: WorkflowStatus.APPROVED,
      nextStepRecipientEmails: ['next@example.com'],
      submitterId: 'SUBMITTER_ID_HASH',
    })
    expect(JSON.stringify(out)).not.toContain('SNAPSHOT_TOKEN_LEAF_VALUE')
  })
})

describe('projecting a mongoose subdocument', () => {
  // `getWebhookView` hands the projection live mongoose subdocuments, so the
  // output must be a fresh plain object rather than the document itself.
  const StepSchema = new Schema<SubmittedStep>(
    {
      isApproval: Boolean,
      submittedAt: String,
      status: String,
      nextStepRecipientEmails: [String],
      submitterId: String,
      snapshotToken: String,
    },
    { _id: false },
  )
  const Holder = model(
    'SubmittedStepHolder',
    new Schema({ submittedSteps: [StepSchema] }),
  )

  it('returns a plain object carrying no mongoose internals', () => {
    const holder = new Holder({ submittedSteps: [fullApprovalStep] })
    const subdoc = holder.submittedSteps[0]

    const out = projectSubmittedStepForWebhook(subdoc)

    expect(Object.getPrototypeOf(out)).toBe(Object.prototype)
    expect(out).toEqual({
      isApproval: true,
      submittedAt: '2026-07-22T00:00:00.000Z',
      status: WorkflowStatus.APPROVED,
      nextStepRecipientEmails: ['next@example.com'],
      submitterId: 'SUBMITTER_ID_HASH',
    })
    expect(JSON.stringify(out)).not.toContain('SNAPSHOT_TOKEN_LEAF_VALUE')
  })
})

describe('projectSubmittedStepForStatusTracker', () => {
  it('drops snapshotToken and respondent emails from the public response', () => {
    const out = projectSubmittedStepForStatusTracker(fullApprovalStep)

    expect(out).toEqual({
      isApproval: true,
      submittedAt: '2026-07-22T00:00:00.000Z',
      status: WorkflowStatus.APPROVED,
      submitterId: 'SUBMITTER_ID_HASH',
    })
    const serialised = JSON.stringify(out)
    expect(serialised).not.toContain('SNAPSHOT_TOKEN_LEAF_VALUE')
    expect(serialised).not.toContain('next@example.com')
  })
})

describe('buildSubmittedStepsMongoProjection', () => {
  it('selects exactly the admin-visible sub-fields, so the rest never load', () => {
    expect(buildSubmittedStepsMongoProjection()).toEqual({
      'submittedSteps.isApproval': 1,
      'submittedSteps.submittedAt': 1,
      'submittedSteps.status': 1,
      'submittedSteps.nextStepRecipientEmails': 1,
    })
  })
})

/**
 * Type-level guard. This spec is compiled by ts-jest (no `isolatedModules` in
 * the shared package's jest config), so a `@ts-expect-error` that stops being
 * an error fails the suite at compile time.
 */
describe('the classification table is exhaustive', () => {
  type VisibilityTable = Record<
    SubmittedStepField,
    Record<SubmittedStepBoundary, boolean>
  >

  it('rejects a table that leaves a step field unclassified', () => {
    const missingSnapshotToken = {
      isApproval: { webhook: true, statusTracker: true, admin: true },
      submittedAt: { webhook: true, statusTracker: true, admin: true },
      status: { webhook: true, statusTracker: true, admin: true },
      nextStepRecipientEmails: {
        webhook: true,
        statusTracker: false,
        admin: true,
      },
      submitterId: { webhook: true, statusTracker: true, admin: false },
      // snapshotToken deliberately omitted.
    } as const

    // @ts-expect-error - an unclassified field must not compile.
    const table: VisibilityTable = missingSnapshotToken

    expect(table).toBeDefined()
  })

  it('rejects a table that leaves a boundary unclassified', () => {
    const missingAdminColumn = {
      isApproval: { webhook: true, statusTracker: true },
    } as const

    // @ts-expect-error - an unclassified boundary must not compile.
    const row: VisibilityTable['isApproval'] = missingAdminColumn.isApproval

    expect(row).toBeDefined()
  })
})
