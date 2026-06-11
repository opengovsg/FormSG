import mockAxios from 'jest-mock-axios'
import { encodeBase64 } from 'tweetnacl-util'

import Crypto from '../src/crypto'
import CryptoV3 from '../src/crypto-v3'
import { SIGNING_KEYS } from '../src/resource/signing-keys'
import { FieldResponsesV4 } from '../src/types-v4'

jest.mock('axios', () => mockAxios)

const signingPublicKey = SIGNING_KEYS.test.publicKey

const MRF_TEST_VERSION = 3
const ATTACHMENT_FIELD_ID = '650abc0000000000000000fa'
const TEXT_FIELD_ID = '650abc0000000000000000aa'
const DOWNLOAD_URL = 'https://some.s3.url/some/encrypted/file'

const testFileBuffer = new Uint8Array(Buffer.from('some file contents'))

const v4ResponsesWithAttachment: FieldResponsesV4 = {
  [TEXT_FIELD_ID]: {
    fieldType: 'textfield',
    question: 'What is your name?',
    answer: { value: 'TAN AH KOW' },
    provenance: { stepNumber: 1 },
  },
  [ATTACHMENT_FIELD_ID]: {
    fieldType: 'attachment',
    question: 'Upload a file',
    answer: { value: 'my-random-file.txt', hasBeenScanned: false },
    provenance: { stepNumber: 1 },
  },
}

