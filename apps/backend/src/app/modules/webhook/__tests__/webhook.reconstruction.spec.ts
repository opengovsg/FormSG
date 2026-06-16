import { SubmittedStep } from 'formsg-shared/types'

import { WebhookView } from 'src/types'
import { SubmissionHistorySnapshot } from 'src/types/submission_history'

import { SubmissionHistoryMissingError } from '../webhook.errors'
import { reconstructWebhookView } from '../webhook.reconstruction'

const makeSubmittedSteps = (n: number): SubmittedStep[] =>
  Array.from(
    { length: n },
    (_, i) =>
      ({
        isApproval: false,
        submittedAt: `2026-06-16T0${i}:00:00.000Z`,
      }) as SubmittedStep,
  )

const makeLiveView = (
  overrides: Partial<WebhookView['data']> = {},
): WebhookView => ({
  data: {
    formId: 'form-id',
    submissionId: 'submission-id',
    encryptedContent: 'live-row-encrypted-content',
    verifiedContent: 'live-row-verified-content',
    version: 1,
    created: new Date('2026-06-16T00:00:00.000Z'),
    attachmentDownloadUrls: {},
    encryptedSubmissionSecretKey: 'wrapped-submission-secret-key',
    workflowContent: {
      workflow: [],
      workflowStep: 3,
      submittedSteps: makeSubmittedSteps(4),
    },
    ...overrides,
  },
})

const makeSnapshot = (
  overrides: Partial<SubmissionHistorySnapshot> = {},
): SubmissionHistorySnapshot =>
  ({
    submissionId: 'submission-id',
    formId: 'form-id',
    submissionIndex: 0,
    workflowStep: 0,
    encryptedContent: 'snapshot-encrypted-content',
    contentFormat: 'v4',
    ...overrides,
  }) as unknown as SubmissionHistorySnapshot

describe('reconstructWebhookView', () => {
  describe('without a submissionIndex (V3 / plumber-today / legacy)', () => {
    it('should return today’s live-row payload unchanged', () => {
      const liveView = makeLiveView()

      const result = reconstructWebhookView({
        liveView,
        webhookType: 'plumber',
      })

      expect(result).toEqual(liveView)
    })
  })

  describe('with a submissionIndex (initial V4 send)', () => {
    it('should raise a data-integrity error when the snapshot is missing (never silently falls back)', () => {
      expect(() =>
        reconstructWebhookView({
          liveView: makeLiveView(),
          webhookType: 'plumber',
          submissionIndex: 0,
          snapshot: null,
        }),
      ).toThrow(SubmissionHistoryMissingError)
    })

    it('should source content/verified/version/workflowStep from the snapshot', () => {
      const result = reconstructWebhookView({
        liveView: makeLiveView(),
        webhookType: 'plumber',
        submissionIndex: 3,
        snapshot: makeSnapshot({
          submissionIndex: 3,
          workflowStep: 2,
          encryptedContent: 'snapshot-encrypted-content',
          verifiedContent: 'snapshot-verified-content',
          contentFormat: 'v4',
        }),
      })

      expect(result.data.encryptedContent).toBe('snapshot-encrypted-content')
      expect(result.data.verifiedContent).toBe('snapshot-verified-content')
      // 'v4' -> protocol version 3 (derived, not stored)
      expect(result.data.version).toBe(3)
      const workflowContent = result.data
        .workflowContent as WebhookView['data']['workflowContent'] & {
        workflowStep: number
      }
      expect(workflowContent.workflowStep).toBe(2)
    })

    it('should derive protocol version 2.1 from a v1 snapshot', () => {
      const result = reconstructWebhookView({
        liveView: makeLiveView(),
        webhookType: 'generic',
        submissionIndex: 3,
        snapshot: makeSnapshot({ submissionIndex: 3, contentFormat: 'v1' }),
      })

      expect(result.data.version).toBe(2.1)
    })

    it('should reconstruct submittedSteps as the slice prefix up to submissionIndex', () => {
      const result = reconstructWebhookView({
        liveView: makeLiveView(), // live row has 4 submittedSteps
        webhookType: 'plumber',
        submissionIndex: 1,
        snapshot: makeSnapshot({ submissionIndex: 1 }),
      })

      const workflowContent = result.data.workflowContent as {
        submittedSteps: SubmittedStep[]
      }
      // slice(0, submissionIndex + 1) => first 2 of the 4 steps
      expect(workflowContent.submittedSteps).toHaveLength(2)
    })

    it('should keep the wrapped secret key for a plumber consumer on the latest step', () => {
      const result = reconstructWebhookView({
        liveView: makeLiveView(), // 4 submitted steps => latest index = 3
        webhookType: 'plumber',
        submissionIndex: 3,
        snapshot: makeSnapshot({ submissionIndex: 3 }),
      })

      expect(result.data.encryptedSubmissionSecretKey).toBe(
        'wrapped-submission-secret-key',
      )
    })

    it('should drop the wrapped secret key for a plumber consumer on a non-latest step', () => {
      const result = reconstructWebhookView({
        liveView: makeLiveView(),
        webhookType: 'plumber',
        submissionIndex: 1,
        snapshot: makeSnapshot({ submissionIndex: 1 }),
      })

      expect(result.data.encryptedSubmissionSecretKey).toBeUndefined()
    })

    it('should drop the wrapped secret key for a generic consumer even on the latest step', () => {
      const result = reconstructWebhookView({
        liveView: makeLiveView(),
        webhookType: 'generic',
        submissionIndex: 3,
        snapshot: makeSnapshot({ submissionIndex: 3, contentFormat: 'v1' }),
      })

      expect(result.data.encryptedSubmissionSecretKey).toBeUndefined()
    })

    it('should keep row-sourced fields (formId, submissionId, created)', () => {
      const liveView = makeLiveView()
      const result = reconstructWebhookView({
        liveView,
        webhookType: 'plumber',
        submissionIndex: 3,
        snapshot: makeSnapshot({ submissionIndex: 3 }),
      })

      expect(result.data.formId).toBe(liveView.data.formId)
      expect(result.data.submissionId).toBe(liveView.data.submissionId)
      expect(result.data.created).toBe(liveView.data.created)
    })

    it('should produce a byte-identical payload across repeated calls (initial send == retry)', () => {
      const args = {
        liveView: makeLiveView(),
        webhookType: 'plumber' as const,
        submissionIndex: 3,
        snapshot: makeSnapshot({ submissionIndex: 3 }),
      }

      expect(reconstructWebhookView(args)).toEqual(reconstructWebhookView(args))
    })

    it('should resolve the correct step in a loop-back workflow (workflowStep repeats, submissionIndex does not)', () => {
      // Two snapshots share workflowStep 1 (loop-back) but differ by index.
      const earlier = reconstructWebhookView({
        liveView: makeLiveView(),
        webhookType: 'plumber',
        submissionIndex: 1,
        snapshot: makeSnapshot({
          submissionIndex: 1,
          workflowStep: 1,
          encryptedContent: 'earlier-loop-content',
        }),
      })
      const later = reconstructWebhookView({
        liveView: makeLiveView(),
        webhookType: 'plumber',
        submissionIndex: 3,
        snapshot: makeSnapshot({
          submissionIndex: 3,
          workflowStep: 1,
          encryptedContent: 'later-loop-content',
        }),
      })

      expect(earlier.data.encryptedContent).toBe('earlier-loop-content')
      expect(later.data.encryptedContent).toBe('later-loop-content')
    })
  })
})
