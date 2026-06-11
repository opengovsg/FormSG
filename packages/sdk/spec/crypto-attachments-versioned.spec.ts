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
})
