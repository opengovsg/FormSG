import { useCallback } from 'react'
import { useMutation } from 'react-query'
import FileSaver from 'file-saver'

import { useToast } from '~hooks/useToast'

import { AttachmentsDownloadMap } from '../ResponsesPage/storage/types'
import {
  downloadAndDecryptAttachment,
  downloadAndDecryptAttachmentsAsZip,
} from '../ResponsesPage/storage/utils/downloadAndDecryptAttachment'
import { AugmentedDecryptedResponse } from '../ResponsesPage/storage/utils/augmentDecryptedResponses'

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
 * (backend requires inputs to be single responses for info to be separate csv columns)
 *
 * response:
 * {"_id":"677ddc8a238af76fb6faff910","fieldType":"address","question":"Local address - blockNumber","isVisible":true,"answer":"161","questionNumber":2},{"_id":"677ddc8a238af76fb6faff911","fieldType":"address","question":"Local address - streetName","isVisible":true,"answer":"BUKIT BATOK STREET 11","questionNumber":3},{"_id":"677ddc8a238af76fb6faff912","fieldType":"address","question":"Local address - buildingName","isVisible":true,"answer":"","questionNumber":4},{"_id":"677ddc8a238af76fb6faff913","fieldType":"address","question":"Local address - levelNumber","isVisible":true,"answer":"","questionNumber":5},{"_id":"677ddc8a238af76fb6faff914","fieldType":"address","question":"Local address - unitNumber","isVisible":true,"answer":"","questionNumber":6},{"_id":"677ddc8a238af76fb6faff915","fieldType":"address","question":"Local address - postalCode","isVisible":true,"answer":"650161","questionNumber":7}
 *
 * responseV3:
 * {"_id":"67760224fc81a060574be015","fieldType":"address","question":"Local address","answerArray":[["postalCode_650161"],["blockNumber_161"],["streetName_BUKIT BATOK STREET 11"],["buildingName_"],["levelNumber_"],["unitNumber_"]],"questionNumber":1}
 */
export const getAddressResponseDisplay = (
  responses: AugmentedDecryptedResponse[],
) => {
  for (let i = 0; i < responses.length; i++) {
    if ((responses[i].fieldType as string) === 'address') {
      if (responses[i].answer !== undefined) {
        //for storage mode
        const addressInputSize = 6
        const singleAddress = responses.slice(i, i + addressInputSize)
        const values = singleAddress.map((item) => item.answer)

        //manage unit number display
        if (values[values.length - 2]) {
          const combinedUnitNumber =
            '#' + values[values.length - 3] + '-' + values[values.length - 2]
          values.splice(values.length - 3, 2, combinedUnitNumber)
        }

        //manage postal code display
        values[values.length - 1] = 'SINGAPORE ' + values[values.length - 1]

        const singleAddressValue = values.join(', ')

        singleAddress[0].answer = singleAddressValue
        responses.splice(i, addressInputSize, singleAddress[0])
      } else if (responses[i].answerArray !== undefined) {
        // for MRF
        console.log(responses[i].answerArray)
        const values = responses[i].answerArray?.map(
          (item) => item[0].split('_')[1],
        )
        console.log(values)

        if (values === undefined) return responses

        //manage unit number display
        if (values[values.length - 2]) {
          const combinedUnitNumber =
            '#' + values[values.length - 3] + '-' + values[values.length - 2]
          values.splice(values.length - 3, 2, combinedUnitNumber)
        }

        //manage postal code display
        values[values.length - 1] = 'SINGAPORE ' + values[values.length - 1]

        const singleAddressValue = values.join(', ')

        // responses[0].answer = singleAddressValue
        // responses.splice(i, 1, responses[i])
      }
    }
  }
  return responses
}
