import { datadogLogs } from '@datadog/browser-logs'
import { decode as decodeBase64 } from '@stablelib/base64'
import JSZip from 'jszip'

import { waitForMs } from '~utils/waitForMs'

import {
  AttachmentsDownloadMap,
  DecryptedAttachmentFile,
  DecryptionCtx,
  FailedAttachmentFile,
} from '../types'

type EncryptedFile = Parameters<
  DecryptionCtx['formsgSdk']['crypto']['decryptFile']
>[1]

// The waits between tries of an attachment download in the one zip download:
// one try, then three retries
export const ATTACHMENT_RETRY_DELAYS_MS = [1000, 2000, 4000]

const downloadEncryptedAttachment = async (
  url: string,
  attempt?: number,
): Promise<EncryptedFile> => {
  const response = await fetch(url)
  if (!response.ok) {
    datadogLogs.logger.error('Attachment download failed on client', {
      meta: {
        action: 'downloadAndDecryptAttachment',
        status: response.status,
        text: await response.text(),
        pathname: window.location.pathname,
        version: import.meta.env.VITE_APP_VERSION,
        ...(attempt === undefined ? {} : { attempt }),
      },
    })
    throw new Error(
      `This attachment could not be downloaded. Please refresh and try again.`,
    )
  }
  const data = await response.json()
  data.encryptedFile.binary = decodeBase64(data.encryptedFile.binary)
  return data.encryptedFile
}

const decryptAttachment = async (
  ctx: DecryptionCtx,
  encryptedFile: EncryptedFile,
  secretKey: string,
) =>
  // RATIONALE: For casting to Uint8Array<ArrayBuffer>, after TS update, Uint8Array can be SharedArrayBuffer, which is not compatible with Blob.
  // Hence, until we update the SDK return type, we cast to Uint8Array<ArrayBuffer> to ensure compatibility.
  (await ctx.formsgSdk.crypto.decryptFile(
    secretKey,
    encryptedFile,
  )) as Uint8Array<ArrayBuffer> | null

export const downloadAndDecryptAttachment = async (
  ctx: DecryptionCtx,
  url: string,
  secretKey: string,
) => decryptAttachment(ctx, await downloadEncryptedAttachment(url), secretKey)

/** Names each file in the map `Question N - <filename>`. */
const toNamedAttachments = (attachmentDownloadUrls: AttachmentsDownloadMap) =>
  Array.from(attachmentDownloadUrls).map(
    ([questionNum, { url, filename }]) => ({
      url,
      filename: `Question ${questionNum} - ${filename}`,
    }),
  )

/**
 * Downloads and decrypts every file in the map. One failing fails them all.
 */
const downloadAndDecryptAttachments = async (
  ctx: DecryptionCtx,
  attachmentDownloadUrls: AttachmentsDownloadMap,
  secretKey: string,
): Promise<DecryptedAttachmentFile[]> => {
  const files = toNamedAttachments(attachmentDownloadUrls)
  const decryptedFiles = await Promise.all(
    files.map(async ({ url, filename }) => ({
      filename,
      content: await downloadAndDecryptAttachment(ctx, url, secretKey),
    })),
  )
  // A file that fails to decrypt is left out, as it always has been
  return decryptedFiles.flatMap(({ filename, content }) =>
    content ? [{ filename, content }] : [],
  )
}

/**
 * Downloads and decrypts every file in the map for the one zip download. A
 * download that fails is retried after each of `retryDelaysMs`. A file that
 * still fails, or fails to decrypt, is returned in `failed` and the rest carry
 * on.
 */
export const downloadAndDecryptAttachmentFiles = async (
  ctx: DecryptionCtx,
  attachmentDownloadUrls: AttachmentsDownloadMap,
  secretKey: string,
  retryDelaysMs = ATTACHMENT_RETRY_DELAYS_MS,
): Promise<{
  files: DecryptedAttachmentFile[]
  failed: FailedAttachmentFile[]
}> => {
  const downloadWithRetries = async (url: string) => {
    for (let attempt = 0; ; attempt++) {
      try {
        return await downloadEncryptedAttachment(url, attempt)
      } catch (error) {
        if (attempt >= retryDelaysMs.length) throw error
        await waitForMs(retryDelaysMs[attempt])
      }
    }
  }
  const results = await Promise.all(
    toNamedAttachments(attachmentDownloadUrls).map(
      async ({
        url,
        filename,
      }): Promise<DecryptedAttachmentFile | FailedAttachmentFile> => {
        let encryptedFile: EncryptedFile
        try {
          encryptedFile = await downloadWithRetries(url)
        } catch {
          return { filename, reason: 'download' }
        }
        // Decrypting again would fail the same way, so it isn't retried
        const content = await decryptAttachment(
          ctx,
          encryptedFile,
          secretKey,
        ).catch(() => null)
        return content ? { filename, content } : { filename, reason: 'decrypt' }
      },
    ),
  )
  return {
    files: results.filter(
      (result): result is DecryptedAttachmentFile => 'content' in result,
    ),
    failed: results.filter(
      (result): result is FailedAttachmentFile => 'reason' in result,
    ),
  }
}

export const downloadAndDecryptAttachmentsAsZip = async (
  ctx: DecryptionCtx,
  attachmentDownloadUrls: AttachmentsDownloadMap,
  secretKey: string,
) => {
  const zip = new JSZip()
  const files = await downloadAndDecryptAttachments(
    ctx,
    attachmentDownloadUrls,
    secretKey,
  )
  for (const { filename, content } of files) {
    zip.file(filename, content)
  }

  return await zip.generateAsync({ type: 'blob' })
}
