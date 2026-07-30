import crypto from 'crypto'

import { aws as AwsConfig } from 'src/app/config/config'

import { buildV4Snapshot } from '../submission-snapshot.producer'
import {
  SNAPSHOT_DATA_INTEGRITY_ERROR_CODE,
  SnapshotDataIntegrityError,
  SubmissionSnapshotV4,
} from '../submission-snapshot.schema'
import {
  buildSnapshotKey,
  readV4Snapshot,
  SnapshotWriteError,
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

// Helper to make a resolved/rejected aws-sdk v2 `.promise()` shape.
const putResolves = () =>
  jest.fn().mockReturnValue({ promise: () => Promise.resolve({}) })
const putRejectsThen = (
  ...outcomes: Array<{ reject?: unknown } | { resolve?: unknown }>
) => {
  const fn = jest.fn()
  outcomes.forEach((o) => {
    if ('reject' in o) {
      fn.mockReturnValueOnce({ promise: () => Promise.reject(o.reject) })
    } else {
      fn.mockReturnValueOnce({
        promise: () => Promise.resolve((o as { resolve?: unknown }).resolve),
      })
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
    ;(AwsConfig.s3.putObject as jest.Mock) = putObject
    mockTokens('tok-1')

    // Act
    const result = await writeV4Snapshot(snapshot)

    // Assert
    expect(result.isOk()).toBe(true)
    expect(putObject).toHaveBeenCalledTimes(1)
    const params = putObject.mock.calls[0][0]
    expect(params.Bucket).toBe(TEST_BUCKET)
    expect(params.Key).toBe(buildSnapshotKey({ ...COORDS, token: 'tok-1' }))
    expect(params.IfNoneMatch).toBe('*')
    expect(params.ContentType).toBe('application/json')
    // Body round-trips through parse back to the input snapshot.
    expect(JSON.parse(params.Body)).toEqual(snapshot)
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
    ;(AwsConfig.s3.putObject as jest.Mock) = putObject
    mockTokens('tok-collide', 'tok-win')

    // Act
    const result = await writeV4Snapshot(snapshot)

    // Assert
    expect(result.isOk()).toBe(true)
    expect(putObject).toHaveBeenCalledTimes(2)
    const firstKey = putObject.mock.calls[0][0].Key
    const secondKey = putObject.mock.calls[1][0].Key
    expect(firstKey).not.toBe(secondKey) // fresh token => distinct key
    expect(firstKey).toBe(buildSnapshotKey({ ...COORDS, token: 'tok-collide' }))
    expect(secondKey).toBe(buildSnapshotKey({ ...COORDS, token: 'tok-win' }))
    // IfNoneMatch on EVERY attempt => the first object's bytes are never clobbered.
    expect(putObject.mock.calls[0][0].IfNoneMatch).toBe('*')
    expect(putObject.mock.calls[1][0].IfNoneMatch).toBe('*')
    expect(result._unsafeUnwrap().token).toBe('tok-win')
  })

  it('should fail loud with SnapshotWriteError on a non-collision rejection (no retry)', async () => {
    const snapshot = makeSnapshot()
    const putObject = putRejectsThen({
      reject: { code: 'AccessDenied', statusCode: 403 },
    })
    ;(AwsConfig.s3.putObject as jest.Mock) = putObject
    mockTokens('tok-1')

    const result = await writeV4Snapshot(snapshot)

    expect(result.isErr()).toBe(true)
    expect(putObject).toHaveBeenCalledTimes(1) // no retry on non-412
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(SnapshotWriteError)
  })

  // @steering-gate: delete after S4 verified & merged
  describe('[STEERING:S4] same-token collision', () => {
    it('should retry with a fresh UUID when the generator repeats a token, land bytes at distinct keys, never overwrite, and stay bounded', async () => {
      const snapshot = makeSnapshot()
      // Second PUT (same key 'dup') 412s; third (fresh) succeeds.
      const putObject = putRejectsThen(
        { reject: { code: 'PreconditionFailed', statusCode: 412 } },
        { reject: { code: 'PreconditionFailed', statusCode: 412 } },
        { resolve: {} },
      )
      ;(AwsConfig.s3.putObject as jest.Mock) = putObject
      // Generator returns the SAME token twice, then a fresh one.
      mockTokens('dup', 'dup', 'fresh')

      const result = await writeV4Snapshot(snapshot)

      expect(result.isOk()).toBe(true)
      // Bounded: did not loop forever; landed on the fresh token.
      expect(putObject).toHaveBeenCalledTimes(3)
      expect(result._unsafeUnwrap().token).toBe('fresh')
      // Winning bytes at a DISTINCT key from the duplicated one.
      const winningKey = putObject.mock.calls[2][0].Key
      expect(winningKey).toBe(buildSnapshotKey({ ...COORDS, token: 'fresh' }))
      expect(winningKey).not.toBe(buildSnapshotKey({ ...COORDS, token: 'dup' }))
      // IfNoneMatch on every attempt => first object never overwritten.
      putObject.mock.calls.forEach((call) =>
        expect(call[0].IfNoneMatch).toBe('*'),
      )
    })

    it('should fail loud when a persistent (non-collision) 412 exceeds the retry bound', async () => {
      const snapshot = makeSnapshot()
      // Persistent 412 on every fresh token — must stop and fail loud.
      const putObject = jest.fn().mockReturnValue({
        promise: () =>
          Promise.reject({ code: 'PreconditionFailed', statusCode: 412 }),
      })
      ;(AwsConfig.s3.putObject as jest.Mock) = putObject
      // Every attempt gets a distinct fresh token (tok-0, tok-1, ...).
      mockTokens()

      const result = await writeV4Snapshot(snapshot)

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(SnapshotWriteError)
      // Bounded: capped at MAX_WRITE_ATTEMPTS (5), not infinite.
      expect(putObject).toHaveBeenCalledTimes(5)
      // Every attempt kept IfNoneMatch — no silent overwrite even at exhaustion.
      putObject.mock.calls.forEach((call) =>
        expect(call[0].IfNoneMatch).toBe('*'),
      )
    })
  })
})

describe('readV4Snapshot', () => {
  it('should use buildSnapshotKey for the getObject Key (single key source)', async () => {
    const snapshot = makeSnapshot()
    const getObject = jest.fn().mockReturnValue({
      promise: () =>
        Promise.resolve({ Body: Buffer.from(JSON.stringify(snapshot)) }),
    })
    ;(AwsConfig.s3.getObject as jest.Mock) = getObject

    await readV4Snapshot({ ...COORDS, token: 'tok-1' })

    const params = getObject.mock.calls[0][0]
    expect(params.Bucket).toBe(TEST_BUCKET)
    expect(params.Key).toBe(buildSnapshotKey({ ...COORDS, token: 'tok-1' }))
  })

  it('should resolve the parsed snapshot on a present read', async () => {
    const snapshot = makeSnapshot()
    ;(AwsConfig.s3.getObject as jest.Mock) = jest.fn().mockReturnValue({
      promise: () =>
        Promise.resolve({ Body: Buffer.from(JSON.stringify(snapshot)) }),
    })

    const result = await readV4Snapshot({ ...COORDS, token: 'tok-1' })

    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap()).toEqual(snapshot)
  })

  it('should err SnapshotDataIntegrityError with NO fallback on a missing object (NoSuchKey/404)', async () => {
    ;(AwsConfig.s3.getObject as jest.Mock) = jest.fn().mockReturnValue({
      promise: () => Promise.reject({ code: 'NoSuchKey', statusCode: 404 }),
    })

    const result = await readV4Snapshot({ ...COORDS, token: 'tok-1' })

    expect(result.isErr()).toBe(true)
    const error = result._unsafeUnwrapErr()
    expect(error).toBeInstanceOf(SnapshotDataIntegrityError)
    expect(error.dataIntegrityCode).toBe(SNAPSHOT_DATA_INTEGRITY_ERROR_CODE)
  })

  it('should err the SAME SnapshotDataIntegrityError on a malformed stored body', async () => {
    ;(AwsConfig.s3.getObject as jest.Mock) = jest.fn().mockReturnValue({
      promise: () => Promise.resolve({ Body: Buffer.from('{ not valid json') }),
    })

    const result = await readV4Snapshot({ ...COORDS, token: 'tok-1' })

    expect(result.isErr()).toBe(true)
    const error = result._unsafeUnwrapErr()
    expect(error).toBeInstanceOf(SnapshotDataIntegrityError)
    expect(error.dataIntegrityCode).toBe(SNAPSHOT_DATA_INTEGRITY_ERROR_CODE)
  })

  it('should err SnapshotDataIntegrityError on an unknown _v in the stored body', async () => {
    const bad = { ...makeSnapshot(), _v: 2 }
    ;(AwsConfig.s3.getObject as jest.Mock) = jest.fn().mockReturnValue({
      promise: () =>
        Promise.resolve({ Body: Buffer.from(JSON.stringify(bad)) }),
    })

    const result = await readV4Snapshot({ ...COORDS, token: 'tok-1' })

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(SnapshotDataIntegrityError)
  })
})