describe('Crypto (envelope-aware attachment decryption)', () => {
  afterEach(() => mockAxios.reset())

  const crypto = new Crypto({ signingPublicKey })
  const cryptoV3 = new CryptoV3({ signingPublicKey })

  // Encrypts a V4 submission and a file the way MRF does: both to the
  // per-submission keypair.
  const encryptV4WithFile = async (
    responses: FieldResponsesV4,
    formPublicKey: string,
    fileBuffer: Uint8Array
  ) => {
    const enc = cryptoV3.encrypt(responses, formPublicKey)
    const encryptedFile = await crypto.encryptFile(
      fileBuffer,
      enc.submissionPublicKey
    )
    return {
      enc,
      uploadedFile: {
        submissionPublicKey: encryptedFile.submissionPublicKey,
        nonce: encryptedFile.nonce,
        binary: encodeBase64(encryptedFile.binary),
      },
    }
  }

  it('decryptWithAttachments returns decrypted files and adapted V1 content for an MRF V4 payload', async () => {
    const { publicKey, secretKey } = crypto.generate()
    const { enc, uploadedFile } = await encryptV4WithFile(
      v4ResponsesWithAttachment,
      publicKey,
      testFileBuffer
    )

    const resultPromise = crypto.decryptWithAttachments(secretKey, {
      encryptedContent: enc.encryptedContent,
      encryptedSubmissionSecretKey: enc.encryptedSubmissionSecretKey,
      attachmentDownloadUrls: { [ATTACHMENT_FIELD_ID]: DOWNLOAD_URL },
      version: MRF_TEST_VERSION,
    })
    mockAxios.mockResponse({ data: { encryptedFile: uploadedFile } })
    const result = await resultPromise

    expect(mockAxios.get).toHaveBeenCalledWith(DOWNLOAD_URL, {
      responseType: 'json',
    })
    expect(result).toEqual({
      content: {
        responses: [
          {
            _id: TEXT_FIELD_ID,
            question: 'What is your name?',
            fieldType: 'textfield',
            answer: 'TAN AH KOW',
          },
          {
            _id: ATTACHMENT_FIELD_ID,
            question: 'Upload a file',
            fieldType: 'attachment',
            answer: 'my-random-file.txt',
          },
        ],
      },
      attachments: {
        [ATTACHMENT_FIELD_ID]: {
          filename: 'my-random-file.txt',
          content: testFileBuffer,
        },
      },
    })
  })

  it('decryptWithAttachmentsVersioned returns native V4 content (not double-adapted) plus attachments', async () => {
    const { publicKey, secretKey } = crypto.generate()
    const { enc, uploadedFile } = await encryptV4WithFile(
      v4ResponsesWithAttachment,
      publicKey,
      testFileBuffer
    )

    const resultPromise = crypto.decryptWithAttachmentsVersioned(secretKey, {
      encryptedContent: enc.encryptedContent,
      encryptedSubmissionSecretKey: enc.encryptedSubmissionSecretKey,
      attachmentDownloadUrls: { [ATTACHMENT_FIELD_ID]: DOWNLOAD_URL },
      version: MRF_TEST_VERSION,
    })
    mockAxios.mockResponse({ data: { encryptedFile: uploadedFile } })
    const result = await resultPromise

    expect(result).toEqual({
      content: {
        submissionSecretKey: enc.submissionSecretKey,
        responses: v4ResponsesWithAttachment,
      },
      attachments: {
        [ATTACHMENT_FIELD_ID]: {
          filename: 'my-random-file.txt',
          content: testFileBuffer,
        },
      },
    })
    // The attachment response keeps its structured V4 answer.
    const responses = result!.content.responses as FieldResponsesV4
    expect(responses[ATTACHMENT_FIELD_ID].answer).toEqual({
      value: 'my-random-file.txt',
      hasBeenScanned: false,
    })
  })

  it('decryptWithAttachmentsVersioned returns the V1 arm plus attachments for a storage-mode payload', async () => {
    const { publicKey, secretKey } = crypto.generate()
    const v1Plaintext = [
      {
        _id: ATTACHMENT_FIELD_ID,
        question: 'Upload a file',
        fieldType: 'attachment',
        answer: 'my-random-file.txt',
      },
    ]
    const encryptedContent = crypto.encrypt(v1Plaintext, publicKey)
    // Storage-mode files are encrypted with the form keypair.
    const encryptedFile = await crypto.encryptFile(testFileBuffer, publicKey)
    const uploadedFile = {
      submissionPublicKey: encryptedFile.submissionPublicKey,
      nonce: encryptedFile.nonce,
      binary: encodeBase64(encryptedFile.binary),
    }

    const resultPromise = crypto.decryptWithAttachmentsVersioned(secretKey, {
      encryptedContent,
      attachmentDownloadUrls: { [ATTACHMENT_FIELD_ID]: DOWNLOAD_URL },
      version: 1,
    })
    mockAxios.mockResponse({ data: { encryptedFile: uploadedFile } })
    const result = await resultPromise

    expect(result).toEqual({
      content: { responses: v1Plaintext },
      attachments: {
        [ATTACHMENT_FIELD_ID]: {
          filename: 'my-random-file.txt',
          content: testFileBuffer,
        },
      },
    })
    expect(result!.content).not.toHaveProperty('submissionSecretKey')
  })

  it('returns null when a V4 attachment file was encrypted with the form key instead of the submission key', async () => {
    const { publicKey, secretKey } = crypto.generate()
    const enc = cryptoV3.encrypt(v4ResponsesWithAttachment, publicKey)
    // Wrongly encrypt the file to the form keypair; the submission secret key
    // cannot open it.
    const encryptedFile = await crypto.encryptFile(testFileBuffer, publicKey)
    const uploadedFile = {
      submissionPublicKey: encryptedFile.submissionPublicKey,
      nonce: encryptedFile.nonce,
      binary: encodeBase64(encryptedFile.binary),
    }

    const resultPromise = crypto.decryptWithAttachments(secretKey, {
      encryptedContent: enc.encryptedContent,
      encryptedSubmissionSecretKey: enc.encryptedSubmissionSecretKey,
      attachmentDownloadUrls: { [ATTACHMENT_FIELD_ID]: DOWNLOAD_URL },
      version: MRF_TEST_VERSION,
    })
    mockAxios.mockResponse({ data: { encryptedFile: uploadedFile } })

    expect(await resultPromise).toBeNull()
  })

  it('preserves binary integrity for non-UTF-8 file contents', async () => {
    const { publicKey, secretKey } = crypto.generate()
    const binaryFixture = new Uint8Array([0, 255, 1, 254, 0x80, 0xc3, 0x28, 7])
    const { enc, uploadedFile } = await encryptV4WithFile(
      v4ResponsesWithAttachment,
      publicKey,
      binaryFixture
    )

    const resultPromise = crypto.decryptWithAttachments(secretKey, {
      encryptedContent: enc.encryptedContent,
      encryptedSubmissionSecretKey: enc.encryptedSubmissionSecretKey,
      attachmentDownloadUrls: { [ATTACHMENT_FIELD_ID]: DOWNLOAD_URL },
      version: MRF_TEST_VERSION,
    })
    mockAxios.mockResponse({ data: { encryptedFile: uploadedFile } })
    const result = await resultPromise

    expect(result!.attachments[ATTACHMENT_FIELD_ID].content).toEqual(
      binaryFixture
    )
  })

  it('decrypts multiple attachments mixed with non-attachment fields, keyed by field _id', async () => {
    const { publicKey, secretKey } = crypto.generate()
    const secondAttachmentId = '650abc0000000000000000fb'
    const responses: FieldResponsesV4 = {
      ...v4ResponsesWithAttachment,
      [secondAttachmentId]: {
        fieldType: 'attachment',
        question: 'Upload another file',
        answer: { value: 'second-file.bin', hasBeenScanned: true },
        provenance: { stepNumber: 2 },
      },
    }
    const firstBuffer = new Uint8Array(Buffer.from('first file'))
    const secondBuffer = new Uint8Array(Buffer.from('second file'))
    const enc = cryptoV3.encrypt(responses, publicKey)
    const uploads = await Promise.all(
      [firstBuffer, secondBuffer].map(async (buffer) => {
        const encryptedFile = await crypto.encryptFile(
          buffer,
          enc.submissionPublicKey
        )
        return {
          submissionPublicKey: encryptedFile.submissionPublicKey,
          nonce: encryptedFile.nonce,
          binary: encodeBase64(encryptedFile.binary),
        }
      })
    )
    const secondUrl = 'https://some.s3.url/another/encrypted/file'

    const resultPromise = crypto.decryptWithAttachments(secretKey, {
      encryptedContent: enc.encryptedContent,
      encryptedSubmissionSecretKey: enc.encryptedSubmissionSecretKey,
      attachmentDownloadUrls: {
        [ATTACHMENT_FIELD_ID]: DOWNLOAD_URL,
        [secondAttachmentId]: secondUrl,
      },
      version: MRF_TEST_VERSION,
    })
    // Respond per requested URL so files land on the right field ids.
    const requested = mockAxios.queue().map((req: any) => req.url)
    requested.forEach((url: string) => {
      mockAxios.mockResponseFor(
        { url },
        { data: { encryptedFile: uploads[url === DOWNLOAD_URL ? 0 : 1] } }
      )
    })
    const result = await resultPromise

    expect(result!.attachments).toEqual({
      [ATTACHMENT_FIELD_ID]: {
        filename: 'my-random-file.txt',
        content: firstBuffer,
      },
      [secondAttachmentId]: {
        filename: 'second-file.bin',
        content: secondBuffer,
      },
    })
    expect(
      result!.content.responses.map((r) => r._id).sort()
    ).toEqual(
      [TEXT_FIELD_ID, ATTACHMENT_FIELD_ID, secondAttachmentId].sort()
    )
  })

  it('succeeds with empty attachments for a V4 payload with zero attachments', async () => {
    const { publicKey, secretKey } = crypto.generate()
    const responses: FieldResponsesV4 = {
      [TEXT_FIELD_ID]: v4ResponsesWithAttachment[TEXT_FIELD_ID],
    }
    const enc = cryptoV3.encrypt(responses, publicKey)

    const result = await crypto.decryptWithAttachments(secretKey, {
      encryptedContent: enc.encryptedContent,
      encryptedSubmissionSecretKey: enc.encryptedSubmissionSecretKey,
      version: MRF_TEST_VERSION,
    })

    expect(result!.attachments).toEqual({})
    expect(result!.content.responses).toHaveLength(1)
  })

  it('returns null when a download URL targets a field _id not present in the responses', async () => {
    const { publicKey, secretKey } = crypto.generate()
    const enc = cryptoV3.encrypt(v4ResponsesWithAttachment, publicKey)

    const result = await crypto.decryptWithAttachments(secretKey, {
      encryptedContent: enc.encryptedContent,
      encryptedSubmissionSecretKey: enc.encryptedSubmissionSecretKey,
      attachmentDownloadUrls: { '000000000000000000000000': DOWNLOAD_URL },
      version: MRF_TEST_VERSION,
    })

    expect(result).toBeNull()
  })

  it('skips downloading an attachment response that has no corresponding download URL', async () => {
    const { publicKey, secretKey } = crypto.generate()
    const enc = cryptoV3.encrypt(v4ResponsesWithAttachment, publicKey)

    const result = await crypto.decryptWithAttachments(secretKey, {
      encryptedContent: enc.encryptedContent,
      encryptedSubmissionSecretKey: enc.encryptedSubmissionSecretKey,
      version: MRF_TEST_VERSION,
    })

    expect(mockAxios.get).not.toHaveBeenCalled()
    expect(result!.attachments).toEqual({})
    // The attachment response itself still appears in the content.
    expect(
      result!.content.responses.find((r) => r._id === ATTACHMENT_FIELD_ID)
    ).toMatchObject({ answer: 'my-random-file.txt' })
  })

  describe('failure semantics on the V4 path', () => {
    it('returns null on HTTP download failure', async () => {
      const { publicKey, secretKey } = crypto.generate()
      const { enc } = await encryptV4WithFile(
        v4ResponsesWithAttachment,
        publicKey,
        testFileBuffer
      )

      const resultPromise = crypto.decryptWithAttachments(secretKey, {
        encryptedContent: enc.encryptedContent,
        encryptedSubmissionSecretKey: enc.encryptedSubmissionSecretKey,
        attachmentDownloadUrls: { [ATTACHMENT_FIELD_ID]: DOWNLOAD_URL },
        version: MRF_TEST_VERSION,
      })
      mockAxios.mockError(new Error('Network Error'))

      expect(await resultPromise).toBeNull()
    })

    it('returns null on a non-2xx download response', async () => {
      const { publicKey, secretKey } = crypto.generate()
      const { enc } = await encryptV4WithFile(
        v4ResponsesWithAttachment,
        publicKey,
        testFileBuffer
      )

      const resultPromise = crypto.decryptWithAttachments(secretKey, {
        encryptedContent: enc.encryptedContent,
        encryptedSubmissionSecretKey: enc.encryptedSubmissionSecretKey,
        attachmentDownloadUrls: { [ATTACHMENT_FIELD_ID]: DOWNLOAD_URL },
        version: MRF_TEST_VERSION,
      })
      mockAxios.mockResponse({
        data: {},
        status: 404,
        statusText: 'Not Found',
      })

      expect(await resultPromise).toBeNull()
    })

    it('returns null on corrupt attachment ciphertext', async () => {
      const { publicKey, secretKey } = crypto.generate()
      const { enc, uploadedFile } = await encryptV4WithFile(
        v4ResponsesWithAttachment,
        publicKey,
        testFileBuffer
      )

      const resultPromise = crypto.decryptWithAttachments(secretKey, {
        encryptedContent: enc.encryptedContent,
        encryptedSubmissionSecretKey: enc.encryptedSubmissionSecretKey,
        attachmentDownloadUrls: { [ATTACHMENT_FIELD_ID]: DOWNLOAD_URL },
        version: MRF_TEST_VERSION,
      })
      mockAxios.mockResponse({
        data: {
          encryptedFile: {
            ...uploadedFile,
            binary: 'YmFkZW5jcnlwdGVkY29udGVudHM=',
          },
        },
      })

      expect(await resultPromise).toBeNull()
    })

    it('returns null for the V4 attachment path without encryptedSubmissionSecretKey', async () => {
      const { publicKey, secretKey } = crypto.generate()
      const { enc } = await encryptV4WithFile(
        v4ResponsesWithAttachment,
        publicKey,
        testFileBuffer
      )

      const result = await crypto.decryptWithAttachments(secretKey, {
        encryptedContent: enc.encryptedContent,
        attachmentDownloadUrls: { [ATTACHMENT_FIELD_ID]: DOWNLOAD_URL },
        version: MRF_TEST_VERSION,
      })

      expect(result).toBeNull()
    })
  })
})
