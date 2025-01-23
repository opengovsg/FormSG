import { useCallback } from 'react'
import { useMutation } from 'react-query'
import FileSaver from 'file-saver'

import { BasicField } from '~shared/types'

import { useToast } from '~hooks/useToast'

import { AttachmentsDownloadMap } from '../ResponsesPage/storage/types'
import { AugmentedDecryptedResponse } from '../ResponsesPage/storage/utils/augmentDecryptedResponses'
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
export const handleAddressResponseDisplay = (responses: string[]): string[] => {
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
      const combinedUnit = '#' + arr[arr.length - 3] + '-' + arr[arr.length - 2]
      arr.splice(arr.length - 3, 2, combinedUnit)
    }

    // remove empty inputs from array
    const cleanedArr = arr.filter((item) => item !== '').join(', ')

    return [cleanedArr]
  }
  return responses
}

/**
 * Finds address response group(s) of single responses (6) and combines them to a single
 * response for display output. Manages multiple addresses if present, other fields are
 * unchanged.
 */
export const manageAddressResponseDisplay = (
  responses: AugmentedDecryptedResponse[] | undefined,
): AugmentedDecryptedResponse[] | undefined => {
  if (!responses) return undefined
  const result: AugmentedDecryptedResponse[] = []
  const addressSubFields: AugmentedDecryptedResponse[] = []
  for (const i in responses) {
    if (responses[i].fieldType === BasicField.Address) {
      if (!responses[i].answerArray) {
        addressSubFields.push(responses[i])
        if (addressSubFields.length === 6) {
          // one full address field
          const oneAddressField = combineOneAddressDisplay(addressSubFields)
          result.push(oneAddressField)
          addressSubFields.length = 0 //empty array for multiple addresses
        }
      } else {
        const values = handleAddressResponseDisplay(
          responses[i].answerArray as string[],
        )
        responses[i].answerArray = values
        result.push(responses[i])
      }
    } else {
      result.push(responses[i])
    }
  }
  return result
}

/**
 * Combines multiple address fields (SingleResponses) into 1 field for display
 */
const combineOneAddressDisplay = (
  formFields: AugmentedDecryptedResponse[],
): AugmentedDecryptedResponse => {
  if (formFields.length !== 6) {
    throw Error('malformed address response field')
  }
  const id = formFields[0]._id
  const fieldType = formFields[0].fieldType
  const question = formFields[0].question.split('-')[0]
  const questionNumber = formFields[0].questionNumber

  const arr = formFields.map((ff) => {
    return ff.answer
  })
  // update postal code; assumption that postalCode is already at the end
  arr[arr.length - 1] = 'SINGAPORE ' + arr[arr.length - 1]
  // update level/unit number
  if (arr && arr[arr.length - 2] && arr[arr.length - 3]) {
    const combinedUnit = '#' + arr[arr.length - 3] + '-' + arr[arr.length - 2]
    arr.splice(arr.length - 3, 2, combinedUnit)
  }
  const answer = arr.filter((item) => item !== '').join(', ')

  const r = {
    _id: id,
    fieldType: fieldType,
    question: question,
    answer: answer,
    questionNumber: questionNumber,
  }
  return r
}
