import { flattenDeep, sumBy } from 'lodash'

import { FilePlatforms } from '../../shared/constants'
import * as fileValidation from '../../shared/util/file-validation'
import { BasicField, FieldResponse, IAttachmentResponse } from '../../types'
import { IAttachmentInfo } from '../modules/submission/email-submission/email-submission.types'

/**
 * Checks an array of attachments to see ensure that every
 * one of them is valid. The validity is determined by an
 * internal isInvalidFileExtension checker function, and
 * zip files are checked recursively.
 *
 * @param attachments - Array of file objects
 * @return Whether all attachments are valid
 */
export const attachmentsAreValid = async (
  attachments: IAttachmentInfo[],
): Promise<boolean> => {
  // Turn it into an array of promises that each resolve
  // to an array of file extensions that are invalid (if any)
  const getInvalidFileExtensionsInZip = fileValidation.getInvalidFileExtensionsInZip(
    FilePlatforms.Server,
  )
  const promises = attachments.map((attachment) => {
    const extension = fileValidation.getFileExtension(attachment.filename)
    if (fileValidation.isInvalidFileExtension(extension)) {
      return Promise.resolve([extension])
    }
    if (extension !== '.zip') return Promise.resolve([])
    return getInvalidFileExtensionsInZip(attachment.content)
  })

  try {
    const results = await Promise.all(promises)
    return flattenDeep(results).length === 0
  } catch (err) {
    // Consume error here, all errors should cause attachments to be considered
    // invalid.
    return false
  }
}

export const areAttachmentsMoreThan7MB = (
  attachments: IAttachmentInfo[],
): boolean => {
  // Check if total attachments size is < 7mb
  const totalAttachmentSize = sumBy(attachments, (a) => a.content.byteLength)
  return totalAttachmentSize > 7000000
}

const isAttachmentResponse = (
  response: FieldResponse,
): response is IAttachmentResponse => {
  return (
    response.fieldType === BasicField.Attachment &&
    (response as IAttachmentResponse).content !== undefined
  )
}

export const mapAttachmentsFromParsedResponses = (
  responses: FieldResponse[],
): Pick<IAttachmentResponse, 'filename' | 'content'>[] => {
  // look for attachments in parsedResponses
  // Could be undefined if it is not required, or hidden
  return responses.filter(isAttachmentResponse).map((response) => ({
    filename: response.filename,
    content: response.content,
  }))
}
