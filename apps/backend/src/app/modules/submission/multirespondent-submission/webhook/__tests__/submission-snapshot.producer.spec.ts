import formsgSdk from '../../../../../config/formsg-sdk'
import {
  buildV1Snapshot,
  buildV4Snapshot,
} from '../submission-snapshot.producer'
import { SubmissionSnapshot } from '../submission-snapshot.schema'

// Submission-key payload the middleware hands to cryptoV3.encrypt: a
// FormFieldsV3 record keyed by field id (what decryptFromSubmissionKey returns
// under `responses`).
const PLAINTEXT = {
  'field-1': { fieldType: 'textfield', answer: 'hello world' },
}
const VERSION = 1

describe('buildV4Snapshot', () => {
  it('should build a snapshot that satisfies the SubmissionSnapshot schema', () => {
    const { publicKey } = formsgSdk.cryptoV3.generate()
    const { encryptedContent, encryptedSubmissionSecretKey } =
      formsgSdk.cryptoV3.encrypt(PLAINTEXT, publicKey)

    const snapshot = buildV4Snapshot({
      formId: 'form-1',
      submissionId: 'sub-1',
      submissionIndex: 0,
      workflowStep: 1,
      encryptedContent,
      encryptedSubmissionSecretKey,
      createdAt: '2026-07-22T00:00:00.000Z',
    })

    // Should not throw — the produced object is valid.
    expect(() => SubmissionSnapshot.parse(snapshot)).not.toThrow()
    expect(snapshot._v).toBe(1)
    expect(snapshot.contentFormat).toBe('v4')
  })

  it('should freeze content + wrapped key so the plaintext round-trips (recovers)', () => {
    // Arrange: encrypt with a form keypair, exactly as the middleware does.
    const { publicKey } = formsgSdk.cryptoV3.generate()
    const {
      encryptedContent,
      encryptedSubmissionSecretKey,
      submissionSecretKey,
    } = formsgSdk.cryptoV3.encrypt(PLAINTEXT, publicKey)

    // Act
    const snapshot = buildV4Snapshot({
      formId: 'form-1',
      submissionId: 'sub-1',
      submissionIndex: 3,
      workflowStep: 2,
      encryptedContent,
      encryptedSubmissionSecretKey,
      createdAt: '2026-07-22T00:00:00.000Z',
    })

    // Assert: the wrapped key is frozen verbatim
    expect(snapshot.encryptedSubmissionSecretKey).toBe(
      encryptedSubmissionSecretKey,
    )
    // Assert: the frozen encryptedContent still decrypts to the ORIGINAL
    // plaintext using the submission secret key (round-trip recovery, not
    // byte-equality — the nonce is random per-encrypt).
    const recovered = formsgSdk.cryptoV3.decryptFromSubmissionKey(
      submissionSecretKey,
      { encryptedContent: snapshot.encryptedContent, version: VERSION },
    )
    expect(recovered).not.toBeNull()
    expect(recovered?.responses).toEqual(PLAINTEXT)
  })

  it('should freeze verifiedContent VERBATIM when the step has verified fields', () => {
    const { publicKey } = formsgSdk.cryptoV3.generate()
    const { encryptedContent, encryptedSubmissionSecretKey } =
      formsgSdk.cryptoV3.encrypt(PLAINTEXT, publicKey)
    const verifiedContent = 'native-submission-key-verified-blob'

    const snapshot = buildV4Snapshot({
      formId: 'form-1',
      submissionId: 'sub-1',
      submissionIndex: 0,
      workflowStep: 1,
      encryptedContent,
      encryptedSubmissionSecretKey,
      verifiedContent,
      createdAt: '2026-07-22T00:00:00.000Z',
    })

    expect(snapshot.verifiedContent).toBe(verifiedContent)
    expect(() => SubmissionSnapshot.parse(snapshot)).not.toThrow()
  })

  it('should omit verifiedContent when the step has no verified fields', () => {
    const { publicKey } = formsgSdk.cryptoV3.generate()
    const { encryptedContent, encryptedSubmissionSecretKey } =
      formsgSdk.cryptoV3.encrypt(PLAINTEXT, publicKey)

    const snapshot = buildV4Snapshot({
      formId: 'form-1',
      submissionId: 'sub-1',
      submissionIndex: 0,
      workflowStep: 1,
      encryptedContent,
      encryptedSubmissionSecretKey,
      createdAt: '2026-07-22T00:00:00.000Z',
    })

    expect(snapshot.verifiedContent).toBeUndefined()
  })

  it('should pass attachmentMetadata through verbatim when provided', () => {
    const { publicKey } = formsgSdk.cryptoV3.generate()
    const { encryptedContent, encryptedSubmissionSecretKey } =
      formsgSdk.cryptoV3.encrypt(PLAINTEXT, publicKey)
    const attachmentMetadata = { 'field-9': 'attachment-key-abc' }

    const snapshot = buildV4Snapshot({
      formId: 'form-1',
      submissionId: 'sub-1',
      submissionIndex: 0,
      workflowStep: 1,
      encryptedContent,
      encryptedSubmissionSecretKey,
      attachmentMetadata,
      createdAt: '2026-07-22T00:00:00.000Z',
    })

    expect(snapshot.attachmentMetadata).toEqual(attachmentMetadata)
  })
})

