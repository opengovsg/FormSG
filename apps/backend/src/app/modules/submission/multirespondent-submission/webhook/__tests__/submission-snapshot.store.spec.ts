import { NoSuchKey, S3ServiceException } from '@aws-sdk/client-s3'
import crypto from 'crypto'

import { aws as AwsConfig } from 'src/app/config/config'
import { ErrorCodes } from 'src/app/modules/core/core.errors'

import {
  SnapshotAccessDeniedError,
  SnapshotDataIntegrityError,
  SnapshotReadError,
  SnapshotWriteError,
} from '../submission-snapshot.errors'
import {
  buildV1Snapshot,
  buildV4Snapshot,
} from '../submission-snapshot.producer'
import {
  SubmissionSnapshotV1,
  SubmissionSnapshotV4,
} from '../submission-snapshot.schema'
import {
  buildSnapshotKey,
  readSnapshot,
  writeSnapshot,
} from '../submission-snapshot.store'

jest.mock('src/app/config/config')

const TEST_BUCKET = 'test-submission-history-v4-bucket'
const TEST_V1_BUCKET = 'test-submission-history-v1-bucket'

const COORDS = {
  formId: 'form-1',
  submissionId: 'sub-1',
  submissionIndex: 2,
}

const makeSnapshot = (): SubmissionSnapshotV4 =>
  buildV4Snapshot({
    ...COORDS,
    workflowStep: 1,
    encryptedContent: 'encrypted-content-blob',
    encryptedSubmissionSecretKey: 'wrapped-read-key',
    createdAt: '2026-07-22T00:00:00.000Z',
  })

const makeV1Snapshot = (): SubmissionSnapshotV1 =>
  buildV1Snapshot({
    ...COORDS,
    workflowStep: 1,
    encryptedContent: 'form-key-encrypted-content-blob',
    createdAt: '2026-07-22T00:00:00.000Z',
  })

const mockS3Body = (content: string) => ({
  Body: { transformToString: () => Promise.resolve(content) },
})

const mockS3Error = (name: string, httpStatusCode: number) =>
  name === 'NoSuchKey'
    ? new NoSuchKey({
        message: 'No such key was found.',
        $metadata: { httpStatusCode },
      })
    : new S3ServiceException({
        name,
        $fault: 'client',
        $metadata: { httpStatusCode },
      })

// Helper to make a resolved/rejected aws-sdk promise shape.
const putResolves = () => jest.fn().mockReturnValue(Promise.resolve({}))
const putRejectsThen = (
  ...outcomes: Array<{ reject?: unknown } | { resolve?: unknown }>
) => {
  const fn = jest.fn()
  outcomes.forEach((o) => {
    if ('reject' in o) {
      fn.mockReturnValueOnce(Promise.reject(o.reject))
    } else {
      fn.mockReturnValueOnce(
        Promise.resolve((o as { resolve?: unknown }).resolve),
      )
    }
  })
  return fn
}

type Uuid = ReturnType<typeof crypto.randomUUID>

/**
 * Pins the tokens writeSnapshot generates so the keys under test are
 * deterministic. Attempts beyond the supplied list get a distinct `tok-<n>`.
 */
