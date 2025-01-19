import { useCallback } from 'react'
import { useMutation } from 'react-query'
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

/**
 * Converts address field info as Single Responses into single-line string for response page display
 * String manipulation done on frontend in DecryptRow
 * since backend requires inputs to be single responses for info to be separate csv columns
 *
 * responses format:
 * ["blockNumber_161","streetName_BUKIT BATOK STREET 11","buildingName_","levelNumber_","unitNumber_","postalCode_650161"]
 */
export const handleAddressResponseDisplay = (responses: string[]) => {
  const ans = responses
  if (Array.isArray(ans)) {
    let arr: string[] = []

    // remove all address prefixes
    if (ans.every((item) => typeof item === 'string')) {
      arr = ans.map((item) => (item as string).split('_')[1])
    }

    // handle postal code additions
    if (arr && arr[arr.length - 1])
      arr[arr.length - 1] = 'SINGAPORE ' + arr[arr.length - 1]

    // handle leve;/unit number additions
    if (arr && arr[arr.length - 2] && arr[arr.length - 3]) {
      const combinedUnit = '#' + arr[arr.length - 2] + '-' + arr[arr.length - 3]
      arr.splice(arr.length - 3, 2, combinedUnit)
    }

    // remove empty inputs from array
    const cleanedArr = arr.filter((item) => item !== '')

    return cleanedArr
  }
  return responses
}