// @steering-gate: delete after S4 verified & merged
describe('[STEERING:S4] single key-builder / single parser', () => {
  // The write and read paths must touch the S3 object ONLY through the one
  // key-builder (buildSnapshotKey) and the one fail-loud parser (parseSnapshot),
  // so the key cannot drift between writer and reader and no bytes ever become a
  // snapshot except through the single validating parse. Architectural steering —
  // the behavioural key/parse assertions above are the permanent replacement.
  it('derives BOTH the write Key and the read Key from the single buildSnapshotKey', async () => {
    const snapshot = makeSnapshot()
    const putObject = putResolves()
    ;(AwsConfig.s3.putObject as jest.Mock) = putObject
    const getObject = jest.fn().mockReturnValue({
      promise: () =>
        Promise.resolve({ Body: Buffer.from(JSON.stringify(snapshot)) }),
    })
    ;(AwsConfig.s3.getObject as jest.Mock) = getObject
    mockTokens('tok-single')

    const written = await writeV4Snapshot(snapshot)
    const token = written._unsafeUnwrap().token
    await readV4Snapshot({ ...COORDS, token })

    const expectedKey = buildSnapshotKey({ ...COORDS, token })
    // Writer and reader agree on exactly the buildSnapshotKey output.
    expect(putObject.mock.calls[0][0].Key).toBe(expectedKey)
    expect(getObject.mock.calls[0][0].Key).toBe(expectedKey)
  })

  it('never yields a snapshot except through the single validating parser', async () => {
    // Any bytes that do not validate surface the SAME data-integrity error,
    // proving there is no alternate, unvalidated bytes->snapshot path on read.
    ;(AwsConfig.s3.getObject as jest.Mock) = jest.fn().mockReturnValue({
      promise: () => Promise.resolve({ Body: Buffer.from('not a snapshot') }),
    })

    const result = await readV4Snapshot({ ...COORDS, token: 'tok-1' })

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(SnapshotDataIntegrityError)
    expect(result._unsafeUnwrapErr().dataIntegrityCode).toBe(
      SNAPSHOT_DATA_INTEGRITY_ERROR_CODE,
    )
  })
})
