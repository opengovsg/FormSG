import Busboy from 'busboy'
import { IncomingHttpHeaders } from 'http'
import { err, ok, Result } from 'neverthrow'

import { createLoggerWithLabel } from '../../../../config/logger'
import { MB } from '../../../constants/filesize'
import { IAttachmentInfo } from '../../../utils/attachment'

import {
  GenericMultipartError,
  InitialiseMultipartReceiverError,
  MultipartContentLimitError,
  MultipartContentParsingError,
} from './email-submission.errors'
import { ParsedMultipartForm } from './email-submission.types'

const logger = createLoggerWithLabel(module)

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

export const configureMultipartReceiver = (
  busboy: busboy.Busboy,
  callback: (
    result: Result<
      ParsedMultipartForm,
      | MultipartContentLimitError
      | MultipartContentParsingError
      | GenericMultipartError
    >,
  ) => void,
): void => {
  const attachments: IAttachmentInfo[] = []
  let body: ParsedMultipartForm['body']

  busboy
    .on('file', (fieldname, file, filename) => {
      if (filename) {
        const buffers: Buffer[] = []
        file.on('data', function (data) {
          buffers.push(data)
        })

        file.on('end', function () {
          const buffer = Buffer.concat(buffers)
          attachments.push({
            filename: fieldname,
            content: buffer,
            fieldId: filename,
          })
          file.resume()
        })
        file.on('limit', function () {
          logger.error({
            message: 'Multipart content is too large',
            meta: {
              action: 'configureMultipartReceiver',
            },
          })
          return callback(err(new MultipartContentLimitError()))
        })
      }
    })
    .on('field', (name, val, _fieldnameTruncated, valueTruncated) => {
      // on receiving body field, convert to JSON
      if (name === 'body') {
        if (valueTruncated) {
          logger.error({
            message: 'Multipart content is too large',
            meta: {
              action: 'configureMultipartReceiver',
            },
          })
          return callback(err(new MultipartContentLimitError()))
        }
        try {
          body = JSON.parse(val)
        } catch (error) {
          // Invalid form data
          logger.error({
            message: 'Error while attempting to parse form data',
            meta: {
              action: 'configureMultipartReceiver',
            },
            error,
          })
          return callback(err(new MultipartContentParsingError()))
        }
      }
    })
    .on('error', (error: Error) => {
      logger.error({
        message: 'Multipart error',
        meta: {
          action: 'configureMultipartReceiver',
        },
        error,
      })
      return callback(err(new GenericMultipartError()))
    })
    .on('finish', () => callback(ok({ attachments, body })))
}
