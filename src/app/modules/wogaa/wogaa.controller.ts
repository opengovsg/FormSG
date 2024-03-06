import Axios from 'axios'
import * as crypto from 'crypto'
import uuidGen from 'uuid-by-string'

import { wogaaConfig } from '../../config/features/wogaa'
import { createLoggerWithLabel } from '../../config/logger'
import { ControllerHandler } from '../core/core.types'

const logger = createLoggerWithLabel(module)
const generateSignature = (payload: Record<string, unknown>) => {
  const signature = crypto
    .createHmac('sha256', wogaaConfig.wogaaSecretKey)
    .update(JSON.stringify(payload))
    .digest('hex')
  return signature
}

const isConfigValid = () => {
  if (!wogaaConfig.wogaaSecretKey) {
    return false
  }
  if (!wogaaConfig.wogaaStartEndpoint) {
    return false
  }
  if (!wogaaConfig.wogaaSubmitEndpoint) {
    return false
  }
  if (!wogaaConfig.wogaaFeedbackEndpoint) {
    return false
  }

  return true
}

export const handleSubmit: ControllerHandler<{ formId: string }> = async (
  req,
  _,
  next,
) => {
  const { formId } = req.params

  if (!req.sessionID || !formId || !isConfigValid()) {
    return next()
  }

  const logMeta = {
    action: 'wogaaHandleSubmit',
    formId,
  }

  const payload = {
    formSgId: formId,
    transactionId: uuidGen(req.sessionID),
  }
  // fire and forget
  void Axios.post(wogaaConfig.wogaaSubmitEndpoint, payload, {
    headers: {
      'WOGAA-Signature': generateSignature(payload),
    },
  })
    .then(() => {
      logger.info({
        message: 'Successfully sent WOGAA submit endpoint',
        meta: logMeta,
      })
    })
    .catch((e) => {
      logger.warn({
        message: 'Error sending to WOGAA submit endpoint',
        meta: { ...logMeta, wogaaRespError: e },
      })
    })

  return next()
}

export const handleFormView: ControllerHandler<{ formId: string }> = async (
  req,
  _,
  next,
) => {
  const { formId } = req.params

  if (!req.sessionID || !formId || !isConfigValid()) {
    return next()
  }

  const logMeta = {
    action: 'wogaaHandleFormView',
    formId,
  }
  const payload = {
    formSgId: formId,
    pageUrl: formId,
    transactionId: uuidGen(req.sessionID),
  }
  void Axios.post(wogaaConfig.wogaaStartEndpoint, payload, {
    headers: {
      'WOGAA-Signature': generateSignature(payload),
    },
  })
    .then(() => {
      logger.info({
        message: 'Successfully sent WOGAA load form endpoint',
        meta: logMeta,
      })
    })
    .catch((e) => {
      logger.warn({
        message: 'Error sending to WOGAA load form endpoint',
        meta: { ...logMeta, wogaaRespError: e },
      })
    })

  return next()
}

export const handleFormFeedback: ControllerHandler<
  { formId: string },
  unknown,
  { rating: number; comment: string }
> = async (req, _, next) => {
  const { formId } = req.params
  const { rating, comment } = req.body

  if (!req.sessionID || !formId || !isConfigValid()) {
    return next()
  }

  const logMeta = {
    action: 'wogaaHandleFormFeedback',
    formId,
  }
  const payload = {
    formSgId: formId,
    transactionId: uuidGen(req.sessionID),
    rating,
    comment,
  }

  void Axios.post(wogaaConfig.wogaaFeedbackEndpoint, payload, {
    headers: {
      'WOGAA-Signature': generateSignature(payload),
    },
  })
    .then(() => {
      logger.info({
        message: 'Successfully sent WOGAA form feedback endpoint',
        meta: logMeta,
      })
    })
    .catch((e) => {
      logger.warn({
        message: 'Error sending to WOGAA form feedback endpoint',
        meta: { ...logMeta, wogaaRespError: e },
      })
    })

  return next()
}
