import { useCallback } from 'react'
import { useMutation } from 'react-query'
import FileSaver from 'file-saver'
import type JSZip from 'jszip'

import { useToast } from '~hooks/useToast'
import formsgSdk from '~utils/formSdk'

import { AttachmentsDownloadMap } from '../ResponsesPage/storage/types'
import {
  downloadAndDecryptAttachment,
  downloadAndDecryptAttachmentsAsZip,
} from '../ResponsesPage/storage/utils/downloadAndDecryptAttachment'

export const downloadAndDecryptOrThrow = async (
  url: string | undefined,
  secretKey: string,
): Promise<Uint8Array<ArrayBuffer>> => {
  const content =
    url && (await downloadAndDecryptAttachment({ formsgSdk }, url, secretKey))
  if (!content) throw new Error('Invalid file')
  return content
}

export const useMutateDownloadAttachments = () => {
  const toast = useToast({ status: 'success', isClosable: true })

  const handleError = useCallback(
    (error: Error) => {
      toast.closeAll()
      toast({
        description: error.message,
        status: 'danger',
      })
    },
    [toast],
  )

  const fileDownloadOptions = {
    onSuccess: (fileName: string) => {
      toast.closeAll()
      toast({ description: `Sucessfully downloaded attachment ${fileName}` })
    },
    onError: handleError,
  }

  const downloadAttachmentMutation = useMutation(
    async ({
      url,
      secretKey,
      fileName,
    }: {
      url: string
      secretKey: string
      fileName: string
    }) => {
      const byteArray = await downloadAndDecryptOrThrow(url, secretKey)
      FileSaver.saveAs(new Blob([byteArray]), fileName)
      return fileName
    },
    fileDownloadOptions,
  )

  const downloadMultiAttachmentFileMutation = useMutation(
    async ({
      getZip,
      fileName,
    }: {
      getZip: () => Promise<JSZip>
      fileName: string
    }) => {
      const file = (await getZip()).file(fileName)
      if (!file) throw new Error('Invalid file')
      FileSaver.saveAs(await file.async('blob'), fileName)
      return fileName
    },
    fileDownloadOptions,
  )

  const downloadAttachmentsAsZipMutation = useMutation(
    async ({
      attachmentDownloadUrls,
      secretKey,
      fileName,
    }: {
      attachmentDownloadUrls: AttachmentsDownloadMap
      secretKey: string
      fileName: string
    }) => {
      const byteArray = await downloadAndDecryptAttachmentsAsZip(
        { formsgSdk },
        attachmentDownloadUrls,
        secretKey,
      )
      if (!byteArray) throw new Error('Invalid file')
      FileSaver.saveAs(new Blob([byteArray]), fileName)
      return attachmentDownloadUrls.size
    },
    {
      onSuccess: (numAttachments) => {
        toast.closeAll()
        toast({
          description: `Successfully downloaded ${numAttachments} attachments as .zip`,
        })
      },
      onError: handleError,
    },
  )

  return {
    downloadAttachmentMutation,
    downloadMultiAttachmentFileMutation,
    downloadAttachmentsAsZipMutation,
  }
}
