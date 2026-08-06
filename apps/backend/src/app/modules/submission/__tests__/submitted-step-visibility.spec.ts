import { SubmittedStep, WorkflowStatus } from 'formsg-shared/types'
import { model, Schema } from 'mongoose'

import {
  buildAdminSubmittedStepsMongoProjection,
  projectSubmittedStepForPublic,
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
  snapshotTokens: { v4: 'SNAPSHOT_TOKEN_LEAF_VALUE' },
} satisfies SubmittedStep

describe('projectSubmittedStepForWebhook', () => {
  it('drops snapshotTokens but keeps the fields webhook consumers receive today', () => {
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
  const StepSchema = new Schema<SubmittedStep>(
    {
      isApproval: Boolean,
      submittedAt: String,
      status: String,
      nextStepRecipientEmails: [String],
      submitterId: String,
      snapshotTokens: { v4: String },
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

describe('projectSubmittedStepForPublic', () => {
  it('drops snapshotTokens and respondent emails from the public response', () => {
    const out = projectSubmittedStepForPublic(fullApprovalStep)

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

describe('buildAdminSubmittedStepsMongoProjection', () => {
  it('selects exactly the admin-visible sub-fields, so the rest never load', () => {
    expect(buildAdminSubmittedStepsMongoProjection()).toEqual({
      'submittedSteps.isApproval': 1,
      'submittedSteps.submittedAt': 1,
      'submittedSteps.status': 1,
      'submittedSteps.nextStepRecipientEmails': 1,
    })
  })
})
