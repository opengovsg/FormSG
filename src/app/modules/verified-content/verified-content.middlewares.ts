import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../config/logger'
import { AuthType, WithForm } from '../../../types'
import { createReqMeta } from '../../utils/request'
import { MissingFeatureError } from '../core/core.errors'
import { isFormEncryptMode } from '../form/form.utils'

import { VerifiedContentFactory } from './verified-content.factory'

const logger = createLoggerWithLabel(module)

export const encryptVerifiedSpcpFields: RequestHandler = (req, res, next) => {
  const { form } = req as WithForm<typeof req>

  // Early return if this is not a Singpass/Corppass submission.
  if (form.authType === AuthType.NIL) {
    return next()
  }

  const logMeta = {
    action: 'encryptVerifiedSpcpFields',
    formId: form._id,
    ...createReqMeta(req),
  }

  if (!isFormEncryptMode(form)) {
    logger.error({
      message: 'encryptVerifiedSpcpFields called on non-encrypt mode form',
      meta: logMeta,
    })
    return res.status(StatusCodes.UNPROCESSABLE_ENTITY).send({
      message:
        'Unable to encrypt verified SPCP fields on non storage mode forms',
    })
  }

  const encryptVerifiedContentResult = VerifiedContentFactory.getVerifiedContent(
    { type: form.authType, data: res.locals },
  ).andThen((verifiedContent) =>
    VerifiedContentFactory.encryptVerifiedContent({
      verifiedContent,
      formPublicKey: form.publicKey,
    }),
  )

  if (encryptVerifiedContentResult.isErr()) {
    const { error } = encryptVerifiedContentResult
    logger.error({
      message: 'Unable to encrypt verified content',
      meta: logMeta,
      error,
    })

    // Passthrough if feature is not activated.
    if (error instanceof MissingFeatureError) {
      return next()
    }

    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: 'Invalid data was found. Please submit again.' })
  }

  // No errors, set local variable to the encrypted string.
  res.locals.verified = encryptVerifiedContentResult.value
  return next()
}
