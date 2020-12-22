import { Request, RequestHandler } from 'express'

import { createLoggerWithLabel } from '../../../../config/logger'
import { FieldResponse } from '../../../../types'
import { CaptchaFactory } from '../../../services/captcha/captcha.factory'
import { createReqMeta } from '../../../utils/request'
import * as FormService from '../../form/form.service'

import { mapRouteError } from './email-submission.util'

const logger = createLoggerWithLabel(module)

export const handleEmailSubmission: RequestHandler<
  { formId: string },
  { message: string; submissionId?: string },
  { responses: FieldResponse[] },
  { captchaResponse: string | null }
> = async (req, res) => {
  const logMeta = {
    action: 'handleEmailSubmission',
    ...createReqMeta(req as Request),
    formId: req.params.formId,
  }
  // Retrieve form
  const formResult = await FormService.retrieveFullFormById(req.params.formId)
  if (formResult.isErr()) {
    logger.error({
      message: 'Error while retrieving form from database',
      meta: logMeta,
      error: formResult.error,
    })
    const { errorMessage, statusCode } = mapRouteError(formResult.error)
    return res.status(statusCode).json({ message: errorMessage })
  }
  const form = formResult.value

  // Check that form is public
  const formPublicResult = FormService.isFormPublic(form)
  if (formPublicResult.isErr()) {
    logger.warn({
      message: 'Attempt to submit non-public form',
      meta: logMeta,
      error: formPublicResult.error,
    })
    const { errorMessage, statusCode } = mapRouteError(formPublicResult.error)
    return res.status(statusCode).json({ message: errorMessage })
  }

  // Check captcha
  if (form.hasCaptcha) {
    const captchaResult = await CaptchaFactory.verifyCaptchaResponse(
      req.query.captchaResponse,
      req.connection.remoteAddress,
    )
    if (captchaResult.isErr()) {
      logger.error({
        message: 'Error while verifying captcha',
        meta: logMeta,
        error: captchaResult.error,
      })
      const { errorMessage, statusCode } = mapRouteError(captchaResult.error)
      return res.status(statusCode).json({ message: errorMessage })
    }
  }
}
