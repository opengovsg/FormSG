import { datadogLogs } from '@datadog/browser-logs'
import { decode as decodeBase64 } from '@stablelib/base64'
import JSZip from 'jszip'

import { AttachmentsDownloadMap, DecryptionCtx } from '../types'

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
  )) as Uint8Array<ArrayBuffer>
}

export const downloadAndDecryptAttachmentsAsZip = async (
  ctx: DecryptionCtx,
  attachmentDownloadUrls: AttachmentsDownloadMap,
  secretKey: string,
  extraAttachments?: {
    filename: string
    blob: Blob
  }[],
) => {
  const zip = new JSZip()
  const downloadPromises = []
  for (const [questionNum, metadata] of attachmentDownloadUrls) {
    downloadPromises.push(
      downloadAndDecryptAttachment(ctx, metadata.url, secretKey).then(
        (bytesArray) => {
          if (bytesArray) {
            zip.file(
              'Question ' + questionNum + ' - ' + metadata.filename,
              bytesArray,
            )
          }
        },
      ),
    )
  }

  if (extraAttachments?.length) {
    for (const attachment of extraAttachments) {
      zip.file(attachment.filename, attachment.blob)
    }
  }

  await Promise.all(downloadPromises)
  return await zip.generateAsync({ type: 'blob' })
}
