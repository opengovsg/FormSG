import { SubmittedStep, WorkflowStatus } from 'formsg-shared/types'

import { projectSubmittedStepForWebhook } from 'src/app/modules/submission/submitted-step-visibility'
import { WorkflowWebhookEventObject } from 'src/app/modules/webhook/webhook.types'
import { WebhookData } from 'src/types/submission'

import { SnapshotDataIntegrityError } from '../submission-snapshot.errors'
import { WebhookPayloadPolicy } from '../webhook-payload-policy'
import { reconstructMrfWebhookData } from '../webhook-reconstruction'

/**
 * The real step-subdocument shape with EVERY field populated, including the
 * internal ones.
 *
 * RATIONALE: Allows internal field leak to be detected by tests.
 */
const makeStoredStep = (index: number): SubmittedStep => ({
  isApproval: true,
  submittedAt: `2026-07-2${index}T00:00:00.000Z`,
  status: WorkflowStatus.APPROVED,
  nextStepRecipientEmails: [`step-${index}@example.com`],
  submitterId: `SUBMITTER_ID_HASH_${index}`,
  snapshotTokens: { v4: `SNAPSHOT_TOKEN_LEAF_${index}` },
})

const makeLiveData = (overrides: Partial<WebhookData> = {}): WebhookData => ({
  formId: 'form-1',
  submissionId: 'sub-1',
  encryptedContent: 'LIVE_ROW_ENCRYPTED_CONTENT',
  verifiedContent: 'LIVE_ROW_VERIFIED_CONTENT',
  version: 1,
  created: new Date('2026-07-22T00:00:00.000Z'),
  attachmentDownloadUrls: { 'field-9': 'https://example.com/attachment' },
  workflowContent: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    workflow: [{ _id: 'step-def' }] as any,
    workflowStep: 2,
    submittedSteps: [0, 1, 2].map((index) =>
      projectSubmittedStepForWebhook(makeStoredStep(index)),
    ),
  },
  encryptedSubmissionSecretKey: 'LIVE_ROW_KEY',
  ...overrides,
})

const makeV4Snapshot = () =>
  ({
    _v: 1 as const,
    contentFormat: 'v4' as const,
    formId: 'form-1',
    submissionId: 'sub-1',
    submissionIndex: 1,
    workflowStep: 1,
    encryptedContent: 'FROZEN_ENCRYPTED_CONTENT',
    encryptedSubmissionSecretKey: 'FROZEN_KEY',
    verifiedContent: 'FROZEN_VERIFIED_CONTENT',
    createdAt: '2026-07-22T00:00:00.000Z',
  }) as const

const PLUMBER_LATEST: WebhookPayloadPolicy = {
  contentShape: 'v4',
  includeEncryptedSubmissionSecretKey: true,
  includeEncryptedStepToken: true,
}

