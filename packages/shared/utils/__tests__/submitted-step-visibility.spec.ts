import { SubmittedStep, WorkflowStatus } from '../../types/submission'
import { projectSubmittedStepForWebhook } from '../submitted-step-visibility'

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
