import { datadogLogs } from '@datadog/browser-logs'
import { decode as decodeBase64 } from '@stablelib/base64'
import JSZip from 'jszip'

import {
  AttachmentsDownloadMap,
  DecryptedAttachmentFile,
  DecryptionCtx,
} from '../types'

export const downloadAndDecryptAttachment = async (
  ctx: DecryptionCtx,
  url: string,
  secretKey: string,
) => {
  const response = await fetch(url)
  if (!response.ok) {
    datadogLogs.logger.error('Attachment download failed on client', {
      meta: {
        action: 'downloadAndDecryptAttachment',
        status: response.status,
        text: await response.text(),
        pathname: window.location.pathname,
        version: import.meta.env.VITE_APP_VERSION,
      },
    })
    throw new Error(
      `This attachment could not be downloaded. Please refresh and try again.`,
    )
  }
  const data = await response.json()
  data.encryptedFile.binary = decodeBase64(data.encryptedFile.binary)
  // RATIONALE: For casting to Uint8Array<ArrayBuffer>, after TS update, Uint8Array can be SharedArrayBuffer, which is not compatible with Blob.
  // Hence, until we update the SDK return type, we cast to Uint8Array<ArrayBuffer> to ensure compatibility.
  return (await ctx.formsgSdk.crypto.decryptFile(
    secretKey,
    data.encryptedFile,
  )) as Uint8Array<ArrayBuffer> | null
}

/**
 * Downloads and decrypts every file in the map, naming each
 * `Question N - <filename>`.
 */
export const downloadAndDecryptAttachments = async (
  ctx: DecryptionCtx,
  attachmentDownloadUrls: AttachmentsDownloadMap,
  secretKey: string,
): Promise<DecryptedAttachmentFile[]> => {
  const files = Array.from(attachmentDownloadUrls).map(
    ([questionNum, { url, filename }]) => ({
      url,
      filename: `Question ${questionNum} - ${filename}`,
    }),
  )
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
