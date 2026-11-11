import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AttachmentsDownloadMap, DecryptionCtx } from '../types'

import { downloadAndDecryptAttachmentFiles } from './downloadAndDecryptAttachment'

vi.mock('@datadog/browser-logs', () => ({
  datadogLogs: { logger: { error: vi.fn() } },
}))

const NO_WAIT = [0, 0, 0]

const okResponse = () =>
  new Response(
    JSON.stringify({
      encryptedFile: { binary: 'AAAA', nonce: 'n', submissionPublicKey: 'k' },
    }),
  )
const errorResponse = () => new Response('Forbidden', { status: 403 })

const makeCtx = (decrypted: Uint8Array | null = new Uint8Array([1])) => {
  const decryptFile = vi.fn().mockResolvedValue(decrypted)
  const ctx = {
    formsgSdk: { crypto: { decryptFile } },
  } as unknown as DecryptionCtx
  return { ctx, decryptFile }
}

const attachments = (...urls: string[]): AttachmentsDownloadMap =>
  new Map(urls.map((url, i) => [i + 1, { url, filename: `${url}.pdf` }]))

describe('downloadAndDecryptAttachmentFiles', () => {
  const fetchMock = vi.fn<typeof fetch>()
  beforeEach(() => vi.stubGlobal('fetch', fetchMock))
  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('retries a failed download until it succeeds', async () => {
    fetchMock
      .mockResolvedValueOnce(errorResponse())
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(okResponse())
    const { ctx } = makeCtx()

    const result = await downloadAndDecryptAttachmentFiles(
      ctx,
      attachments('a'),
      'key',
      NO_WAIT,
    )

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(result.files.map(({ filename }) => filename)).toEqual([
      'Question 1 - a.pdf',
    ])
    expect(result.failed).toEqual([])
  })

  it('gives up after one try and three retries, keeping the other files', async () => {
    fetchMock.mockImplementation(async (url) =>
      url === 'bad' ? errorResponse() : okResponse(),
    )
    const { ctx } = makeCtx()

    const result = await downloadAndDecryptAttachmentFiles(
      ctx,
      attachments('bad', 'good'),
      'key',
      NO_WAIT,
    )

    expect(fetchMock.mock.calls.filter(([url]) => url === 'bad')).toHaveLength(
      4,
    )
    expect(result.files.map(({ filename }) => filename)).toEqual([
      'Question 2 - good.pdf',
    ])
    expect(result.failed).toEqual([
      { filename: 'Question 1 - bad.pdf', reason: 'download' },
    ])
  })

  it('does not retry a file that downloads but fails to decrypt', async () => {
    fetchMock.mockImplementation(async () => okResponse())
    const { ctx, decryptFile } = makeCtx(null)

    const result = await downloadAndDecryptAttachmentFiles(
      ctx,
      attachments('a'),
      'key',
      NO_WAIT,
    )

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(decryptFile).toHaveBeenCalledTimes(1)
    expect(result.files).toEqual([])
    expect(result.failed).toEqual([
      { filename: 'Question 1 - a.pdf', reason: 'decrypt' },
    ])
  })
})
