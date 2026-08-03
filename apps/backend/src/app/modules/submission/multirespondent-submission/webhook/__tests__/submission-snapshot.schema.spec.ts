import { SnapshotDataIntegrityError } from '../submission-snapshot.errors'
import { buildV4Snapshot } from '../submission-snapshot.producer'
import { parseSnapshot } from '../submission-snapshot.schema'

const makeValidV4 = () =>
  buildV4Snapshot({
    formId: 'form-123',
    submissionId: 'sub-456',
    submissionIndex: 2,
    workflowStep: 1,
    encryptedContent: 'encrypted-content-blob',
    encryptedSubmissionSecretKey: 'wrapped-read-key',
    createdAt: '2026-07-22T00:00:00.000Z',
  })

describe('parseSnapshot', () => {
  it('should round-trip a valid v4 snapshot from its JSON string', () => {
    // Arrange
    const snapshot = makeValidV4()

    // Act
    const result = parseSnapshot(JSON.stringify(snapshot))

    // Assert
    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap()).toEqual(snapshot)
  })

  describe('fail-loud failure modes', () => {
    it('should return a SnapshotDataIntegrityError on malformed JSON', () => {
      const result = parseSnapshot('{ not valid json')
      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        SnapshotDataIntegrityError,
      )
    })

    it('should return a SnapshotDataIntegrityError on an unknown _v', () => {
      const bad = { ...makeValidV4(), _v: 2 }
      const result = parseSnapshot(JSON.stringify(bad))
      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        SnapshotDataIntegrityError,
      )
    })

    it('should return a SnapshotDataIntegrityError on a missing required field', () => {
      const bad: Record<string, unknown> = { ...makeValidV4() }
      delete bad.encryptedContent
      const result = parseSnapshot(JSON.stringify(bad))
      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        SnapshotDataIntegrityError,
      )
    })

    it('should return an error on an unknown contentFormat discriminant', () => {
      const bad = { ...makeValidV4(), contentFormat: 'v99' }
      const result = parseSnapshot(JSON.stringify(bad))
      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        SnapshotDataIntegrityError,
      )
    })
  })
})
