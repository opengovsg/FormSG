import { FieldResponse, IAttachmentResponse } from '../../../../types'

import { IAttachmentInfo } from './email-submission.types'

const isAttachmentResponseFromMap = (
  attachmentMap: Record<IAttachmentInfo['fieldId'], IAttachmentInfo>,
  response: FieldResponse,
): response is IAttachmentResponse => {
  return !!attachmentMap[response._id]
}

/**
 * Adds the attachment's content, filename to each response,
 * based on their fieldId.
 * The response's answer is also changed to the attachment's filename.
 *
 * @param responses - Array of responses received
 * @param attachments - Array of file objects
 */
export const addAttachmentToResponses = (
  responses: FieldResponse[],
  attachments: IAttachmentInfo[],
): void => {
  // Create a map of the attachments with fieldId as keys
  const attachmentMap: Record<
    IAttachmentInfo['fieldId'],
    IAttachmentInfo
  > = attachments.reduce<Record<string, IAttachmentInfo>>((acc, attachment) => {
    acc[attachment.fieldId] = attachment
    return acc
  }, {})

  if (responses) {
    // matches responses to attachments using id, adding filename and content to response
    responses.forEach((response) => {
      if (isAttachmentResponseFromMap(attachmentMap, response)) {
        const file = attachmentMap[response._id]
        response.answer = file.filename
        response.filename = file.filename
        response.content = file.content
      }
    })
  }
}

/**
 * Looks for duplicated filenames and changes the filename
 * to for example 1-abc.txt, 2-abc.txt.
 * One of the duplicated files will not have its name changed.
 * Two abc.txt will become 1-abc.txt and abc.txt
 * @param attachments - Array of file objects
 */
export const handleDuplicatesInAttachments = (
  attachments: IAttachmentInfo[],
): void => {
  const names = new Map()

  // fill up the map, the key: filename and value: count
  attachments.forEach((a) => {
    if (names.get(a.filename)) {
      names.set(a.filename, names.get(a.filename) + 1)
    } else {
      names.set(a.filename, 1)
    }
  })

  // Change names of duplicates
  attachments.forEach((a) => {
    if (names.get(a.filename) > 1) {
      const count = names.get(a.filename) - 1
      names.set(a.filename, count)
      a.filename = `${count}-${a.filename}`
    }
  })
}