const V1_PLAINTEXT = [
  {
    _id: 'field-1',
    question: 'Your name',
    fieldType: 'textfield',
    answer: 'hello world',
  },
]
const V1_VERSION = 2.1

describe('buildV1Snapshot', () => {
  it('should build a snapshot that satisfies the SubmissionSnapshot schema', () => {
    const { publicKey } = formsgSdk.crypto.generate()

    const snapshot = buildV1Snapshot({
      formId: 'form-1',
      submissionId: 'sub-1',
      submissionIndex: 0,
      workflowStep: 0,
      encryptedContent: formsgSdk.crypto.encrypt(V1_PLAINTEXT, publicKey),
      createdAt: '2026-07-22T00:00:00.000Z',
    })

    expect(() => SubmissionSnapshot.parse(snapshot)).not.toThrow()
    expect(snapshot._v).toBe(1)
    expect(snapshot.contentFormat).toBe('v1')
  })

  it('should freeze content that the FORM secret key alone recovers, with no key stored beside it', () => {
    const { publicKey, secretKey } = formsgSdk.crypto.generate()
    const encryptedContent = formsgSdk.crypto.encrypt(V1_PLAINTEXT, publicKey)

    const snapshot = buildV1Snapshot({
      formId: 'form-1',
      submissionId: 'sub-1',
      submissionIndex: 0,
      workflowStep: 0,
      encryptedContent,
      createdAt: '2026-07-22T00:00:00.000Z',
    })

    const recovered = formsgSdk.crypto.decrypt(secretKey, {
      encryptedContent: snapshot.encryptedContent,
      version: V1_VERSION,
    })
    expect(recovered?.responses).toEqual(V1_PLAINTEXT)

    expect(snapshot).not.toHaveProperty('encryptedSubmissionSecretKey')
  })

  it('should omit verifiedContent and attachmentMetadata when absent, and pass them verbatim when present', () => {
    const { publicKey } = formsgSdk.crypto.generate()
    const encryptedContent = formsgSdk.crypto.encrypt(V1_PLAINTEXT, publicKey)
    const coords = {
      formId: 'form-1',
      submissionId: 'sub-1',
      submissionIndex: 0,
      workflowStep: 0,
      encryptedContent,
      createdAt: '2026-07-22T00:00:00.000Z',
    }

    const bare = buildV1Snapshot(coords)
    expect(bare.verifiedContent).toBeUndefined()
    expect(bare.attachmentMetadata).toBeUndefined()

    const full = buildV1Snapshot({
      ...coords,
      verifiedContent: 'form-key-verified-blob',
      attachmentMetadata: { 'field-9': 'attachment-key-abc' },
    })
    expect(full.verifiedContent).toBe('form-key-verified-blob')
    expect(full.attachmentMetadata).toEqual({ 'field-9': 'attachment-key-abc' })
    expect(() => SubmissionSnapshot.parse(full)).not.toThrow()
  })
})
