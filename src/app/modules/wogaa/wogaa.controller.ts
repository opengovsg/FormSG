import Axios from 'axios'
import * as crypto from 'crypto'
import uuidGen from 'uuid-by-string'

import { wogaaConfig } from '../../config/features/wogaa'
import { ControllerHandler } from '../core/core.types'

const generateSignature = (payload: Record<string, unknown>) => {
  const signature = crypto
    .createHmac('sha256', wogaaConfig.wogaaSecretKey)
    .update(JSON.stringify(payload))
    .digest('hex')
  return signature
}

const checkAll = () => {
  if (!wogaaConfig.wogaaFeedbackEndpoint) {
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

  if (!req.sessionID || !formId || !checkAll()) {
    return next()
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
  }).catch(() => {
    // should not handle errors
  })

  return next()
}

export const handleFormView: ControllerHandler<{ formId: string }> = async (
  req,
  _,
  next,
) => {
  const { formId } = req.params
  console.log('>>>>>>>>>>>>>>>', 1)

  if (!req.sessionID || !formId || !checkAll()) {
    console.log({ req: req.sessionID, formId, ch: checkAll() })
    return next()
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
  }).catch(() => {
    // ignore
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

  if (!req.sessionID || !formId || !checkAll()) {
    return next()
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
  }).catch(() => {
    // ignore
  })

  return next()
}
