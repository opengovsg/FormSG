import mockAxios from 'jest-mock-axios'

import formsg, { FieldResponsesV4 } from '../src'
import Crypto from '../src/crypto'
import CryptoV4 from '../src/crypto-v4'
import { MissingPublicKeyError } from '../src/errors'
import { SIGNING_KEYS } from '../src/resource/signing-keys'

jest.mock('axios', () => mockAxios)

const { cryptoV3, cryptoV4 } = formsg({ mode: 'test' })
const responses: FieldResponsesV4 = {
  attachment: {
    fieldType: 'attachment',
    question: 'Evidence',
    answer: { value: 'evidence.txt', hasBeenScanned: true },
    provenance: { stepNumber: 0 },
  },
}

afterEach(() => mockAxios.reset())

const encryptedDownload = async (bytes: Uint8Array, publicKey: string) => {
  const file = await cryptoV4.encryptFile(bytes, publicKey)
  return {
    data: {
      encryptedFile: {
        ...file,
        binary: Buffer.from(file.binary).toString('base64'),
      },
    },
  }
}

it('returns null when a V4 webhook attachment belongs to another submission', async () => {
  // Prepare: encrypt the attachment with a different submission public key.
  const keys = cryptoV4.generate()
  const encrypted = cryptoV4.encrypt(responses, keys.publicKey)
  const otherSubmission = cryptoV4.encrypt(responses, keys.publicKey)
  const download = await encryptedDownload(
    new Uint8Array([1, 2, 3]),
    otherSubmission.submissionPublicKey
  )

  // Act: decrypt the V4 webhook and complete the attachment downloads.
  const result = cryptoV4.decryptWithAttachments(keys.secretKey, {
    ...encrypted,
    version: 4,
    attachmentDownloadUrls: { attachment: 'https://files.example/evidence' },
  })
  mockAxios.mockResponseFor('https://files.example/evidence', download)

  // Assert: attachment decryption failure returns null for the whole webhook.
  await expect(result).resolves.toBeNull()
})

it('returns null for the V4 webhook when any attachment cannot be decrypted', async () => {
  // Prepare: one attachment uses the submission key and the other uses an unrelated key.
  const keys = cryptoV4.generate()
  const encrypted = cryptoV4.encrypt(
    {
      ...responses,
      other: {
        ...responses.attachment,
        answer: { value: 'other.txt', hasBeenScanned: true },
      },
    },
    keys.publicKey
  )
  const successfulDownload = await encryptedDownload(
    new Uint8Array([1, 2, 3]),
    encrypted.submissionPublicKey
  )
  const failedDownload = await encryptedDownload(
    new Uint8Array([4, 5, 6]),
    cryptoV4.generate().publicKey
  )

  // Act: decrypt the V4 webhook and complete the attachment downloads.
  const result = cryptoV4.decryptWithAttachments(keys.secretKey, {
    ...encrypted,
    version: 4,
    attachmentDownloadUrls: {
      attachment: 'https://files.example/evidence',
      other: 'https://files.example/other',
    },
  })
  mockAxios.mockResponseFor(
    'https://files.example/evidence',
    successfulDownload
  )
  mockAxios.mockResponseFor('https://files.example/other', failedDownload)

  // Assert: attachment decryption failure returns null for the whole webhook.
  await expect(result).resolves.toBeNull()
})

it('rejects V4 webhook decryption when verified content has no configured signing public key', async () => {
  // Prepare: signed verified content and an SDK instance without a signing public key.
  const crypto = new CryptoV4()
  const keys = crypto.generate()
  const encrypted = crypto.encrypt(responses, keys.publicKey)
  const verifiedContent = new Crypto().encrypt(
    { uinFin: 'S1234567A' },
    encrypted.submissionPublicKey,
    SIGNING_KEYS.test.secretKey
  )

  // Act: decrypt the V4 webhook containing signed verified content.
  const result = crypto.decryptWithAttachments(keys.secretKey, {
    ...encrypted,
    version: 4,
    verifiedContent,
  })

  // Assert: missing signing configuration rejects instead of returning null.
  await expect(result).rejects.toThrow(MissingPublicKeyError)
})

it('returns V4 webhook attachments with their field IDs, filenames and file contents', async () => {
  // Prepare: two attachment responses with distinct filenames and file contents.
  const keys = cryptoV4.generate()
  const encrypted = cryptoV4.encrypt(
    {
      ...responses,
      other: {
        ...responses.attachment,
        answer: { value: 'other.txt', hasBeenScanned: true },
      },
    },
    keys.publicKey
  )
  const evidenceBytes = new Uint8Array([1, 2, 3])
  const otherBytes = new Uint8Array([4, 5, 6])
  const evidenceDownload = await encryptedDownload(
    evidenceBytes,
    encrypted.submissionPublicKey
  )
  const otherDownload = await encryptedDownload(
    otherBytes,
    encrypted.submissionPublicKey
  )

  // Act: decrypt the V4 webhook and complete the attachment downloads.
  const result = cryptoV4.decryptWithAttachments(keys.secretKey, {
    ...encrypted,
    version: 4,
    attachmentDownloadUrls: {
      attachment: 'https://files.example/evidence',
      other: 'https://files.example/other',
    },
  })
  mockAxios.mockResponseFor('https://files.example/other', otherDownload)
  mockAxios.mockResponseFor('https://files.example/evidence', evidenceDownload)

  // Assert: reversed download completion preserves each field's filename and file contents.
  expect((await result)?.attachments).toEqual({
    attachment: { filename: 'evidence.txt', content: evidenceBytes },
    other: { filename: 'other.txt', content: otherBytes },
  })
})

