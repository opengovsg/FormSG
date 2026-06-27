import { aws } from 'src/app/config/config'

import {
  SubmissionHistoryMalformedError,
  SubmissionHistoryNotFoundError,
  SubmissionHistoryUploadError,
} from '../submission-history.errors'
import {
  buildSnapshotS3Key,
  S3SubmissionHistoryStore,
} from '../submission-history.s3.store'
import { SubmissionHistorySnapshot } from '../submission-history.types'

const MOCK_SNAPSHOT: SubmissionHistorySnapshot = {
  _v: 1,
  formId: 'a'.repeat(24),
  submissionId: 'b'.repeat(24),
  submissionIndex: 2,
  workflowStep: 1,
  encryptedContent: 'encrypted-content',
  encryptedSubmissionSecretKey: 'wrapped-submission-secret-key',
  verifiedContent: 'verified-content',
  attachmentMetadata: { fieldId1: 's3-object-key-1' },
  createdAt: '2026-06-17T08:30:00.000Z',
}

const mockUploadResolves = () =>
  jest.spyOn(aws.s3, 'upload').mockReturnValue({
    promise: () => Promise.resolve({}),
  } as unknown as ReturnType<typeof aws.s3.upload>)

const mockUploadRejects = () =>
  jest.spyOn(aws.s3, 'upload').mockReturnValue({
    promise: () => Promise.reject(new Error('S3 is down')),
  } as unknown as ReturnType<typeof aws.s3.upload>)

const mockGetObjectResolves = (body: unknown) =>
  jest.spyOn(aws.s3, 'getObject').mockReturnValue({
    promise: () => Promise.resolve({ Body: body }),
  } as unknown as ReturnType<typeof aws.s3.getObject>)

const mockGetObjectRejects = () =>
  jest.spyOn(aws.s3, 'getObject').mockReturnValue({
    promise: () => Promise.reject(new Error('NoSuchKey')),
  } as unknown as ReturnType<typeof aws.s3.getObject>)

describe('submission-history.s3.store', () => {
  const store = new S3SubmissionHistoryStore()

  afterEach(() => jest.restoreAllMocks())

  describe('buildSnapshotS3Key', () => {
    it('builds a form-id-first, slash-delimited, format-suffixed key', () => {
      expect(
        buildSnapshotS3Key({
          formId: 'form123',
          submissionId: 'sub456',
          submissionIndex: 3,
          format: 'v4',
        }),
      ).toBe('form123/sub456/3/v4.json')
    })

    it('encodes the format in the key', () => {
      const locator = {
        formId: 'f',
        submissionId: 's',
        submissionIndex: 0,
        format: 'v1' as const,
      }
      expect(buildSnapshotS3Key(locator)).toBe('f/s/0/v1.json')
    })
  })

  describe('saveSnapshot', () => {
    it('uploads the serialized snapshot to the submission history bucket', async () => {
      const uploadSpy = mockUploadResolves()

      const result = await store.saveSnapshot(MOCK_SNAPSHOT, 'v4')

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toBe(true)
      expect(uploadSpy).toHaveBeenCalledWith({
        Bucket: aws.submissionHistoryS3Bucket,
        Key: `${MOCK_SNAPSHOT.formId}/${MOCK_SNAPSHOT.submissionId}/${MOCK_SNAPSHOT.submissionIndex}/v4.json`,
        Body: JSON.stringify(MOCK_SNAPSHOT),
        ContentType: 'application/json',
      })
    })

    it('returns SubmissionHistoryUploadError when the upload fails', async () => {
      mockUploadRejects()

      const result = await store.saveSnapshot(MOCK_SNAPSHOT, 'v4')

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        SubmissionHistoryUploadError,
      )
    })
  })

  describe('getSnapshot', () => {
    const locator = {
      formId: MOCK_SNAPSHOT.formId,
      submissionId: MOCK_SNAPSHOT.submissionId,
      submissionIndex: MOCK_SNAPSHOT.submissionIndex,
      format: 'v4' as const,
    }

    it('fetches, parses and validates the snapshot (round trip)', async () => {
      const getObjectSpy = mockGetObjectResolves(
        Buffer.from(JSON.stringify(MOCK_SNAPSHOT)),
      )

      const result = await store.getSnapshot(locator)

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual(MOCK_SNAPSHOT)
      expect(getObjectSpy).toHaveBeenCalledWith({
        Bucket: aws.submissionHistoryS3Bucket,
        Key: `${locator.formId}/${locator.submissionId}/${locator.submissionIndex}/v4.json`,
      })
    })

    it('fails loud with SubmissionHistoryNotFoundError when the object is missing', async () => {
      mockGetObjectRejects()

      const result = await store.getSnapshot(locator)

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        SubmissionHistoryNotFoundError,
      )
    })

    it('returns SubmissionHistoryMalformedError on unparseable JSON', async () => {
      mockGetObjectResolves(Buffer.from('this is not json'))

      const result = await store.getSnapshot(locator)

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        SubmissionHistoryMalformedError,
      )
    })

    it('returns SubmissionHistoryMalformedError when the schema does not match', async () => {
      // Missing the required encryptedContent field.
      const invalid = { ...MOCK_SNAPSHOT } as Partial<SubmissionHistorySnapshot>
      delete invalid.encryptedContent
      mockGetObjectResolves(Buffer.from(JSON.stringify(invalid)))

      const result = await store.getSnapshot(locator)

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        SubmissionHistoryMalformedError,
      )
    })
  })
})
