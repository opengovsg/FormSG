import crypto from 'crypto'
import { text } from 'stream/consumers'

import { aws as AwsConfig } from 'src/app/config/config'

import {
  SnapshotDataIntegrityError,
  SnapshotReadError,
  SnapshotWriteError,
} from '../submission-snapshot.errors'
import { buildV4Snapshot } from '../submission-snapshot.producer'
import { SubmissionSnapshotV4 } from '../submission-snapshot.schema'
import {
  buildSnapshotKey,
  readV4Snapshot,
  writeV4Snapshot,
} from '../submission-snapshot.store'

jest.mock('src/app/config/config')

const TEST_BUCKET = 'test-submission-history-v4-bucket'

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
 * Pins the tokens writeV4Snapshot generates so the keys under test are
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

describe('writeV4Snapshot', () => {
  it('should PUT exactly one object with the buildSnapshotKey Key, IfNoneMatch:*, and a Body that round-trips', async () => {
    // Arrange
    const snapshot = makeSnapshot()
    const putObject = putResolves()
    ;(AwsConfig.s3.send as jest.Mock) = putObject
    mockTokens('tok-1')

    // Act
    const result = await writeV4Snapshot(snapshot)

    // Assert
    expect(result.isOk()).toBe(true)
    expect(putObject).toHaveBeenCalledTimes(1)
    const { input: params } = putObject.mock.calls[0][0]
    expect(params.Bucket).toBe(TEST_BUCKET)
    expect(params.Key).toBe(buildSnapshotKey({ ...COORDS, token: 'tok-1' }))
    expect(params.IfNoneMatch).toBe('*')
    expect(params.ContentType).toBe('application/json')
    // Body round-trips through parse back to the input snapshot.
    const body = await text(params.Body as ReadableStream)
    expect(JSON.parse(body)).toEqual(snapshot)
    expect(result._unsafeUnwrap().token).toBe('tok-1')
    expect(result._unsafeUnwrap().key).toBe(
      buildSnapshotKey({ ...COORDS, token: 'tok-1' }),
    )
  })

  it('should retry with a FRESH token on 412 and never overwrite the first object', async () => {
    // Arrange: first PUT collides (412), second succeeds.
    const snapshot = makeSnapshot()
    const putObject = putRejectsThen(
      { reject: { code: 'PreconditionFailed', statusCode: 412 } },
      { resolve: {} },
    )
    ;(AwsConfig.s3.send as jest.Mock) = putObject
    mockTokens('tok-collide', 'tok-win')

    // Act
    const result = await writeV4Snapshot(snapshot)

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
      reject: { code: 'AccessDenied', statusCode: 403 },
    })
    ;(AwsConfig.s3.send as jest.Mock) = putObject
    mockTokens('tok-1')

    const result = await writeV4Snapshot(snapshot)

    expect(result.isErr()).toBe(true)
    expect(putObject).toHaveBeenCalledTimes(1) // no retry on non-412
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(SnapshotWriteError)
  })

  it('should fail loud when a persistent 412 exceeds the retry bound', async () => {
    const snapshot = makeSnapshot()
    // Persistent 412 on every fresh token — must stop and fail loud.
    const putObject = jest
      .fn()
      .mockReturnValue(
        Promise.reject({ code: 'PreconditionFailed', statusCode: 412 }),
      )
    ;(AwsConfig.s3.send as jest.Mock) = putObject
    // Every attempt gets a distinct fresh token (tok-0, tok-1, ...).
    mockTokens()

    const result = await writeV4Snapshot(snapshot)

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

describe('readV4Snapshot', () => {
  it('should use buildSnapshotKey for the getObject Key (single key source)', async () => {
    const snapshot = makeSnapshot()
    const getObject = jest
      .fn()
      .mockReturnValue(
        Promise.resolve({ Body: Buffer.from(JSON.stringify(snapshot)) }),
      )
    ;(AwsConfig.s3.send as jest.Mock) = getObject

    await readV4Snapshot({ ...COORDS, token: 'tok-1' })

    const { input: params } = getObject.mock.calls[0][0]
    expect(params.Bucket).toBe(TEST_BUCKET)
    expect(params.Key).toBe(buildSnapshotKey({ ...COORDS, token: 'tok-1' }))
  })

  it('should resolve the parsed snapshot on a present read', async () => {
    const snapshot = makeSnapshot()
    ;(AwsConfig.s3.send as jest.Mock) = jest
      .fn()
      .mockReturnValue(
        Promise.resolve({ Body: Buffer.from(JSON.stringify(snapshot)) }),
      )

    const result = await readV4Snapshot({ ...COORDS, token: 'tok-1' })

    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap()).toEqual(snapshot)
  })

  it('should err SnapshotDataIntegrityError with NO fallback on a missing object (NoSuchKey/404)', async () => {
    ;(AwsConfig.s3.send as jest.Mock) = jest
      .fn()
      .mockReturnValue(Promise.reject({ code: 'NoSuchKey', statusCode: 404 }))

    const result = await readV4Snapshot({ ...COORDS, token: 'tok-1' })

    expect(result.isErr()).toBe(true)
    const error = result._unsafeUnwrapErr()
    expect(error).toBeInstanceOf(SnapshotDataIntegrityError)
  })

  it('should err SnapshotReadError, NOT an integrity error, on an operational S3 failure (AccessDenied)', async () => {
    ;(AwsConfig.s3.send as jest.Mock) = jest
      .fn()
      .mockReturnValue(
        Promise.reject({ code: 'AccessDenied', statusCode: 403 }),
      )

    const result = await readV4Snapshot({ ...COORDS, token: 'tok-1' })

    expect(result.isErr()).toBe(true)
    const error = result._unsafeUnwrapErr()
    expect(error).toBeInstanceOf(SnapshotReadError)
    expect(error).not.toBeInstanceOf(SnapshotDataIntegrityError)
  })

  it('should err SnapshotReadError on a throttled S3 read', async () => {
    ;(AwsConfig.s3.send as jest.Mock) = jest
      .fn()
      .mockReturnValue(Promise.reject({ code: 'SlowDown', statusCode: 503 }))

    const result = await readV4Snapshot({ ...COORDS, token: 'tok-1' })

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(SnapshotReadError)
  })

  it('should err the SAME SnapshotDataIntegrityError on a malformed stored body', async () => {
    ;(AwsConfig.s3.send as jest.Mock) = jest
      .fn()
      .mockReturnValue(
        Promise.resolve({ Body: Buffer.from('{ not valid json') }),
      )

    const result = await readV4Snapshot({ ...COORDS, token: 'tok-1' })

    expect(result.isErr()).toBe(true)
    const error = result._unsafeUnwrapErr()
    expect(error).toBeInstanceOf(SnapshotDataIntegrityError)
  })

  it('should err SnapshotDataIntegrityError on an unknown _v in the stored body', async () => {
    const bad = { ...makeSnapshot(), _v: 2 }
    ;(AwsConfig.s3.send as jest.Mock) = jest
      .fn()
      .mockReturnValue(
        Promise.resolve({ Body: Buffer.from(JSON.stringify(bad)) }),
      )

    const result = await readV4Snapshot({ ...COORDS, token: 'tok-1' })

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(SnapshotDataIntegrityError)
  })
})
