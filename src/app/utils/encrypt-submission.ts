import { Request } from 'express'

import { IPopulatedForm } from 'src/types'

import { createLoggerWithLabel } from '../../config/logger'
import { getProcessedResponses } from '../modules/submission/submission.service'

import { checkIsEncryptedEncoding } from './encryption'
import { createReqMeta } from './request'

const logger = createLoggerWithLabel(module)

type ReqWithForm<T> = T & { form: IPopulatedForm }

export const isValidEncryptSubmission = (req: Request): boolean => {
  // TODO (#42): Remove typecast once app has migrated away from middlewares.
  const { form } = req as ReqWithForm<typeof req>
  try {
    // Check if the encrypted content is base64
    checkIsEncryptedEncoding(req.body.encryptedContent)
  } catch (error) {
    logger.error({
      message: 'Invalid encryption',
      meta: {
        action: 'validateEncryptSubmission',
        ...createReqMeta(req),
        formId: form._id,
      },
      error,
    })
    return false
  }
  return true
}

export const processResponses = (req: Request): void => {
  // TODO (#42): Remove typecast once app has migrated away from middlewares.
  const { form } = req as ReqWithForm<typeof req>
  if (req.body.responses) {
    try {
      req.body.parsedResponses = getProcessedResponses(form, req.body.responses)
      delete req.body.responses // Prevent downstream functions from using responses by deleting it
    } catch (err) {
      logger.error({
        message: 'Error processing responses',
        meta: {
          action: 'validateEncryptSubmission',
          ...createReqMeta(req),
          formId: form._id,
        },
        error: err,
      })
      throw err
    }
  }
}
