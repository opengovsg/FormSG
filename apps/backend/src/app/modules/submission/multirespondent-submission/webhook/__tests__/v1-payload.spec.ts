import { VIRUS_SCANNER_SUBMISSION_VERSION } from 'formsg-shared/constants'

import { WebhookData } from 'src/types/submission'

import { SubmissionSnapshotV1 } from '../submission-snapshot.schema'
import {
  assertStorageShapedKeySet,
  STORAGE_SHAPED_PAYLOAD_KEYS,
  StorageShapedWebhookData,
} from '../v1-payload'
import { reconstructV1WebhookData } from '../webhook-reconstruction'

const LOG_META = { formId: 'form-1', submissionId: 'sub-1' }

const makeLiveData = (): WebhookData => ({
  formId: 'form-1',
  submissionId: 'sub-1',
  encryptedContent: 'LIVE_ROW_SUBMISSION_KEY_CONTENT',
  verifiedContent: 'LIVE_ROW_VERIFIED_CONTENT',
  version: 4,
  created: new Date('2026-07-22T00:00:00.000Z'),
  attachmentDownloadUrls: { 'field-live': 'live-attachment-key' },
  paymentContent: {},
  // The two keys PIN-04 forbids, both present on the live row.
  encryptedSubmissionSecretKey: 'LIVE_ROW_WRAPPED_KEY',
  workflowContent: {
    workflow: [],
    workflowStep: 0,
    submittedSteps: [
      { submittedAt: 'now', nextStepRecipientEmails: ['someone@example.com'] },
    ],
  } as unknown as WebhookData['workflowContent'],
})

const makeV1Snapshot = (
  overrides: Partial<SubmissionSnapshotV1> = {},
): SubmissionSnapshotV1 => ({
  _v: 1,
  contentFormat: 'v1',
  formId: 'form-1',
  submissionId: 'sub-1',
  submissionIndex: 0,
  workflowStep: 0,
  encryptedContent: 'FROZEN_FORM_KEY_CONTENT',
  createdAt: '2026-07-22T00:00:00.000Z',
  ...overrides,
})

describe('reconstructV1WebhookData', () => {
  it('should carry exactly storage mode’s key set, and neither forbidden key', () => {
    // Act
    const data = reconstructV1WebhookData({
      liveData: makeLiveData(),
      snapshot: makeV1Snapshot({ verifiedContent: 'FROZEN_VERIFIED' }),
    })

    // Assert: the delivered bytes are the JSON, so compare what survives it.
    expect(
      Object.keys(JSON.parse(JSON.stringify(data)) as Record<string, unknown>),
    ).toEqual([...STORAGE_SHAPED_PAYLOAD_KEYS])
    expect(data).not.toHaveProperty('workflowContent')
    expect(data).not.toHaveProperty('encryptedSubmissionSecretKey')
    expect(data).not.toHaveProperty('encryptedStepToken')
  })

  it('should take content, verified content and attachments from the snapshot, not the live row', () => {
    const snapshot = makeV1Snapshot({
      verifiedContent: 'FROZEN_VERIFIED',
      attachmentMetadata: { 'field-9': 'frozen-attachment-key' },
    })

    const data = reconstructV1WebhookData({
      liveData: makeLiveData(),
      snapshot,
    })

    expect(data.encryptedContent).toBe(snapshot.encryptedContent)
    expect(data.verifiedContent).toBe('FROZEN_VERIFIED')
    expect(data.attachmentDownloadUrls).toEqual({
      'field-9': 'frozen-attachment-key',
    })
  })

  it('should label the payload with the storage-mode submission version', () => {
    const data = reconstructV1WebhookData({
      liveData: makeLiveData(),
      snapshot: makeV1Snapshot(),
    })

    // Asserted against the shared constant, never a literal, so the wire value
    // and the one storage mode sends cannot drift.
    expect(data.version).toBe(VIRUS_SCANNER_SUBMISSION_VERSION)
  })

  it('should keep identity and timestamp from the row, which the snapshot does not decide', () => {
    const liveData = makeLiveData()

    const data = reconstructV1WebhookData({
      liveData,
      snapshot: makeV1Snapshot(),
    })

    expect(data.formId).toBe(liveData.formId)
    expect(data.submissionId).toBe(liveData.submissionId)
    expect(data.created).toBe(liveData.created)
  })
})

describe('assertStorageShapedKeySet', () => {
  it('should pass a payload the V1 reconstruction produced', () => {
    const data = reconstructV1WebhookData({
      liveData: makeLiveData(),
      snapshot: makeV1Snapshot({ verifiedContent: 'FROZEN_VERIFIED' }),
    })

    expect(assertStorageShapedKeySet(data, LOG_META).isOk()).toBe(true)
  })

  it('should pass an unauthenticated form, whose verifiedContent is undefined', () => {
    // `JSON.stringify` drops a present-but-undefined key, so a raw
    // `Object.keys` comparison would fail this for a key no consumer sees.
    const data = reconstructV1WebhookData({
      liveData: makeLiveData(),
      snapshot: makeV1Snapshot(),
    })

    expect(data.verifiedContent).toBeUndefined()
    expect(assertStorageShapedKeySet(data, LOG_META).isOk()).toBe(true)
  })

  it.each(['workflowContent', 'encryptedSubmissionSecretKey', 'anythingNew'])(
    'should fail closed when %s reaches the payload',
    (key) => {
      // This is the case the type cannot catch: both forbidden keys are
      // optional on WebhookData, so a widened value stays assignable.
      const data = {
        ...reconstructV1WebhookData({
          liveData: makeLiveData(),
          snapshot: makeV1Snapshot(),
        }),
        [key]: 'should not be here',
      } as StorageShapedWebhookData

      const result = assertStorageShapedKeySet(data, LOG_META)
      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr().message).toContain(key)
    },
  )

  it('should fail closed when a required key is missing', () => {
    const withoutContent: Record<string, unknown> = {
      ...reconstructV1WebhookData({
        liveData: makeLiveData(),
        snapshot: makeV1Snapshot(),
      }),
    }
    delete withoutContent.encryptedContent

    const result = assertStorageShapedKeySet(
      withoutContent as unknown as StorageShapedWebhookData,
      LOG_META,
    )
    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr().message).toContain('encryptedContent')
  })
})
