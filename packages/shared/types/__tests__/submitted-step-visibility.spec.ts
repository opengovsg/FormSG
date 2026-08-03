import { SubmittedStepBoundary, SubmittedStepField } from '../submission'

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
      isApproval: { webhook: true, public: true, admin: true },
      submittedAt: { webhook: true, public: true, admin: true },
      status: { webhook: true, public: true, admin: true },
      nextStepRecipientEmails: {
        webhook: true,
        public: false,
        admin: true,
      },
      submitterId: { webhook: true, public: true, admin: false },
      // snapshotToken deliberately omitted.
    } as const

    // @ts-expect-error - an unclassified field must not compile.
    const table: VisibilityTable = missingSnapshotToken

    expect(table).toBeDefined()
  })

  it('rejects a table that leaves a boundary unclassified', () => {
    const missingAdminColumn = {
      isApproval: { webhook: true, public: true },
    } as const

    // @ts-expect-error - an unclassified boundary must not compile.
    const row: VisibilityTable['isApproval'] = missingAdminColumn.isApproval

    expect(row).toBeDefined()
  })
})
