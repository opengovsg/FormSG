import { decode as decodeBase64 } from '@stablelib/base64'
import JSZip from 'jszip'

import formsgSdk from '~utils/formSdk'

import { AttachmentsDownloadMap } from '../types'

export const downloadAndDecryptAttachment = async (
  url: string,
  secretKey: string,
) => {
  const response = await fetch(url)
  const data = await response.json()
  data.encryptedFile.binary = decodeBase64(data.encryptedFile.binary)
  return await formsgSdk.crypto.decryptFile(secretKey, data.encryptedFile)
}

export const downloadAndDecryptAttachmentsAsZip = async (
  attachmentDownloadUrls: AttachmentsDownloadMap,
  secretKey: string,
) => {
  const zip = new JSZip()
  const downloadPromises = []
  for (const [questionNum, metadata] of attachmentDownloadUrls) {
    downloadPromises.push(
      downloadAndDecryptAttachment(metadata.url, secretKey).then(
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
  await Promise.all(downloadPromises)
  return await zip.generateAsync({ type: 'blob' })
}
