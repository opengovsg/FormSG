import mockAxios from 'jest-mock-axios'

import formsg from '../src'

jest.mock('axios', () => mockAxios)

const { cryptoV3 } = formsg({ mode: 'test' })
const responses = {
  attachment: {
    fieldType: 'attachment',
    question: 'Evidence',
    answer: { value: 'evidence.txt', hasBeenScanned: true },
    provenance: { stepNumber: 0 },
  },
}

afterEach(() => mockAxios.reset())

it('decrypts V4 content and attachments using the wrapped submission key', async () => {
  const keys = cryptoV3.generate()
  const encrypted = cryptoV3.encrypt(responses, keys.publicKey)
  const bytes = new Uint8Array([104, 101, 108, 108, 111])
  const file = await cryptoV3.encryptFile(bytes, encrypted.submissionPublicKey)
  const result = cryptoV3.decryptWithAttachments(keys.secretKey, {
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
  await expect(result).resolves.toMatchObject({
    content: { responses },
    attachments: { attachment: { filename: 'evidence.txt', content: bytes } },
  })
})

it.each(['wrong key', 'unknown field', 'download failure', 'corrupt file'])(
  'matches V1 result shape and failure behavior: %s',
  async (scenario) => {
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
      [scenario === 'unknown field' ? 'unknown' : 'attachment']:
        'https://files.example/evidence',
    }
    const secretKey =
      scenario === 'wrong key' ? crypto.generate().secretKey : keys.secretKey
    const legacy = crypto.decryptWithAttachments(secretKey, {
      encryptedContent: v1,
      version: 1,
      attachmentDownloadUrls,
    })
    const native = cryptoV3.decryptWithAttachments(secretKey, {
      ...v4,
      version: 4,
      attachmentDownloadUrls,
    })
    if (scenario === 'download failure') {
      mockAxios.mockError(new Error('unavailable'))
      mockAxios.mockError(new Error('unavailable'))
    }
    if (scenario === 'corrupt file') {
      mockAxios.mockResponse({ data: {} })
      mockAxios.mockResponse({ data: {} })
    }
    const [legacyResult, nativeResult] = await Promise.all([legacy, native])
    expect(legacyResult).toBeNull()
    expect(nativeResult).toBeNull()
  }
)

it('returns the V1 result shape with an empty attachment map when URLs are omitted', async () => {
  const keys = cryptoV3.generate()
  const encrypted = cryptoV3.encrypt(responses, keys.publicKey)
  const result = await cryptoV3.decryptWithAttachments(keys.secretKey, {
    ...encrypted,
    version: 4,
  })
  expect(Object.keys(result!).sort()).toEqual(['attachments', 'content'])
  expect(result!.attachments).toEqual({})
  expect(result!.content.responses).toEqual(responses)
})

it('returns null for an attachment URL without a usable filename, like V1', async () => {
  const keys = cryptoV3.generate()
  const encrypted = cryptoV3.encrypt(
    { attachment: { ...responses.attachment, answer: null } },
    keys.publicKey
  )
  await expect(
    cryptoV3.decryptWithAttachments(keys.secretKey, {
      ...encrypted,
      version: 4,
      attachmentDownloadUrls: { attachment: 'https://files.example/evidence' },
    })
  ).resolves.toBeNull()
})
