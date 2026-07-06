import { aws } from 'src/app/config/config'

import {
  SubmissionHistoryMalformedError,
  SubmissionHistoryNotFoundError,
  SubmissionHistoryUploadError,
} from '../submission-history.errors'
import {
  buildSnapshotS3Key,
  MAX_SAVE_ATTEMPTS,
  S3SubmissionHistoryStore,
} from '../submission-history.s3.store'
import { SubmissionHistorySnapshot } from '../submission-history.types'

const MOCK_SNAPSHOT: SubmissionHistorySnapshot = {
  _v: 1,
  format: 'v4',
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

const MOCK_TOKEN = 'ffffffff-ffff-4fff-8fff-ffffffffffff'

const mockPutObjectResolves = () =>
  jest.spyOn(aws.s3, 'putObject').mockReturnValue({
    promise: () => Promise.resolve({}),
  } as unknown as ReturnType<typeof aws.s3.putObject>)

const mockPutObjectRejects = (error: Error = new Error('S3 is down')) =>
  jest.spyOn(aws.s3, 'putObject').mockReturnValue({
    promise: () => Promise.reject(error),
  } as unknown as ReturnType<typeof aws.s3.putObject>)

const preconditionFailed = () => {
  const error = new Error('At least one of the pre-conditions failed')
  ;(error as unknown as { code: string }).code = 'PreconditionFailed'
  ;(error as unknown as { statusCode: number }).statusCode = 412
  return error
}

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
    it('builds a form-id-first, slash-delimited, format-and-token-suffixed key', () => {
      expect(
        buildSnapshotS3Key({
          formId: 'form123',
          submissionId: 'sub456',
          submissionIndex: 3,
          format: 'v4',
          snapshotToken: 'tok789',
        }),
      ).toBe('form123/sub456/3/v4/tok789')
    })

    it('keys two attempts on the same step and format to distinct objects via the token', () => {
      const common = {
        formId: 'f',
        submissionId: 's',
        submissionIndex: 0,
        format: 'v4' as const,
      }
      expect(buildSnapshotS3Key({ ...common, snapshotToken: 'A' })).not.toBe(
        buildSnapshotS3Key({ ...common, snapshotToken: 'B' }),
      )
    })

    it('keys the two formats of the same step to distinct objects', () => {
      const common = {
        formId: 'f',
        submissionId: 's',
        submissionIndex: 0,
        snapshotToken: 'same-token',
      }
      expect(buildSnapshotS3Key({ ...common, format: 'v4' as const })).not.toBe(
        buildSnapshotS3Key({ ...common, format: 'v1' as const }),
      )
    })
  })

  describe('saveSnapshot', () => {
    it('mints a token, PUTs create-if-absent, and returns the token', async () => {
      const putSpy = mockPutObjectResolves()

      const result = await store.saveSnapshot(MOCK_SNAPSHOT, 'v4')

      expect(result.isOk()).toBe(true)
      const { snapshotToken } = result._unsafeUnwrap()
      expect(typeof snapshotToken).toBe('string')
      expect(snapshotToken.length).toBeGreaterThan(0)

      expect(putSpy).toHaveBeenCalledTimes(1)
      const putArgs = putSpy.mock.calls[0][0]
      expect(putArgs).toEqual(
        expect.objectContaining({
          Bucket: aws.submissionHistoryS3Bucket,
          Key: `${MOCK_SNAPSHOT.formId}/${MOCK_SNAPSHOT.submissionId}/${MOCK_SNAPSHOT.submissionIndex}/v4/${snapshotToken}`,
          Body: JSON.stringify(MOCK_SNAPSHOT),
          ContentType: 'application/json',
          // create-if-absent: a second PUT to the same key fails instead of
          // silently overwriting.
          IfNoneMatch: '*',
        }),
      )
    })

    it('mints a fresh token and retries when the key already exists (collision)', async () => {
      const putSpy = jest
        .spyOn(aws.s3, 'putObject')
        .mockReturnValueOnce({
          promise: () => Promise.reject(preconditionFailed()),
        } as unknown as ReturnType<typeof aws.s3.putObject>)
        .mockReturnValueOnce({
          promise: () => Promise.resolve({}),
        } as unknown as ReturnType<typeof aws.s3.putObject>)

      const result = await store.saveSnapshot(MOCK_SNAPSHOT, 'v4')

      expect(result.isOk()).toBe(true)
      expect(putSpy).toHaveBeenCalledTimes(2)
      const firstToken = (putSpy.mock.calls[0][0] as unknown as { Key: string })
        .Key
      const secondToken = (
        putSpy.mock.calls[1][0] as unknown as { Key: string }
      ).Key
      expect(firstToken).not.toBe(secondToken)
    })

    it('returns SubmissionHistoryUploadError when the upload fails', async () => {
      mockPutObjectRejects()

      const result = await store.saveSnapshot(MOCK_SNAPSHOT, 'v4')

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        SubmissionHistoryUploadError,
      )
    })

    it('gives up with SubmissionHistoryUploadError after exhausting remint attempts on persistent collisions', async () => {
      // Every PUT hits an existing key: the writer must bound its re-minting
      // (MAX_SAVE_ATTEMPTS) and fail loud rather than loop forever.
      const putSpy = jest.spyOn(aws.s3, 'putObject').mockReturnValue({
        promise: () => Promise.reject(preconditionFailed()),
      } as unknown as ReturnType<typeof aws.s3.putObject>)

      const result = await store.saveSnapshot(MOCK_SNAPSHOT, 'v4')

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        SubmissionHistoryUploadError,
      )
      expect(putSpy).toHaveBeenCalledTimes(MAX_SAVE_ATTEMPTS)
    })
  })

  describe('getSnapshot', () => {
    const locator = {
      formId: MOCK_SNAPSHOT.formId,
      submissionId: MOCK_SNAPSHOT.submissionId,
      submissionIndex: MOCK_SNAPSHOT.submissionIndex,
      format: 'v4' as const,
      snapshotToken: MOCK_TOKEN,
    }

    it('fetches the exact object the locator token names (round trip)', async () => {
      const getObjectSpy = mockGetObjectResolves(
        Buffer.from(JSON.stringify(MOCK_SNAPSHOT)),
      )

      const result = await store.getSnapshot(locator)

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual(MOCK_SNAPSHOT)
      expect(getObjectSpy).toHaveBeenCalledWith({
        Bucket: aws.submissionHistoryS3Bucket,
        Key: `${locator.formId}/${locator.submissionId}/${locator.submissionIndex}/v4/${MOCK_TOKEN}`,
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

    it('fails loud with SubmissionHistoryMalformedError on an unknown envelope version', async () => {
      // A future/foreign `_v` this reader does not understand must be treated as
      // a data-integrity error — the same failure as a missing object — never a
      // silent best-effort parse (ADR-0004).
      const unknownVersion = { ...MOCK_SNAPSHOT, _v: 999 }
      mockGetObjectResolves(Buffer.from(JSON.stringify(unknownVersion)))

      const result = await store.getSnapshot(locator)

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        SubmissionHistoryMalformedError,
      )
    })
  })
})
