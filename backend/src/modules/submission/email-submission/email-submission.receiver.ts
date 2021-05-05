import Busboy from 'busboy'
import { IncomingHttpHeaders } from 'http'
import { err, ok, Result, ResultAsync } from 'neverthrow'

import { IAttachmentInfo } from '@root/types'
import { createLoggerWithLabel } from '../../../config/logger'
import { MB } from '../../../constants/filesize'

import {
  InitialiseMultipartReceiverError,
  MultipartContentLimitError,
  MultipartContentParsingError,
  MultipartError,
} from './email-submission.errors'
import { ParsedMultipartForm } from './email-submission.types'
import {
  addAttachmentToResponses,
  handleDuplicatesInAttachments,
} from './email-submission.util'

const logger = createLoggerWithLabel(module)

/**
 * Initialises a Busboy object to receive the submission stream
 * @param headers HTTP request headers
 */
export const createMultipartReceiver = (
  headers: IncomingHttpHeaders,
): Result<busboy.Busboy, InitialiseMultipartReceiverError> => {
  try {
    const busboy = new Busboy({
      headers,
      limits: {
        fieldSize: 3 * MB,
        fileSize: 7 * MB,
      },
    })
    return ok(busboy)
  } catch (error) {
    logger.error({
      message: 'Error while initialising busboy',
      meta: {
        action: 'createMultipartReceiver',
        headers,
      },
      error,
    })
    return err(new InitialiseMultipartReceiverError())
  }
}

/**
 * Parses the incoming submission stream into responses together with
 * attachment content for attachment fields.
 * @param busboy Busboy receiver object
 */
export const configureMultipartReceiver = (
  busboy: busboy.Busboy,
): ResultAsync<ParsedMultipartForm, MultipartError> => {
  const logMeta = {
    action: 'configureMultipartReceiver',
  }
  const responsePromise = new Promise<ParsedMultipartForm>(
    (resolve, reject) => {
      const attachments: IAttachmentInfo[] = []
      let body: ParsedMultipartForm

      busboy
        .on('file', (fieldname, file, filename) => {
          if (filename) {
            const buffers: Buffer[] = []
            file.on('data', (data) => {
              buffers.push(data)
            })

            file.on('end', () => {
              const buffer = Buffer.concat(buffers)
              attachments.push({
                filename: fieldname,
                content: buffer,
                fieldId: filename,
              })
              file.resume()
            })
            file.on('limit', () => {
              logger.error({
                message: 'Limit event triggered by multipart receiver',
                meta: logMeta,
              })
              return reject(new MultipartContentLimitError())
            })
          }
        })
        .on('field', (name, val, _fieldnameTruncated, valueTruncated) => {
          // on receiving body field, convert to JSON
          if (name === 'body') {
            if (valueTruncated) {
              logger.error({
                message: 'Multipart value truncated',
                meta: logMeta,
              })
              return reject(new MultipartContentLimitError())
            }
            try {
              body = JSON.parse(val)
            } catch (error) {
              // Invalid form data
              logger.error({
                message: 'Error while attempting to parse form data',
                meta: logMeta,
                error,
              })
              return reject(new MultipartContentParsingError())
            }
          }
        })
        .on('error', (error: Error) => {
          logger.error({
            message: 'Generic multipart error',
            meta: logMeta,
            error,
          })
          return reject(error)
        })
        .on('finish', () => {
          if (body) {
            handleDuplicatesInAttachments(attachments)
            addAttachmentToResponses(body.responses, attachments)
            return resolve(body)
          } else {
            // if body is not defined, the Promise would have been rejected elsewhere.
            // but reject here again just in case.
            return reject(new MultipartError())
          }
        })
    },
  )
  return ResultAsync.fromPromise(responsePromise, (error) => {
    logger.error({
      message: 'Error while receiving form data',
      meta: logMeta,
      error,
    })
    return new MultipartError()
  })
}
