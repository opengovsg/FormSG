import { useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import FileSaver from 'file-saver'

import { useToast } from '~hooks/useToast'

import { AttachmentsDownloadMap } from '../ResponsesPage/storage/types'
import {
  downloadAndDecryptAttachment,
  downloadAndDecryptAttachmentsAsZip,
} from '../ResponsesPage/storage/utils/downloadAndDecryptAttachment'

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
      const byteArray = await downloadAndDecryptAttachment(url, secretKey)
      if (!byteArray) throw new Error('Invalid file')
      FileSaver.saveAs(new Blob([byteArray]), fileName)
      return fileName
    },
    {
      onSuccess: (fileName) => {
        toast.closeAll()
        toast({ description: `Sucessfully downloaded attachment ${fileName}` })
      },
      onError: handleError,
    },
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

  return { downloadAttachmentMutation, downloadAttachmentsAsZipMutation }
}
