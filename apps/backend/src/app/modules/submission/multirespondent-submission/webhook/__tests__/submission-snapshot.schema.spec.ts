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
    const parsed = parseSnapshot(JSON.stringify(snapshot))

    // Assert
    expect(parsed).toEqual(snapshot)
  })

  it('should parse a valid v4 object passed directly (not stringified)', () => {
    const snapshot = makeValidV4()
    expect(parseSnapshot(snapshot)).toEqual(snapshot)
  })

  describe('fail-loud failure modes', () => {
    it('should throw SnapshotDataIntegrityError on malformed JSON', () => {
      expect(() => parseSnapshot('{ not valid json')).toThrow(
        SnapshotDataIntegrityError,
      )
    })

    it('should throw SnapshotDataIntegrityError on an unknown _v', () => {
      const bad = { ...makeValidV4(), _v: 2 }
      expect(() => parseSnapshot(JSON.stringify(bad))).toThrow(
        SnapshotDataIntegrityError,
      )
    })

    it('should throw SnapshotDataIntegrityError on a missing required field', () => {
      const bad: Record<string, unknown> = { ...makeValidV4() }
      delete bad.encryptedContent
      expect(() => parseSnapshot(JSON.stringify(bad))).toThrow(
        SnapshotDataIntegrityError,
      )
    })

    it('should throw on an unknown contentFormat discriminant', () => {
      const bad = { ...makeValidV4(), contentFormat: 'v99' }
      expect(() => parseSnapshot(JSON.stringify(bad))).toThrow(
        SnapshotDataIntegrityError,
      )
    })
  })
})
