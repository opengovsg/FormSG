import {
  SubmittedStep,
  SubmittedStepBoundary,
  SubmittedStepField,
  WorkflowStatus,
} from '../../types/submission'
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