describe('reconstructMrfWebhookData', () => {
  describe('without submissionIndex (legacy / no-snapshot path)', () => {
    it('returns liveData unchanged and does not mutate it', () => {
      const liveData = makeLiveData()
      const frozen = JSON.parse(JSON.stringify(liveData))

      const output = reconstructMrfWebhookData({
        liveData,
        policy: PLUMBER_LATEST,
      })

      expect(output).toEqual(liveData)
      // liveData itself was not mutated.
      expect(JSON.parse(JSON.stringify(liveData))).toEqual(frozen)
    })
  })

  describe('with submissionIndex (snapshot path)', () => {
    it('throws SnapshotDataIntegrityError when the snapshot is missing (fails loud, never falls back to liveData)', () => {
      const liveData = makeLiveData()

      expect(() =>
        reconstructMrfWebhookData({
          liveData,
          submissionIndex: 1,
          snapshot: undefined,
          policy: PLUMBER_LATEST,
        }),
      ).toThrow(SnapshotDataIntegrityError)
    })

    it('derives version from the snapshot content shape (v4 => 3), overriding liveData.version', () => {
      const output = reconstructMrfWebhookData({
        liveData: makeLiveData({ version: 1 }),
        snapshot: makeV4Snapshot(),
        submissionIndex: 1,
        policy: PLUMBER_LATEST,
      })

      expect(output.version).toBe(3)
    })

    it('sources encryptedSubmissionSecretKey from the FROZEN snapshot, not the live row', () => {
      const output = reconstructMrfWebhookData({
        liveData: makeLiveData({
          encryptedSubmissionSecretKey: 'LIVE_ROW_KEY',
        }),
        snapshot: makeV4Snapshot(),
        submissionIndex: 1,
        policy: {
          ...PLUMBER_LATEST,
          includeEncryptedSubmissionSecretKey: true,
        },
      })

      expect(output.encryptedSubmissionSecretKey).toBe('FROZEN_KEY')
    })

    it('omits encryptedSubmissionSecretKey entirely when the policy excludes it', () => {
      const output = reconstructMrfWebhookData({
        liveData: makeLiveData(),
        snapshot: makeV4Snapshot(),
        submissionIndex: 1,
        policy: {
          ...PLUMBER_LATEST,
          includeEncryptedSubmissionSecretKey: false,
        },
      })

      expect('encryptedSubmissionSecretKey' in output).toBe(false)
    })

    it('freezes encryptedContent and verifiedContent from the snapshot', () => {
      const output = reconstructMrfWebhookData({
        liveData: makeLiveData(),
        snapshot: makeV4Snapshot(),
        submissionIndex: 1,
        policy: PLUMBER_LATEST,
      })

      expect(output.encryptedContent).toBe('FROZEN_ENCRYPTED_CONTENT')
      expect(output.verifiedContent).toBe('FROZEN_VERIFIED_CONTENT')
    })

    it('reconstructs submittedSteps as the prefix up to and including this step', () => {
      const output = reconstructMrfWebhookData({
        liveData: makeLiveData(), // 3 submittedSteps
        snapshot: makeV4Snapshot(),
        submissionIndex: 1,
        policy: PLUMBER_LATEST,
      })

      const workflowContent =
        output.workflowContent as WorkflowWebhookEventObject
      expect(workflowContent.submittedSteps).toHaveLength(2)
      // workflow definition preserved from the live row.
      expect(workflowContent.workflow).toEqual([{ _id: 'step-def' }])
      // workflowStep taken from the snapshot.
      expect(workflowContent.workflowStep).toBe(1)
    })

    it('handles a plain-object liveData.workflowContent gracefully', () => {
      expect(() =>
        reconstructMrfWebhookData({
          liveData: makeLiveData({ workflowContent: {} }),
          snapshot: makeV4Snapshot(),
          submissionIndex: 1,
          policy: PLUMBER_LATEST,
        }),
      ).not.toThrow()
    })
  })

  describe('byte-identity (initial send vs retry)', () => {
    it('produces deep-equal output across repeated calls and a store round-trip', () => {
      const liveData = makeLiveData()
      const snapshot = makeV4Snapshot()

      const first = reconstructMrfWebhookData({
        liveData,
        snapshot,
        submissionIndex: 1,
        policy: PLUMBER_LATEST,
      })

      // Simulate a store write/read round-trip of the snapshot (JSON bytes).
      const roundTrippedSnapshot = JSON.parse(JSON.stringify(snapshot))
      const second = reconstructMrfWebhookData({
        liveData,
        snapshot: roundTrippedSnapshot,
        submissionIndex: 1,
        policy: PLUMBER_LATEST,
      })

      expect(second).toEqual(first)
    })
  })

  describe('secrecy — no step-token fields ever leak', () => {
    it.each([
      'stepTokenHash',
      'encryptedStepToken',
      'snapshotTokens',
      'SNAPSHOT_TOKEN_LEAF_0',
      'SNAPSHOT_TOKEN_LEAF_1',
      'SNAPSHOT_TOKEN_LEAF_2',
    ])('never emits %s on the snapshot path or the live path', (forbidden) => {
      const snapshotPath = JSON.stringify(
        reconstructMrfWebhookData({
          liveData: makeLiveData(),
          snapshot: makeV4Snapshot(),
          submissionIndex: 1,
          policy: PLUMBER_LATEST,
        }),
      )
      const livePath = JSON.stringify(
        reconstructMrfWebhookData({
          liveData: makeLiveData(),
          policy: PLUMBER_LATEST,
        }),
      )

      expect(snapshotPath).not.toContain(forbidden)
      expect(livePath).not.toContain(forbidden)
    })
  })
})
