import Busboy from 'busboy'
import { IncomingHttpHeaders } from 'http'
import { err, ok, Result, ResultAsync } from 'neverthrow'
import { VIRUS_SCANNER_SUBMISSION_VERSION } from 'shared/constants'
import { FormResponseMode } from 'shared/types'

import { MB } from '../../../../../shared/constants/file'
import { IAttachmentInfo } from '../../../../types'
import { createLoggerWithLabel } from '../../../config/logger'
import { fileSizeLimit } from '../submission.utils'

import {
  InitialiseMultipartReceiverError,
  MultipartContentLimitError,
  MultipartContentParsingError,
  MultipartError,
} from './receiver.errors'
import { ParsedMultipartForm } from './receiver.types'
import {
  addAttachmentToResponses,
  handleDuplicatesInAttachments,
} from './receiver.utils'

const logger = createLoggerWithLabel(module)

const hasContentTypeHeaders = (headers: IncomingHttpHeaders) => {
  return !!headers['content-type']
}

/**
 * Initialises a Busboy object to receive the submission stream
 * @param headers HTTP request headers
 */
export const createMultipartReceiver = (
  headers: IncomingHttpHeaders,
  responseMode: FormResponseMode,
): Result<Busboy.Busboy, InitialiseMultipartReceiverError> => {
  if (!hasContentTypeHeaders(headers)) {
    logger.error({
      message: "Busboy cannot be init due to missing headers['content-type']",
      meta: {
        action: 'createMultipartReceiver',
        headers,
      },
    })
    return err(new InitialiseMultipartReceiverError())
  }

  try {
    const busboy = Busboy({
      headers,
      limits: {
        fieldSize: 3 * MB,
        fileSize: fileSizeLimit(responseMode) * MB,
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
  busboy: Busboy.Busboy,
): ResultAsync<ParsedMultipartForm, MultipartError> => {
  const logMeta = {
    action: 'configureMultipartReceiver',
  }
  const responsePromise = new Promise<ParsedMultipartForm>(
    (resolve, reject) => {
      const attachments: IAttachmentInfo[] = []
      let body: ParsedMultipartForm

      busboy
        .on('file', (fieldname, file, { filename }) => {
          // Required to convert fieldname's encoding as busboy treats all
          // incoming fields as `latin1` encoding,
          // but this means some file languages gets incorrectly encoded
          // (like Chinese, Tamil, etc), e.g.
          // `utf8-with-endash – test.txt` -> `utf8-with-endash â�� test.txt`.
          // See https://github.com/mscdex/busboy/issues/274.
          const utf8Fieldname = Buffer.from(fieldname, 'latin1').toString(
            'utf8',
          )
          if (filename) {
            const buffers: Buffer[] = []
            file.on('data', (data) => {
              buffers.push(data)
            })

            file.on('end', () => {
              const buffer = Buffer.concat(buffers)
              attachments.push({
                filename: utf8Fieldname,
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
        .on('field', (name, val, { valueTruncated }) => {
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
        .on('close', () => {
          if (body) {
            handleDuplicatesInAttachments(attachments)
            addAttachmentToResponses(
              body.responses,
              attachments,
              // default to 0 for email mode forms where version is undefined
              // TODO (FRM-1413): change to a version existence guardrail when
              // virus scanning has completed rollout, so that virus scanning
              // cannot be bypassed on storage mode submissions.
              (body.version ?? 0) >= VIRUS_SCANNER_SUBMISSION_VERSION,
            )
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
