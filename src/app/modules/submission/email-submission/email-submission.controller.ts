import { RequestHandler } from 'express'

import { CaptchaFactory } from 'src/app/services/captcha/captcha.factory'

import { FieldResponse } from '../../../../types'
import * as FormService from '../../form/form.service'

import { mapRouteError } from './email-submission.util'

export const handleEmailSubmission: RequestHandler<
  { formId: string },
  { message: string; submissionId?: string },
  { responses: FieldResponse[] },
  { captchaResponse: string | null }
> = async (req, res) => {
  // Retrieve form
  const formResult = await FormService.retrieveFullFormById(req.params.formId)
  if (formResult.isErr()) {
    const { errorMessage, statusCode } = mapRouteError(formResult.error)
    return res.status(statusCode).json({ message: errorMessage })
  }
  const form = formResult.value

  // Check that form is public
  const formPublicResult = FormService.isFormPublic(form)
  if (formPublicResult.isErr()) {
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
      const { errorMessage, statusCode } = mapRouteError(captchaResult.error)
      return res.status(statusCode).json({ message: errorMessage })
    }
  }
}
