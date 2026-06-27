import { errAsync, okAsync } from 'neverthrow'

import { SubmissionHistoryUploadError } from '../submission-history.errors'
import {
  persistMrfSnapshotIfRequired,
  shouldPersistMrfSnapshot,
} from '../submission-history.producer'
import { SubmissionHistoryStore } from '../submission-history.store'

const MOCK_WEBHOOK = {
  url: 'https://example.com/webhook',
  isRetryEnabled: true,
}

describe('shouldPersistMrfSnapshot', () => {
  it('returns true for V4 (mrfVersion 2) with a webhook url and retries enabled', () => {
    expect(shouldPersistMrfSnapshot(MOCK_WEBHOOK, 2)).toBe(true)
  })

  it('returns false for V3 (mrfVersion 1)', () => {
    expect(shouldPersistMrfSnapshot(MOCK_WEBHOOK, 1)).toBe(false)
  })

  it('returns false when there is no webhook url', () => {
    expect(shouldPersistMrfSnapshot({ url: '', isRetryEnabled: true }, 2)).toBe(
      false,
    )
  })

  it('returns false when retries are disabled', () => {
    expect(
      shouldPersistMrfSnapshot(
        { url: 'https://example.com/webhook', isRetryEnabled: false },
        2,
      ),
    ).toBe(false)
  })

  it('returns false when the webhook is undefined', () => {
    expect(shouldPersistMrfSnapshot(undefined, 2)).toBe(false)
  })
})

describe('persistMrfSnapshotIfRequired', () => {
  const baseParams = {
    formId: 'a'.repeat(24),
    submissionId: 'b'.repeat(24),
    submissionIndex: 0,
    workflowStep: 0,
    webhook: MOCK_WEBHOOK,
    mrfVersion: 2,
    encryptedContent: 'encrypted-content',
    encryptedSubmissionSecretKey: 'wrapped-submission-secret-key',
    verifiedContent: 'verified-content',
    attachmentMetadata: new Map([['field1', 'key1']]),
  }

  afterEach(() => jest.restoreAllMocks())

  it('no-ops and resolves ok(false) when a snapshot is not required', async () => {
    const saveSpy = jest.spyOn(SubmissionHistoryStore, 'saveSnapshot')

    const result = await persistMrfSnapshotIfRequired({
      ...baseParams,
      mrfVersion: 1,
    })

    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap()).toBe(false)
    expect(saveSpy).not.toHaveBeenCalled()
  })

  it('persists a v4 snapshot with a plain-object attachmentMetadata when required', async () => {
    const saveSpy = jest
      .spyOn(SubmissionHistoryStore, 'saveSnapshot')
      .mockReturnValue(okAsync(true as const))

    const result = await persistMrfSnapshotIfRequired(baseParams)

    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap()).toBe(true)
    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        _v: 1,
        formId: baseParams.formId,
        submissionId: baseParams.submissionId,
        submissionIndex: 0,
        workflowStep: 0,
        encryptedContent: 'encrypted-content',
        encryptedSubmissionSecretKey: 'wrapped-submission-secret-key',
        verifiedContent: 'verified-content',
        // Map normalized to a plain object.
        attachmentMetadata: { field1: 'key1' },
        createdAt: expect.any(String),
      }),
      'v4',
    )
  })

  it('omits attachmentMetadata when it is empty', async () => {
    const saveSpy = jest
      .spyOn(SubmissionHistoryStore, 'saveSnapshot')
      .mockReturnValue(okAsync(true as const))

    await persistMrfSnapshotIfRequired({
      ...baseParams,
      attachmentMetadata: new Map(),
    })

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({ attachmentMetadata: undefined }),
      'v4',
    )
  })

  it('propagates a SubmissionHistoryUploadError from the store', async () => {
    jest
      .spyOn(SubmissionHistoryStore, 'saveSnapshot')
      .mockReturnValue(errAsync(new SubmissionHistoryUploadError()))

    const result = await persistMrfSnapshotIfRequired(baseParams)

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(
      SubmissionHistoryUploadError,
    )
  })
})