const mockTokens = (...tokens: string[]) => {
  let i = 0
  return jest.spyOn(crypto, 'randomUUID').mockImplementation(() => {
    const n = i++
    return (tokens[n] ?? `tok-${n}`) as Uuid
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(
    AwsConfig as unknown as { submissionHistoryV4S3Bucket: string }
  ).submissionHistoryV4S3Bucket = TEST_BUCKET
  ;(
    AwsConfig as unknown as { submissionHistoryV1S3Bucket: string }
  ).submissionHistoryV1S3Bucket = TEST_V1_BUCKET
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('buildSnapshotKey', () => {
  it('should build the key as formId/submissionId/submissionIndex/token.json with a raw (non-padded) index', () => {
    expect(
      buildSnapshotKey({ ...COORDS, submissionIndex: 7, token: 'abc' }),
    ).toBe('form-1/sub-1/7/abc.json')
  })
})

describe('writeSnapshot', () => {
  it('should PUT exactly one object with the buildSnapshotKey Key, IfNoneMatch:*, and a Body that round-trips', async () => {
    // Arrange
    const snapshot = makeSnapshot()
    const putObject = putResolves()
    ;(AwsConfig.s3.send as jest.Mock) = putObject
    mockTokens('tok-1')

    // Act
    const result = await writeSnapshot(snapshot)

    // Assert
    expect(result.isOk()).toBe(true)
    expect(putObject).toHaveBeenCalledTimes(1)
    const { input: params } = putObject.mock.calls[0][0]
    expect(params.Bucket).toBe(TEST_BUCKET)
    expect(params.Key).toBe(buildSnapshotKey({ ...COORDS, token: 'tok-1' }))
    expect(params.IfNoneMatch).toBe('*')
    expect(params.ContentType).toBe('application/json')
    // Body round-trips through parse back to the input snapshot.
    expect(JSON.parse(params.Body as string)).toEqual(snapshot)
    expect(result._unsafeUnwrap().token).toBe('tok-1')
    expect(result._unsafeUnwrap().key).toBe(
      buildSnapshotKey({ ...COORDS, token: 'tok-1' }),
    )
  })

  it('should retry with a FRESH token on 412 and never overwrite the first object', async () => {
    // Arrange: first PUT collides (412), second succeeds.
    const snapshot = makeSnapshot()
    const putObject = putRejectsThen(
      { reject: mockS3Error('PreconditionFailed', 412) },
      { resolve: {} },
    )
    ;(AwsConfig.s3.send as jest.Mock) = putObject
    mockTokens('tok-collide', 'tok-win')

    // Act
    const result = await writeSnapshot(snapshot)

    // Assert
    expect(result.isOk()).toBe(true)
    expect(putObject).toHaveBeenCalledTimes(2)
    const firstKey = putObject.mock.calls[0][0].input.Key
    const secondKey = putObject.mock.calls[1][0].input.Key
    expect(firstKey).not.toBe(secondKey) // fresh token => distinct key
    expect(firstKey).toBe(buildSnapshotKey({ ...COORDS, token: 'tok-collide' }))
    expect(secondKey).toBe(buildSnapshotKey({ ...COORDS, token: 'tok-win' }))
    // IfNoneMatch on EVERY attempt => the first object's bytes are never clobbered.
    expect(putObject.mock.calls[0][0].input.IfNoneMatch).toBe('*')
    expect(putObject.mock.calls[1][0].input.IfNoneMatch).toBe('*')
    expect(result._unsafeUnwrap().token).toBe('tok-win')
  })

  it('should fail loud with SnapshotWriteError on a non-collision rejection (no retry)', async () => {
    const snapshot = makeSnapshot()
    const putObject = putRejectsThen({
      reject: mockS3Error('AccessDenied', 403),
    })
    ;(AwsConfig.s3.send as jest.Mock) = putObject
    mockTokens('tok-1')

    const result = await writeSnapshot(snapshot)

    expect(result.isErr()).toBe(true)
    expect(putObject).toHaveBeenCalledTimes(1) // no retry on non-412
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(SnapshotWriteError)
  })

  it('should fail loud when a persistent 412 exceeds the retry bound', async () => {
    const snapshot = makeSnapshot()
    // Persistent 412 on every fresh token — must stop and fail loud.
    const putObject = jest
      .fn()
      .mockReturnValue(Promise.reject(mockS3Error('PreconditionFailed', 412)))
    ;(AwsConfig.s3.send as jest.Mock) = putObject
    // Every attempt gets a distinct fresh token (tok-0, tok-1, ...).
    mockTokens()

    const result = await writeSnapshot(snapshot)

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(SnapshotWriteError)
    // Bounded: capped at MAX_WRITE_ATTEMPTS (2), not infinite.
    expect(putObject).toHaveBeenCalledTimes(2)
    // Every attempt kept IfNoneMatch — no silent overwrite even at exhaustion.
    putObject.mock.calls.forEach((call) =>
      expect(call[0].input.IfNoneMatch).toBe('*'),
    )
  })
})

describe('readSnapshot', () => {
  it('should use buildSnapshotKey for the getObject Key (single key source)', async () => {
    const snapshot = makeSnapshot()
    const getObject = jest
      .fn()
      .mockReturnValue(Promise.resolve(mockS3Body(JSON.stringify(snapshot))))
    ;(AwsConfig.s3.send as jest.Mock) = getObject

    await readSnapshot({ ...COORDS, token: 'tok-1', contentFormat: 'v4' })

    const { input: params } = getObject.mock.calls[0][0]
    expect(params.Bucket).toBe(TEST_BUCKET)
    expect(params.Key).toBe(buildSnapshotKey({ ...COORDS, token: 'tok-1' }))
  })

  it('should resolve the parsed snapshot on a present read', async () => {
    const snapshot = makeSnapshot()
    ;(AwsConfig.s3.send as jest.Mock) = jest
      .fn()
      .mockReturnValue(Promise.resolve(mockS3Body(JSON.stringify(snapshot))))

    const result = await readSnapshot({ ...COORDS, token: 'tok-1', contentFormat: 'v4' })

    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap()).toEqual(snapshot)
  })

  it('should err SnapshotDataIntegrityError with NO fallback on a missing object (NoSuchKey/404)', async () => {
    ;(AwsConfig.s3.send as jest.Mock) = jest
      .fn()
      .mockReturnValue(Promise.reject(mockS3Error('NoSuchKey', 404)))

    const result = await readSnapshot({ ...COORDS, token: 'tok-1', contentFormat: 'v4' })

    expect(result.isErr()).toBe(true)
    const error = result._unsafeUnwrapErr()
    expect(error).toBeInstanceOf(SnapshotDataIntegrityError)
  })

  it('should err its own SnapshotAccessDeniedError, neither transient nor integrity, on AccessDenied', async () => {
    ;(AwsConfig.s3.send as jest.Mock) = jest
      .fn()
      .mockReturnValue(Promise.reject(mockS3Error('AccessDenied', 403)))

    const result = await readSnapshot({ ...COORDS, token: 'tok-1', contentFormat: 'v4' })

    expect(result.isErr()).toBe(true)
    const error = result._unsafeUnwrapErr()
    expect(error).toBeInstanceOf(SnapshotAccessDeniedError)
    expect(error).not.toBeInstanceOf(SnapshotReadError)
    expect(error).not.toBeInstanceOf(SnapshotDataIntegrityError)
    expect(error.code).toBe(ErrorCodes.SUBMISSION_MRF_SNAPSHOT_ACCESS_DENIED)
  })

  it.each([
    ['a throttled read', { code: 'SlowDown', statusCode: 503 }],
    ['a server-side failure', { code: 'InternalError', statusCode: 500 }],
    ['a request timeout', { code: 'RequestTimeout', statusCode: 400 }],
    ['a networking failure', { code: 'NetworkingError' }],
  ])(
    'should err a transient SnapshotReadError on %s',
    async (_case, s3Error) => {
      ;(AwsConfig.s3.send as jest.Mock) = jest
        .fn()
        .mockReturnValue(Promise.reject(s3Error))

      const result = await readSnapshot({ ...COORDS, token: 'tok-1', contentFormat: 'v4' })

      expect(result.isErr()).toBe(true)
      const error = result._unsafeUnwrapErr()
      expect(error).toBeInstanceOf(SnapshotReadError)
      expect(error).not.toBeInstanceOf(SnapshotDataIntegrityError)
    },
  )

  it('should err SnapshotDataIntegrityError on an empty stored body', async () => {
    ;(AwsConfig.s3.send as jest.Mock) = jest
      .fn()
      .mockReturnValue(Promise.resolve({}))

    const result = await readSnapshot({ ...COORDS, token: 'tok-1', contentFormat: 'v4' })

    expect(result._unsafeUnwrapErr()).toBeInstanceOf(SnapshotDataIntegrityError)
  })

  it('should err the SAME SnapshotDataIntegrityError on a malformed stored body', async () => {
    ;(AwsConfig.s3.send as jest.Mock) = jest
      .fn()
      .mockReturnValue(Promise.resolve(mockS3Body('{ not valid json')))

    const result = await readSnapshot({ ...COORDS, token: 'tok-1', contentFormat: 'v4' })

    expect(result.isErr()).toBe(true)
    const error = result._unsafeUnwrapErr()
    expect(error).toBeInstanceOf(SnapshotDataIntegrityError)
  })

  it('should err SnapshotDataIntegrityError on an unknown _v in the stored body', async () => {
    const bad = { ...makeSnapshot(), _v: 2 }
    ;(AwsConfig.s3.send as jest.Mock) = jest
      .fn()
      .mockReturnValue(Promise.resolve(mockS3Body(JSON.stringify(bad))))

    const result = await readSnapshot({ ...COORDS, token: 'tok-1', contentFormat: 'v4' })

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(SnapshotDataIntegrityError)
  })
})

describe('the store each shape is routed to', () => {
  it('should write a V1 snapshot to the V1 bucket and a V4 snapshot to the V4 bucket', async () => {
    // Arrange
    const putObject = putResolves()
    ;(AwsConfig.s3.send as jest.Mock) = putObject
    mockTokens('tok-v4', 'tok-v1')

    // Act
    await writeSnapshot(makeSnapshot())
    await writeSnapshot(makeV1Snapshot())

    // Assert: the shape decides the store, so a V1 consumer's objects can
    // never land among the submission-key-encrypted ones.
    expect(putObject.mock.calls[0][0].input.Bucket).toBe(TEST_BUCKET)
    expect(putObject.mock.calls[1][0].input.Bucket).toBe(TEST_V1_BUCKET)
  })

  it('should read back from the bucket matching the recorded shape', async () => {
    // Arrange
    const getObject = jest
      .fn()
      .mockReturnValue(Promise.resolve(mockS3Body(JSON.stringify(makeV1Snapshot()))))
    ;(AwsConfig.s3.send as jest.Mock) = getObject

    // Act
    const result = await readSnapshot({
      ...COORDS,
      token: 'tok-1',
      contentFormat: 'v1',
    })

    // Assert
    expect(result.isOk()).toBe(true)
    expect(getObject.mock.calls[0][0].input.Bucket).toBe(TEST_V1_BUCKET)
  })
})