it('decrypts V4 webhook responses and attachments with the form secret key', async () => {
  // Prepare: responses and an attachment encrypted with the same submission key.
  const keys = cryptoV3.generate()
  const encrypted = cryptoV3.encrypt(responses, keys.publicKey)
  const bytes = new Uint8Array([104, 101, 108, 108, 111])
  const file = await cryptoV3.encryptFile(bytes, encrypted.submissionPublicKey)

  // Act: decrypt the V4 webhook and complete the attachment downloads.
  const result = cryptoV4.decryptWithAttachments(keys.secretKey, {
    ...encrypted,
    version: 4,
    attachmentDownloadUrls: { attachment: 'https://files.example/evidence' },
  })
  mockAxios.mockResponse({
    data: {
      encryptedFile: {
        ...file,
        binary: Buffer.from(file.binary).toString('base64'),
      },
    },
  })
  // Assert: recover the submitted responses, filename and original file contents.
  await expect(result).resolves.toMatchObject({
    content: { responses },
    attachments: { attachment: { filename: 'evidence.txt', content: bytes } },
  })
})

it.each([
  'incorrect form secret key',
  'unknown attachment field ID',
  'attachment download failure',
  'malformed attachment envelope',
])(
  'returns null for both Legacy (V1) and V4 webhooks on %s',
  async (scenario) => {
    // Prepare: equivalent Legacy (V1) and V4 webhooks with the same failure condition.
    const { crypto } = formsg({ mode: 'test' })
    const keys = crypto.generate()
    const v4 = cryptoV3.encrypt(responses, keys.publicKey)
    const v1 = crypto.encrypt(
      [
        {
          _id: 'attachment',
          fieldType: 'attachment',
          question: 'Evidence',
          answer: 'evidence.txt',
        },
      ],
      keys.publicKey
    )
    const attachmentDownloadUrls = {
      [scenario === 'unknown attachment field ID' ? 'unknown' : 'attachment']:
        'https://files.example/evidence',
    }
    const secretKey =
      scenario === 'incorrect form secret key'
        ? crypto.generate().secretKey
        : keys.secretKey

    // Act: decrypt both webhook formats and complete any failed downloads.
    const legacy = crypto.decryptWithAttachments(secretKey, {
      encryptedContent: v1,
      version: 1,
      attachmentDownloadUrls,
    })
    const native = cryptoV4.decryptWithAttachments(secretKey, {
      ...v4,
      version: 4,
      attachmentDownloadUrls,
    })
    if (scenario === 'attachment download failure') {
      mockAxios.mockError(new Error('unavailable'))
      mockAxios.mockError(new Error('unavailable'))
    }
    if (scenario === 'malformed attachment envelope') {
      mockAxios.mockResponse({ data: {} })
      mockAxios.mockResponse({ data: {} })
    }
    const [legacyResult, nativeResult] = await Promise.all([legacy, native])

    // Assert: both webhook formats return null under the same failure condition.
    expect(legacyResult).toBeNull()
    expect(nativeResult).toBeNull()
  }
)

it('returns V4 webhook responses with no attachments when download URLs are omitted', async () => {
  // Prepare: an attachment response without any attachment download URLs.
  const keys = cryptoV3.generate()
  const encrypted = cryptoV3.encrypt(responses, keys.publicKey)

  // Act: decrypt the V4 webhook without requesting attachment downloads.
  const result = await cryptoV4.decryptWithAttachments(keys.secretKey, {
    ...encrypted,
    version: 4,
  })

  // Assert: retain the content-and-attachments result shape with responses and an empty attachment map.
  expect(Object.keys(result!).sort()).toEqual(['attachments', 'content'])
  expect(result!.attachments).toEqual({})
  expect(result!.content.responses).toEqual(responses)
})

it('returns null when a V4 webhook attachment response has no filename', async () => {
  // Prepare: a download URL whose attachment response has a null answer.
  const keys = cryptoV3.generate()
  const encrypted = cryptoV3.encrypt(
    { attachment: { ...responses.attachment, answer: null } },
    keys.publicKey
  )

  // Act: decrypt the V4 webhook with the attachment download URL.
  const result = cryptoV4.decryptWithAttachments(keys.secretKey, {
    ...encrypted,
    version: 4,
    attachmentDownloadUrls: { attachment: 'https://files.example/evidence' },
  })

  // Assert: an attachment without a filename makes the whole result null.
  await expect(result).resolves.toBeNull()
})
