import Axios from 'axios'
import * as crypto from 'crypto'
import uuidGen from 'uuid-by-string'

import { ControllerHandler } from '../core/core.types'

const FORM_SUBMISSION_ENDPOINT =
  'https://webhook.site/a4d45a44-3a88-49c0-a358-bfd072290aa2'
const FORM_VIEW_ENDPOINT =
  'https://webhook.site/a4d45a44-3a88-49c0-a358-bfd072290aa2'
const FORM_FEEDBACK_ENDPOINT =
  'https://webhook.site/a4d45a44-3a88-49c0-a358-bfd072290aa2'

const generateSignature = (payload: Record<string, unknown>) => {
  const signature = crypto
    .createHmac('sha256', 'secret')
    .update(JSON.stringify(payload))
    .digest('hex')
  return signature
}
export const handleSubmit: ControllerHandler<{ formId: string }> = async (
  req,
  _,
  next,
) => {
  const { formId } = req.params

  const payload = {
    formSgId: formId,
    transactionId: uuidGen(req.sessionID || ''),
  }
  // fire and forget
  void Axios.post(FORM_SUBMISSION_ENDPOINT, payload, {
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

  const payload = {
    formSgId: formId,
    transactionId: uuidGen(req.sessionID || ''),
  }
  void Axios.post(FORM_VIEW_ENDPOINT, payload, {
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
  const payload = {
    formSgId: formId,
    transactionId: uuidGen(req.sessionID || ''),
    rating,
    comment,
  }

  void Axios.post(FORM_FEEDBACK_ENDPOINT, payload, {
    headers: {
      'WOGAA-Signature': generateSignature(payload),
    },
  }).catch(() => {
    // ignore
  })

  return next()
}
