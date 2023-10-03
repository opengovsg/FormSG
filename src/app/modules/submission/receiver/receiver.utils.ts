import { StatusCodes } from 'http-status-codes'

import { IAttachmentInfo, MapRouteError } from '../../../../types'
import {
  ParsedClearAttachmentResponse,
  ParsedClearFormFieldResponse,
} from '../../../../types/api'
import { createLoggerWithLabel } from '../../../config/logger'

import {
  InitialiseMultipartReceiverError,
  MultipartError,
} from './receiver.errors'

const logger = createLoggerWithLabel(module)

export const mapRouteError: MapRouteError = (error) => {
  switch (error.constructor) {
    case InitialiseMultipartReceiverError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage: 'Required headers are missing',
      }
    case MultipartError:
      return {
        statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
        errorMessage: 'Submission could not be parsed.',
      }
    default:
      logger.error({
        message: 'mapRouteError called with unknown error type',
        meta: {
          action: 'mapRouteError',
        },
        error,
      })
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: 'Something went wrong. Please refresh and try again.',
      }
  }
}

/**
 * Checks whether attachmentMap contains the given response
 * @param attachmentMap Map of field IDs to attachments
 * @param response The response to check
 * @returns true if response is in map, false otherwise
 */
const isAttachmentResponseFromMap = (
  attachmentMap: Record<IAttachmentInfo['fieldId'], IAttachmentInfo>,
  response: ParsedClearFormFieldResponse,
): response is ParsedClearAttachmentResponse => {
  return !!attachmentMap[response._id]
}

/**
 * Adds the attachment's content, filename to each response,
 * based on their fieldId.
 * The response's answer is also changed to the attachment's filename.
 *
 * @param responses - Array of responses received
 * @param attachments - Array of file objects
 * @returns void. Modifies responses in place.
 */
export const addAttachmentToResponses = (
  responses: ParsedClearFormFieldResponse[],
  attachments: IAttachmentInfo[],
  isVirusScannerEnabled: boolean,
): void => {
  // Create a map of the attachments with fieldId as keys
  const attachmentMap: Record<IAttachmentInfo['fieldId'], IAttachmentInfo> =
    attachments.reduce<Record<string, IAttachmentInfo>>((acc, attachment) => {
      acc[attachment.fieldId] = attachment
      return acc
    }, {})

  if (responses) {
    // matches responses to attachments using id, adding filename and content to response
    responses.forEach((response) => {
      if (isAttachmentResponseFromMap(attachmentMap, response)) {
        const file = attachmentMap[response._id]
        response.filename = file.filename
        response.content = file.content
        if (!isVirusScannerEnabled) {
          response.answer = file.filename
        }
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
 * @returns void. Modifies array in-place.
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
